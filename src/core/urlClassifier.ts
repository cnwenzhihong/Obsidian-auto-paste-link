import {
  BUILTIN_TRUSTED_IMAGE_SOURCES,
  type AutoPasteLinkSettings,
  type TrustedMediaSource,
} from "../settings/pluginSettings.ts";

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

  if (isTrustedMediaSource(parsedUrl, BUILTIN_TRUSTED_IMAGE_SOURCES)) {
    return true;
  }

  if (isTrustedMediaSource(parsedUrl, settings.trustedImageSources)) {
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

function isTrustedMediaSource(parsedUrl: URL, sources: TrustedMediaSource[]): boolean {
  const hostname = parsedUrl.hostname.toLowerCase();
  return sources.some((source) => {
    const hostMatches = source.includeSubdomains
      ? hostname === source.host || hostname.endsWith(`.${source.host}`)
      : hostname === source.host;

    if (!hostMatches) {
      return false;
    }

    return !source.pathPrefix || parsedUrl.pathname.startsWith(source.pathPrefix);
  });
}

function isVideoUrl(parsedUrl: URL, settings: AutoPasteLinkSettings): boolean {
  if (!settings.embedVideoLinks) {
    return false;
  }

  const extension = parsedUrl.pathname.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  if (extension && settings.videoExtensions.includes(extension)) {
    return true;
  }

  return isTrustedMediaSource(parsedUrl, settings.trustedVideoSources);
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
