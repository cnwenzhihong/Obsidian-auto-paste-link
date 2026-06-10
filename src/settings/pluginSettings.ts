export interface AutoPasteLinkSettings {
  enabled: boolean;
  processYamlFrontmatter: boolean;
  useSelectionAsLinkText: boolean;
  addNewlineAfterImage: boolean;
  imageExtensions: string[];
  imageUrlPatterns: string[];
}

export const DEFAULT_SETTINGS: AutoPasteLinkSettings = {
  enabled: true,
  processYamlFrontmatter: false,
  useSelectionAsLinkText: true,
  addNewlineAfterImage: true,
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
    ...DEFAULT_SETTINGS,
    ...value,
    imageExtensions: normalizeImageExtensions(value.imageExtensions ?? DEFAULT_SETTINGS.imageExtensions),
    imageUrlPatterns: normalizePatternList(value.imageUrlPatterns ?? DEFAULT_SETTINGS.imageUrlPatterns),
  };
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
