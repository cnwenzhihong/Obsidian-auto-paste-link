export interface TitleRequestInput {
  url: string;
  headers?: Record<string, string>;
}

export interface TitleRequestResponse {
  status: number;
  headers: Record<string, string>;
  text: string;
}

export type TitleRequest = (request: TitleRequestInput) => Promise<TitleRequestResponse>;

interface TitleRequestSpec {
  kind: string;
  request: TitleRequestInput;
}

interface TitleProvider {
  id: string;
  displayName: string;
  matches(url: URL): boolean;
  createRequests(url: URL, rawUrl: string): TitleRequestSpec[];
  parse(response: TitleRequestResponse, spec: TitleRequestSpec): string | null;
}

export interface ResolveSupportedSiteTitleOptions {
  request: TitleRequest;
  timeoutMs: number;
}

export const SUPPORTED_SITE_NAMES = [
  "bilibili",
  "YouTube",
  "Fab",
  "GitHub",
  "Stack Overflow",
  "Stack Exchange",
  "Reddit",
  "Wikipedia",
  "Steam",
  "MDN",
  "npm",
  "Zhihu",
  "Juejin",
  "CSDN",
  "WeChat Official Accounts",
  "Douban",
  "CNBlogs",
] as const;

const JSON_HEADERS = {
  Accept: "application/json,text/plain,*/*",
};

const HTML_HEADERS = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

const FAB_HTML_HEADERS = {
  ...HTML_HEADERS,
  "User-Agent": "facebookexternalhit/1.1",
};

const PROVIDERS: TitleProvider[] = [
  {
    id: "bilibili",
    displayName: "bilibili",
    matches(url) {
      return isHost(url, "bilibili.com") || isHost(url, "b23.tv");
    },
    createRequests(url, rawUrl) {
      const bvid = extractBilibiliBvid(url);
      const requests: TitleRequestSpec[] = [];
      if (bvid) {
        requests.push({
          kind: "bilibili-api",
          request: {
            url: `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`,
            headers: JSON_HEADERS,
          },
        });
      }

      requests.push({
        kind: "html",
        request: {
          url: rawUrl,
          headers: HTML_HEADERS,
        },
      });
      return requests;
    },
    parse(response, spec) {
      if (spec.kind === "bilibili-api") {
        return cleanBilibiliTitle(parseBilibiliApiTitle(response.text));
      }

      return cleanBilibiliTitle(extractHtmlTitle(response.text));
    },
  },
  {
    id: "youtube",
    displayName: "YouTube",
    matches(url) {
      return isHost(url, "youtube.com") || isHost(url, "youtu.be");
    },
    createRequests(_url, rawUrl) {
      return [
        {
          kind: "youtube-oembed",
          request: {
            url: `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(rawUrl)}`,
            headers: JSON_HEADERS,
          },
        },
        {
          kind: "html",
          request: {
            url: rawUrl,
            headers: HTML_HEADERS,
          },
        },
      ];
    },
    parse(response, spec) {
      if (spec.kind === "youtube-oembed") {
        return cleanYouTubeTitle(parseJsonTitle(response.text));
      }

      return cleanYouTubeTitle(extractHtmlTitle(response.text));
    },
  },
  {
    id: "fab",
    displayName: "Fab",
    matches(url) {
      return isHost(url, "fab.com");
    },
    createRequests(_url, rawUrl) {
      return [
        {
          kind: "html",
          request: {
            url: rawUrl,
            headers: FAB_HTML_HEADERS,
          },
        },
      ];
    },
    parse(response) {
      return cleanFabTitle(extractHtmlTitle(response.text));
    },
  },
  createHtmlTitleProvider({
    id: "github",
    displayName: "GitHub",
    domains: ["github.com"],
    suffixes: [" · GitHub", " - GitHub"],
  }),
  createHtmlTitleProvider({
    id: "stackoverflow",
    displayName: "Stack Overflow",
    domains: ["stackoverflow.com"],
    suffixes: [" - Stack Overflow"],
  }),
  createHtmlTitleProvider({
    id: "stackexchange",
    displayName: "Stack Exchange",
    domains: ["stackexchange.com", "serverfault.com", "superuser.com", "askubuntu.com"],
    suffixes: [" - Stack Exchange", " - Server Fault", " - Super User", " - Ask Ubuntu"],
  }),
  createHtmlTitleProvider({
    id: "reddit",
    displayName: "Reddit",
    domains: ["reddit.com"],
    suffixes: [" : r/reddit.com", " - Reddit"],
  }),
  createHtmlTitleProvider({
    id: "wikipedia",
    displayName: "Wikipedia",
    domains: ["wikipedia.org"],
    suffixes: [" - Wikipedia", " - 维基百科，自由的百科全书"],
  }),
  createHtmlTitleProvider({
    id: "steam",
    displayName: "Steam",
    domains: ["store.steampowered.com", "steamcommunity.com"],
    suffixes: [" on Steam", " :: Steam Community"],
  }),
  createHtmlTitleProvider({
    id: "mdn",
    displayName: "MDN",
    domains: ["developer.mozilla.org"],
    suffixes: [" | MDN", " - MDN Web Docs"],
  }),
  createHtmlTitleProvider({
    id: "npm",
    displayName: "npm",
    domains: ["npmjs.com"],
    suffixes: [" | npm"],
  }),
  createHtmlTitleProvider({
    id: "zhihu",
    displayName: "Zhihu",
    domains: ["zhihu.com", "zhuanlan.zhihu.com"],
    suffixes: [" - 知乎", " - 知乎专栏"],
  }),
  createHtmlTitleProvider({
    id: "juejin",
    displayName: "Juejin",
    domains: ["juejin.cn"],
    suffixes: [" - 掘金"],
  }),
  createHtmlTitleProvider({
    id: "csdn",
    displayName: "CSDN",
    domains: ["blog.csdn.net", "csdn.net"],
    suffixes: ["-CSDN博客", "_csdn", " - CSDN博客"],
  }),
  createHtmlTitleProvider({
    id: "wechat",
    displayName: "WeChat Official Accounts",
    domains: ["mp.weixin.qq.com"],
    suffixes: [" - 微信公众平台"],
  }),
  createHtmlTitleProvider({
    id: "douban",
    displayName: "Douban",
    domains: ["douban.com"],
    suffixes: [" (豆瓣)", " | 豆瓣"],
  }),
  createHtmlTitleProvider({
    id: "cnblogs",
    displayName: "CNBlogs",
    domains: ["cnblogs.com"],
    suffixes: [" - 博客园"],
  }),
];

export function getSupportedTitleProvider(url: string): string | null {
  const parsedUrl = parseHttpUrl(url);
  return parsedUrl ? PROVIDERS.find((provider) => provider.matches(parsedUrl))?.displayName ?? null : null;
}

export async function resolveSupportedSiteTitle(
  url: string,
  options: ResolveSupportedSiteTitleOptions
): Promise<string | null> {
  const parsedUrl = parseHttpUrl(url);
  if (!parsedUrl) {
    return null;
  }

  const provider = PROVIDERS.find((candidate) => candidate.matches(parsedUrl));
  if (!provider) {
    return null;
  }

  const deadline = Date.now() + options.timeoutMs;
  for (const spec of provider.createRequests(parsedUrl, url)) {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      return null;
    }

    const response = await withTimeout(options.request(spec.request), remainingMs).catch(() => null);
    if (!response || response.status >= 400) {
      continue;
    }

    const title = normalizeTitle(provider.parse(response, spec));
    if (title) {
      return title;
    }
  }

  return null;
}

export function extractHtmlTitle(html: string): string | null {
  return (
    extractMetaContent(html, ["og:title"]) ??
    extractMetaContent(html, ["twitter:title"]) ??
    extractTitleTag(html)
  );
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

interface HtmlTitleProviderOptions {
  id: string;
  displayName: string;
  domains: string[];
  suffixes: string[];
}

function createHtmlTitleProvider(options: HtmlTitleProviderOptions): TitleProvider {
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
      return cleanSiteSuffix(extractHtmlTitle(response.text), options.suffixes);
    },
  };
}

function extractBilibiliBvid(url: URL): string | null {
  return url.pathname.match(/\/video\/(BV[a-zA-Z0-9]+)/)?.[1] ?? null;
}

function parseBilibiliApiTitle(text: string): string | null {
  try {
    const data = JSON.parse(text) as { data?: { title?: unknown } };
    return typeof data.data?.title === "string" ? data.data.title : null;
  } catch {
    return null;
  }
}

function parseJsonTitle(text: string): string | null {
  try {
    const data = JSON.parse(text) as { title?: unknown };
    return typeof data.title === "string" ? data.title : null;
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

function cleanSiteSuffix(title: string | null, suffixes: string[]): string | null {
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

function normalizeTitle(title: string | null): string | null {
  const normalized = title?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : null;
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

function isHost(url: URL, domain: string): boolean {
  return url.hostname === domain || url.hostname.endsWith(`.${domain}`);
}

function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error("Title request timed out")), timeoutMs);
    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timeoutId);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    );
  });
}
