import type { TitleProvider } from "./types.ts";

export const JSON_HEADERS = {
  Accept: "application/json,text/plain,*/*",
};

export const HTML_HEADERS = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

interface HtmlTitleProviderOptions {
  id: string;
  displayName: string;
  domains: string[];
  suffixes: string[];
  preferTitleTag?: boolean;
}

export function createHtmlTitleProvider(options: HtmlTitleProviderOptions): TitleProvider {
  return {
    id: options.id,
    displayName: options.displayName,
    matches(url) {
      return options.domains.some((domain) => isHost(url, domain));
    },
    createRequests(_url, rawUrl) {
      return [
        {
          kind: "html",
          request: {
            url: rawUrl,
            headers: HTML_HEADERS,
          },
        },
      ];
    },
    parse(response) {
      const title = options.preferTitleTag
        ? extractTitleTag(response.text) ?? extractHtmlTitle(response.text)
        : extractHtmlTitle(response.text);
      return cleanSiteSuffix(title, options.suffixes);
    },
  };
}

export function extractHtmlTitle(html: string): string | null {
  return (
    extractMetaContent(html, ["og:title"]) ??
    extractMetaContent(html, ["twitter:title"]) ??
    extractTitleTag(html)
  );
}

export function extractGenericHtmlTitle(html: string, url: URL): string | null {
  const socialTitle = extractMetaContent(html, ["og:title"]) ?? extractMetaContent(html, ["twitter:title"]);
  if (socialTitle) {
    return normalizeGenericTitle(socialTitle);
  }

  return cleanGenericTitle(extractTitleTag(html), url);
}

export function cleanBilibiliTitle(title: string | null): string | null {
  return cleanSiteSuffix(title, [
    "_哔哩哔哩_bilibili",
    "-哔哩哔哩_Bilibili",
    " - 哔哩哔哩",
    " - bilibili",
  ]);
}

export function cleanYouTubeTitle(title: string | null): string | null {
  return cleanSiteSuffix(title, [" - YouTube"]);
}

export function cleanFabTitle(title: string | null): string | null {
  return cleanSiteSuffix(title, [" | Fab", " - Fab"]);
}

export function cleanSteamTitle(title: string | null): string | null {
  let result = cleanSiteSuffix(title, [" on Steam", " :: Steam Community"]);
  if (!result) {
    return null;
  }

  result = result
    .replace(/^Save\s+\d+%\s+on\s+/i, "")
    .replace(/^在\s*Steam\s*上购买\s*/i, "")
    .replace(/\s+立省\s*\d+%$/i, "")
    .trim();

  return normalizeTitle(result);
}

export function cleanCsdnTitle(title: string | null): string | null {
  let result = cleanSiteSuffix(title, ["-CSDN博客", "_csdn", " - CSDN博客"]);
  if (!result) {
    return null;
  }

  const seoTail = result.match(/^(.+)_([a-z0-9][a-z0-9+.# -]{0,48})$/i);
  if (seoTail && /\s/.test(seoTail[2])) {
    result = seoTail[1].trim();
  }

  return normalizeTitle(result);
}

export function parseBilibiliApiTitle(text: string): string | null {
  try {
    const data = JSON.parse(text) as { data?: { title?: unknown } };
    return typeof data.data?.title === "string" ? data.data.title : null;
  } catch {
    return null;
  }
}

export function parseJsonTitle(text: string): string | null {
  try {
    const data = JSON.parse(text) as { title?: unknown };
    return typeof data.title === "string" ? data.title : null;
  } catch {
    return null;
  }
}

export function cleanSiteSuffix(title: string | null, suffixes: string[]): string | null {
  let result = normalizeTitle(title);
  if (!result) {
    return null;
  }

  for (const suffix of suffixes) {
    if (result.toLowerCase().endsWith(suffix.toLowerCase())) {
      result = result.slice(0, -suffix.length).trim();
    }
  }

  return normalizeTitle(result);
}

export function normalizeTitle(title: string | null): string | null {
  const normalized = title?.replace(/\s+/g, " ").trim();
  if (!normalized || !isTitleUsable(normalized)) {
    return null;
  }

  return normalized;
}

export function normalizeGenericTitle(title: string | null): string | null {
  const normalized = normalizeTitle(title);
  if (!normalized || isUrlLikeTitle(normalized) || normalized.length > 120) {
    return null;
  }

  return normalized;
}

export function isHost(url: URL, domain: string): boolean {
  return url.hostname === domain || url.hostname.endsWith(`.${domain}`);
}

export function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function extractMetaContent(html: string, keys: string[]): string | null {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const normalizedKeys = new Set(keys.map((key) => key.toLowerCase()));

  for (const tag of metaTags) {
    const property = getAttribute(tag, "property")?.toLowerCase();
    const name = getAttribute(tag, "name")?.toLowerCase();
    if (!property && !name) {
      continue;
    }

    if (normalizedKeys.has(property ?? "") || normalizedKeys.has(name ?? "")) {
      const content = getAttribute(tag, "content");
      if (content) {
        return decodeHtml(content);
      }
    }
  }

  return null;
}

function extractTitleTag(html: string): string | null {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtml(match[1]) : null;
}

function getAttribute(tag: string, name: string): string | null {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const match = tag.match(pattern);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&#x([a-f0-9]+);/gi, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanGenericTitle(title: string | null, url: URL): string | null {
  const normalized = normalizeGenericTitle(title);
  if (!normalized) {
    return null;
  }

  const delimiterPattern = /\s(?:[-|—–_])\s|_/g;
  const matches = [...normalized.matchAll(delimiterPattern)];
  if (matches.length === 0) {
    return normalized;
  }

  if (matches.length > 1) {
    return null;
  }

  const delimiterIndex = matches[0].index ?? -1;
  if (delimiterIndex <= 0) {
    return null;
  }

  const suffix = normalized.slice(delimiterIndex + matches[0][0].length).trim();
  const prefix = normalized.slice(0, delimiterIndex).trim();
  if (!prefix || !isHostRelatedSuffix(suffix, url)) {
    return null;
  }

  return normalizeGenericTitle(prefix);
}

function isHostRelatedSuffix(suffix: string, url: URL): boolean {
  const normalizedSuffix = suffix.toLowerCase().replace(/\s+/g, "");
  const hostParts = url.hostname.toLowerCase().replace(/^www\./, "").split(".");
  const domainName = hostParts.length > 1 ? hostParts[hostParts.length - 2] : hostParts[0];
  return Boolean(domainName && normalizedSuffix.includes(domainName));
}

function isTitleUsable(title: string): boolean {
  const normalized = title.toLowerCase();
  return !(
    normalized === "知乎" ||
    normalized === "just a moment..." ||
    normalized === "access denied" ||
    normalized === "client challenge" ||
    normalized === "forbidden" ||
    normalized === "error" ||
    normalized === "not found" ||
    normalized === "reddit - please wait for verification" ||
    normalized.includes("please wait for verification") ||
    normalized.includes("attention required! | cloudflare")
  );
}

function isUrlLikeTitle(title: string): boolean {
  return /^https?:\/\//i.test(title) || /^[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(title);
}
