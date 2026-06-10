export interface AutoPasteLinkSettings {
  processYamlFrontmatter: boolean;
  useSelectionAsLinkText: boolean;
  addNewlineAfterImage: boolean;
  fetchSupportedSiteTitle: boolean;
  titleFetchTimeoutMs: number;
  imageExtensions: string[];
  imageUrlPatterns: string[];
}

export const DEFAULT_SETTINGS: AutoPasteLinkSettings = {
  processYamlFrontmatter: false,
  useSelectionAsLinkText: true,
  addNewlineAfterImage: true,
  fetchSupportedSiteTitle: true,
  titleFetchTimeoutMs: 3000,
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
  imageUrlPatterns: [
    "^https?:\\/\\/(?:images\\.unsplash\\.com|i\\.imgur\\.com)\\/",
    "[?&](?:format|fm|type|mime)=([^&#]*)(?:jpg|jpeg|png|gif|webp|avif|svg)"
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
    imageExtensions: normalizeImageExtensions(value.imageExtensions ?? DEFAULT_SETTINGS.imageExtensions),
    imageUrlPatterns: normalizePatternList(value.imageUrlPatterns ?? DEFAULT_SETTINGS.imageUrlPatterns),
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

export function normalizePatternList(value: string[] | string): string[] {
  return normalizeLineList(value);
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
