import type { AutoPasteLinkSettings } from "../settings/pluginSettings";

export type UrlKind = "normal-link" | "image-link" | "video-link" | "unsupported";

export interface UrlClassification {
  kind: UrlKind;
  url: string;
}

export function classifyUrlText(text: string, settings: AutoPasteLinkSettings): UrlClassification {
  const candidate = unwrapSingleUrl(text.trim());
  if (!candidate || /\s/.test(candidate)) {
    return unsupported();
  }

  const parsedUrl = parseHttpUrl(candidate);
  if (!parsedUrl) {
    return unsupported();
  }

  if (isImageUrl(candidate, parsedUrl, settings)) {
    return {
      kind: "image-link",
      url: candidate,
    };
  }

  if (isVideoUrl(parsedUrl, settings)) {
    return {
      kind: "video-link",
      url: candidate,
    };
  }

  return {
    kind: "normal-link",
    url: candidate,
  };
}

function isImageUrl(rawUrl: string, parsedUrl: URL, settings: AutoPasteLinkSettings): boolean {
  if (!settings.embedImageLinks) {
    return false;
  }

  const pathname = parsedUrl.pathname.toLowerCase();
  const extension = pathname.match(/\.([a-z0-9]+)$/)?.[1];
  if (extension && settings.imageExtensions.includes(extension)) {
    return true;
  }

  return settings.imageUrlPatterns.some((pattern) => {
    try {
      return new RegExp(pattern, "i").test(rawUrl);
    } catch {
      return false;
    }
  });
}

function isVideoUrl(parsedUrl: URL, settings: AutoPasteLinkSettings): boolean {
  if (!settings.embedVideoLinks) {
    return false;
  }

  const extension = parsedUrl.pathname.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return extension ? settings.videoExtensions.includes(extension) : false;
}

function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function unwrapSingleUrl(value: string): string {
  if (value.length < 2) {
    return value;
  }

  const wrappers: Array<[string, string]> = [
    ["<", ">"],
    ['"', '"'],
    ["'", "'"],
  ];

  for (const [start, end] of wrappers) {
    if (value.startsWith(start) && value.endsWith(end)) {
      return value.slice(start.length, -end.length).trim();
    }
  }

  return value;
}

function unsupported(): UrlClassification {
  return {
    kind: "unsupported",
    url: "",
  };
}
