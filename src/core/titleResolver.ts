import {
  SUPPORTED_SITE_GROUPS,
  SUPPORTED_SITE_NAMES,
  TITLE_PROVIDERS,
} from "./titleProviders/providers.ts";
import type {
  GitHubTitleFormat,
  SupportedSiteGroup,
  TitleRequest,
  TitleRequestInput,
  TitleRequestResponse,
  TitleResolveContext,
} from "./titleProviders/types.ts";
import { extractGenericHtmlTitle, HTML_HEADERS, normalizeTitle, parseHttpUrl } from "./titleProviders/utils.ts";

export {
  cleanBilibiliTitle,
  cleanCsdnTitle,
  cleanFabTitle,
  cleanSteamTitle,
  cleanYouTubeTitle,
  extractGenericHtmlTitle,
  extractHtmlTitle,
} from "./titleProviders/utils.ts";

export { SUPPORTED_SITE_GROUPS, SUPPORTED_SITE_NAMES };
export type { GitHubTitleFormat, SupportedSiteGroup, TitleRequest, TitleRequestInput, TitleRequestResponse };

export interface ResolveSupportedSiteTitleOptions {
  request: TitleRequest;
  timeoutMs: number;
  githubTitleFormat?: GitHubTitleFormat;
  fetchGenericSiteTitle?: boolean;
}

export function getSupportedTitleProvider(url: string): string | null {
  const parsedUrl = parseHttpUrl(url);
  return parsedUrl ? TITLE_PROVIDERS.find((provider) => provider.matches(parsedUrl))?.displayName ?? null : null;
}

export async function resolveSupportedSiteTitle(
  url: string,
  options: ResolveSupportedSiteTitleOptions
): Promise<string | null> {
  const parsedUrl = parseHttpUrl(url);
  if (!parsedUrl) {
    return null;
  }

  const provider = TITLE_PROVIDERS.find((candidate) => candidate.matches(parsedUrl));
  if (!provider && !options.fetchGenericSiteTitle) {
    return null;
  }

  const context: TitleResolveContext = {
    githubTitleFormat: options.githubTitleFormat ?? "owner-repository",
  };

  const deadline = Date.now() + options.timeoutMs;
  const requestSpecs = provider?.createRequests(parsedUrl, url) ?? [
    {
      kind: "generic-html",
      request: {
        url,
        headers: HTML_HEADERS,
      },
    },
  ];

  for (const spec of requestSpecs) {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      return null;
    }

    const response = await withTimeout(options.request(spec.request), remainingMs).catch(() => null);
    if (!response || response.status >= 400) {
      continue;
    }

    const title = normalizeTitle(
      provider ? provider.parse(response, spec, context) : extractGenericHtmlTitle(response.text, parsedUrl)
    );
    if (title) {
      return title;
    }
  }

  return normalizeTitle(provider?.fallbackTitle?.(parsedUrl, url, context) ?? null);
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
