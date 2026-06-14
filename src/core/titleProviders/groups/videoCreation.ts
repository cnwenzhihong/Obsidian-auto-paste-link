import type { TitleProvider, TitleRequestSpec } from "../types.ts";
import {
  cleanBilibiliTitle,
  cleanFabTitle,
  cleanSteamTitle,
  cleanYouTubeTitle,
  extractHtmlTitle,
  HTML_HEADERS,
  isHost,
  JSON_HEADERS,
  parseBilibiliApiTitle,
  parseJsonTitle,
} from "../utils.ts";

const FAB_HTML_HEADERS = {
  ...HTML_HEADERS,
  "User-Agent": "facebookexternalhit/1.1",
};

const bilibiliProvider: TitleProvider = {
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
};

const youtubeProvider: TitleProvider = {
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
};

const fabProvider: TitleProvider = {
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
};

const steamProvider: TitleProvider = {
  id: "steam",
  displayName: "Steam",
  matches(url) {
    return isHost(url, "store.steampowered.com") || isHost(url, "steamcommunity.com");
  },
  createRequests(url, rawUrl) {
    const appId = extractSteamAppId(url);
    const requests: TitleRequestSpec[] = [];
    if (appId) {
      requests.push({
        kind: "steam-appdetails",
        request: {
          url: `https://store.steampowered.com/api/appdetails?appids=${encodeURIComponent(appId)}&filters=basic&l=${getSteamLanguage()}`,
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
    if (spec.kind === "steam-appdetails") {
      return parseSteamAppDetailsTitle(response.text);
    }

    return cleanSteamTitle(extractHtmlTitle(response.text));
  },
};

export const videoCreationProviders: readonly TitleProvider[] = [
  bilibiliProvider,
  youtubeProvider,
  fabProvider,
  steamProvider,
];

function extractBilibiliBvid(url: URL): string | null {
  return url.pathname.match(/\/video\/(BV[a-zA-Z0-9]+)/)?.[1] ?? null;
}

function extractSteamAppId(url: URL): string | null {
  return url.pathname.match(/^\/app\/(\d+)(?:\/|$)/)?.[1] ?? null;
}

function parseSteamAppDetailsTitle(text: string): string | null {
  try {
    const data = JSON.parse(text) as Record<string, { success?: boolean; data?: { name?: unknown } }>;
    const app = Object.values(data)[0];
    return app?.success && typeof app.data?.name === "string" ? app.data.name : null;
  } catch {
    return null;
  }
}

function getSteamLanguage(): string {
  const language = typeof activeWindow === "undefined" ? "" : activeWindow.navigator.language.toLowerCase();
  return language.startsWith("zh") ? "schinese" : "english";
}
