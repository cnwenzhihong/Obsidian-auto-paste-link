export interface AutoPasteLinkSettings {
  processYamlFrontmatter: boolean;
  useSelectionAsLinkText: boolean;
  addNewlineAfterImage: boolean;
  fetchSupportedSiteTitle: boolean;
  titleFetchTimeoutMs: number;
  embedImageLinks: boolean;
  embedVideoLinks: boolean;
  imageExtensions: string[];
  trustedImageSources: TrustedImageSource[];
  imageUrlPatterns: string[];
  videoExtensions: string[];
}

export interface TrustedImageSource {
  host: string;
  pathPrefix: string;
  includeSubdomains: boolean;
}

export const BUILTIN_TRUSTED_IMAGE_SOURCES: TrustedImageSource[] = [
  {
    host: "images.unsplash.com",
    pathPrefix: "",
    includeSubdomains: false,
  },
  {
    host: "i.imgur.com",
    pathPrefix: "",
    includeSubdomains: false,
  },
  {
    host: "images.steamusercontent.com",
    pathPrefix: "",
    includeSubdomains: false,
  },
  {
    host: "pbs.twimg.com",
    pathPrefix: "/media/",
    includeSubdomains: false,
  },
  {
    host: "i.ytimg.com",
    pathPrefix: "/vi/",
    includeSubdomains: false,
  },
  {
    host: "img.youtube.com",
    pathPrefix: "/vi/",
    includeSubdomains: false,
  },
  {
    host: "i0.hdslb.com",
    pathPrefix: "/bfs/",
    includeSubdomains: false,
  },
  {
    host: "i1.hdslb.com",
    pathPrefix: "/bfs/",
    includeSubdomains: false,
  },
  {
    host: "i2.hdslb.com",
    pathPrefix: "/bfs/",
    includeSubdomains: false,
  },
];

export const DEFAULT_SETTINGS: AutoPasteLinkSettings = {
  processYamlFrontmatter: false,
  useSelectionAsLinkText: true,
  addNewlineAfterImage: true,
  fetchSupportedSiteTitle: true,
  titleFetchTimeoutMs: 3000,
  embedImageLinks: true,
  embedVideoLinks: true,
  imageExtensions: [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "bmp",
    "svg",
    "avif"
  ],
  trustedImageSources: [],
  imageUrlPatterns: [
    "[?&](?:format|fm|type|mime)=([^&#]*)(?:jpg|jpeg|png|gif|webp|avif|svg)"
  ],
  videoExtensions: [
    "mp4"
  ]
};

export function normalizeSettings(value: Partial<AutoPasteLinkSettings>): AutoPasteLinkSettings {
  return {
    processYamlFrontmatter: value.processYamlFrontmatter ?? DEFAULT_SETTINGS.processYamlFrontmatter,
    useSelectionAsLinkText: value.useSelectionAsLinkText ?? DEFAULT_SETTINGS.useSelectionAsLinkText,
    addNewlineAfterImage: value.addNewlineAfterImage ?? DEFAULT_SETTINGS.addNewlineAfterImage,
    fetchSupportedSiteTitle: value.fetchSupportedSiteTitle ?? DEFAULT_SETTINGS.fetchSupportedSiteTitle,
    titleFetchTimeoutMs: normalizeTitleFetchTimeoutMs(
      value.titleFetchTimeoutMs ?? DEFAULT_SETTINGS.titleFetchTimeoutMs
    ),
    embedImageLinks: value.embedImageLinks ?? DEFAULT_SETTINGS.embedImageLinks,
    embedVideoLinks: value.embedVideoLinks ?? DEFAULT_SETTINGS.embedVideoLinks,
    imageExtensions: normalizeImageExtensions(value.imageExtensions ?? DEFAULT_SETTINGS.imageExtensions),
    trustedImageSources: normalizeTrustedImageSources(
      value.trustedImageSources ?? DEFAULT_SETTINGS.trustedImageSources
    ),
    imageUrlPatterns: normalizePatternList(value.imageUrlPatterns ?? DEFAULT_SETTINGS.imageUrlPatterns),
    videoExtensions: normalizeVideoExtensions(value.videoExtensions ?? DEFAULT_SETTINGS.videoExtensions),
  };
}

export function normalizeTitleFetchTimeoutMs(value: number | string): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_SETTINGS.titleFetchTimeoutMs;
  }

  return Math.max(100, Math.min(10000, Math.trunc(parsed)));
}

export function normalizeImageExtensions(value: string[] | string): string[] {
  return normalizeLineList(value)
    .map((item) => item.replace(/^\./, "").toLowerCase())
    .filter((item) => /^[a-z0-9]+$/.test(item));
}

export function normalizeVideoExtensions(value: string[] | string): string[] {
  return normalizeImageExtensions(value);
}

export function normalizePatternList(value: string[] | string): string[] {
  return normalizeLineList(value);
}

export function normalizeTrustedImageSources(value: TrustedImageSource[]): TrustedImageSource[] {
  const seen = new Set<string>();
  const result: TrustedImageSource[] = [];

  for (const source of value) {
    const host = normalizeTrustedImageSourceHost(source.host);
    if (!host) {
      continue;
    }

    const pathPrefix = normalizeTrustedImageSourcePathPrefix(source.pathPrefix);
    const includeSubdomains = Boolean(source.includeSubdomains);
    const key = `${host}\n${pathPrefix}\n${includeSubdomains}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push({
      host,
      pathPrefix,
      includeSubdomains,
    });
  }

  return result;
}

function normalizeLineList(value: string[] | string): string[] {
  const rawItems = Array.isArray(value) ? value : value.split(/[\n,]/);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const rawItem of rawItems) {
    const item = rawItem.trim();
    if (!item || seen.has(item)) {
      continue;
    }

    seen.add(item);
    result.push(item);
  }

  return result;
}

function normalizeTrustedImageSourceHost(value: string): string | null {
  const rawHost = value.trim().toLowerCase();
  if (!rawHost) {
    return null;
  }

  let host = rawHost;
  try {
    host = new URL(rawHost.includes("://") ? rawHost : `https://${rawHost}`).hostname.toLowerCase();
  } catch {
    return null;
  }

  return /^[a-z0-9.-]+$/.test(host) ? host : null;
}

function normalizeTrustedImageSourcePathPrefix(value: string): string {
  const pathPrefix = value.trim();
  if (!pathPrefix || pathPrefix === "/") {
    return "";
  }

  return pathPrefix.startsWith("/") ? pathPrefix : `/${pathPrefix}`;
}
