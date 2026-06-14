import type { TitleProvider } from "../types.ts";
import {
  cleanSiteSuffix,
  createHtmlTitleProvider,
  extractHtmlTitle,
  isHost,
  JSON_HEADERS,
  normalizeTitle,
  parseJsonTitle,
} from "../utils.ts";

const tmdbProvider = createHtmlTitleProvider({
  id: "tmdb",
  displayName: "TMDb",
  domains: ["themoviedb.org"],
  suffixes: [" — The Movie Database (TMDB)", " - The Movie Database (TMDB)"],
});

const rottenTomatoesProvider = createHtmlTitleProvider({
  id: "rotten-tomatoes",
  displayName: "Rotten Tomatoes",
  domains: ["rottentomatoes.com"],
  suffixes: [" | Rotten Tomatoes"],
});

const myAnimeListProvider = createHtmlTitleProvider({
  id: "myanimelist",
  displayName: "MyAnimeList",
  domains: ["myanimelist.net"],
  suffixes: [" - MyAnimeList.net"],
});

const bangumiProvider = createHtmlTitleProvider({
  id: "bangumi",
  displayName: "Bangumi",
  domains: ["bangumi.tv", "bgm.tv", "chii.in"],
  suffixes: [" | Bangumi 番组计划", " | Bangumi"],
});

const letterboxdProvider: TitleProvider = {
  id: "letterboxd",
  displayName: "Letterboxd",
  matches(url) {
    return isHost(url, "letterboxd.com");
  },
  createRequests(_url, rawUrl) {
    return [
      {
        kind: "html",
        request: {
          url: rawUrl,
        },
      },
    ];
  },
  parse(response) {
    return cleanLetterboxdTitle(extractHtmlTitle(response.text));
  },
};

const spotifyProvider = createOEmbedProvider({
  id: "spotify",
  displayName: "Spotify",
  domains: ["open.spotify.com"],
  endpoint: "https://open.spotify.com/oembed",
});

const dailymotionProvider = createOEmbedProvider({
  id: "dailymotion",
  displayName: "Dailymotion",
  domains: ["dailymotion.com", "dai.ly"],
  endpoint: "https://www.dailymotion.com/services/oembed",
});

export const entertainmentProviders: readonly TitleProvider[] = [
  tmdbProvider,
  letterboxdProvider,
  rottenTomatoesProvider,
  myAnimeListProvider,
  bangumiProvider,
  spotifyProvider,
  dailymotionProvider,
];

function createOEmbedProvider(options: {
  id: string;
  displayName: string;
  domains: string[];
  endpoint: string;
}): TitleProvider {
  return {
    id: options.id,
    displayName: options.displayName,
    matches(url) {
      return options.domains.some((domain) => isHost(url, domain));
    },
    createRequests(_url, rawUrl) {
      return [
        {
          kind: "oembed",
          request: {
            url: `${options.endpoint}?url=${encodeURIComponent(rawUrl)}`,
            headers: JSON_HEADERS,
          },
        },
      ];
    },
    parse(response) {
      return parseJsonTitle(response.text);
    },
  };
}

function cleanLetterboxdTitle(title: string | null): string | null {
  let result = cleanSiteSuffix(title?.replace(/\u200e/g, "") ?? null, [" • Letterboxd"]);
  if (!result) {
    return null;
  }

  result = result.split(" directed by ")[0]?.trim() ?? result;
  result = result.split(" • ")[0]?.trim() ?? result;

  return normalizeTitle(result);
}
