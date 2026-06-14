import type { TitleProvider } from "../types.ts";
import { cleanSiteSuffix, createHtmlTitleProvider, extractHtmlTitle, HTML_HEADERS, isHost } from "../utils.ts";

const redditProvider = createHtmlTitleProvider({
  id: "reddit",
  displayName: "Reddit",
  domains: ["reddit.com"],
  suffixes: [" : r/reddit.com", " - Reddit"],
});

const wikipediaProvider: TitleProvider = {
  id: "wikipedia",
  displayName: "Wikipedia",
  matches(url) {
    return isHost(url, "wikipedia.org");
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
    return cleanSiteSuffix(extractHtmlTitle(response.text), [" - Wikipedia", " - 维基百科，自由的百科全书"]);
  },
  fallbackTitle(url) {
    return extractWikipediaPathTitle(url);
  },
};

export const communityKnowledgeProviders: readonly TitleProvider[] = [
  redditProvider,
  wikipediaProvider,
];

function extractWikipediaPathTitle(url: URL): string | null {
  const match = url.pathname.match(/^\/wiki\/(.+)$/);
  return match ? decodeURIComponent(match[1]).replace(/_/g, " ") : null;
}
