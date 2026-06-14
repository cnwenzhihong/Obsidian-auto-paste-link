import type { TitleProvider, TitleRequestSpec } from "../types.ts";
import {
  cleanSiteSuffix,
  createHtmlTitleProvider,
  extractHtmlTitle,
  HTML_HEADERS,
  isHost,
  JSON_HEADERS,
} from "../utils.ts";

const githubProvider: TitleProvider = {
  id: "github",
  displayName: "GitHub",
  matches(url) {
    return isHost(url, "github.com");
  },
  createRequests(_url, rawUrl) {
    return createHtmlRequest(rawUrl);
  },
  parse(response, spec, context) {
    const repositoryName = formatRepositoryPathTitle(spec.request.url, context.githubTitleFormat);
    if (repositoryName) {
      return repositoryName;
    }

    return cleanSiteSuffix(extractHtmlTitle(response.text), [" · GitHub", " - GitHub"]);
  },
};

const gitlabProvider: TitleProvider = {
  id: "gitlab",
  displayName: "GitLab",
  matches(url) {
    return isHost(url, "gitlab.com");
  },
  createRequests(_url, rawUrl) {
    return createHtmlRequest(rawUrl);
  },
  parse(response, spec) {
    return formatGitLabProjectPath(spec.request.url) ?? cleanSiteSuffix(extractHtmlTitle(response.text), [" · GitLab"]);
  },
};

const giteeProvider: TitleProvider = {
  id: "gitee",
  displayName: "Gitee",
  matches(url) {
    return isHost(url, "gitee.com");
  },
  createRequests(_url, rawUrl) {
    return createHtmlRequest(rawUrl);
  },
  parse(response, spec) {
    return formatGiteeProjectPath(spec.request.url) ?? cleanSiteSuffix(extractHtmlTitle(response.text), [" - Gitee.com"]);
  },
};

const npmProvider: TitleProvider = {
  id: "npm",
  displayName: "npm",
  matches(url) {
    return isHost(url, "npmjs.com");
  },
  createRequests(url, rawUrl) {
    const packageName = extractNpmPackageName(url);
    return packageName
      ? [
          {
            kind: "npm-registry",
            request: {
              url: `https://registry.npmjs.org/${encodeURIComponent(packageName)}`,
              headers: JSON_HEADERS,
            },
          },
          ...createHtmlRequest(rawUrl),
        ]
      : createHtmlRequest(rawUrl);
  },
  parse(response, spec) {
    if (spec.kind === "npm-registry") {
      return parseJsonName(response.text);
    }

    return cleanSiteSuffix(extractHtmlTitle(response.text), [" | npm"]);
  },
};

const pypiProvider: TitleProvider = {
  id: "pypi",
  displayName: "PyPI",
  matches(url) {
    return isHost(url, "pypi.org");
  },
  createRequests(url, rawUrl) {
    const packageName = extractPathPart(url, /^\/project\/([^/]+)/);
    return packageName
      ? [
          {
            kind: "pypi-json",
            request: {
              url: `https://pypi.org/pypi/${encodeURIComponent(packageName)}/json`,
              headers: JSON_HEADERS,
            },
          },
          ...createHtmlRequest(rawUrl),
        ]
      : createHtmlRequest(rawUrl);
  },
  parse(response, spec) {
    if (spec.kind === "pypi-json") {
      return parsePyPiName(response.text);
    }

    return cleanSiteSuffix(extractHtmlTitle(response.text), [" · PyPI"]);
  },
};

const cratesProvider: TitleProvider = {
  id: "crates",
  displayName: "crates.io",
  matches(url) {
    return isHost(url, "crates.io");
  },
  createRequests(_url, rawUrl) {
    return createHtmlRequest(rawUrl);
  },
  parse(response, spec) {
    return extractCrateName(new URL(spec.request.url)) ?? cleanSiteSuffix(extractHtmlTitle(response.text), [" | Rust Package Registry"]);
  },
};

const goPackagesProvider = createHtmlTitleProvider({
  id: "go-packages",
  displayName: "Go Packages",
  domains: ["pkg.go.dev"],
  suffixes: [" - Go Packages"],
});

const appleDeveloperProvider = createHtmlTitleProvider({
  id: "apple-developer",
  displayName: "Apple Developer",
  domains: ["developer.apple.com"],
  suffixes: [" | Apple Developer Documentation"],
});

const unityProvider = createHtmlTitleProvider({
  id: "unity",
  displayName: "Unity",
  domains: ["unity.com"],
  suffixes: [" | Unity"],
});

const nextjsProvider = createHtmlTitleProvider({
  id: "nextjs",
  displayName: "Next.js",
  domains: ["nextjs.org"],
  suffixes: [" | Next.js"],
});

const vueProvider = createHtmlTitleProvider({
  id: "vue",
  displayName: "Vue.js",
  domains: ["vuejs.org"],
  suffixes: [" | Vue.js"],
  preferTitleTag: true,
});

const nodejsProvider = createHtmlTitleProvider({
  id: "nodejs",
  displayName: "Node.js",
  domains: ["nodejs.org"],
  suffixes: [" | Node.js Learn", " | Node.js"],
});

const stackOverflowProvider = createHtmlTitleProvider({
  id: "stackoverflow",
  displayName: "Stack Overflow",
  domains: ["stackoverflow.com"],
  suffixes: [" - Stack Overflow"],
});

const stackExchangeProvider = createHtmlTitleProvider({
  id: "stackexchange",
  displayName: "Stack Exchange",
  domains: ["stackexchange.com", "serverfault.com", "superuser.com", "askubuntu.com"],
  suffixes: [" - Stack Exchange", " - Server Fault", " - Super User", " - Ask Ubuntu"],
});

const mdnProvider = createHtmlTitleProvider({
  id: "mdn",
  displayName: "MDN",
  domains: ["developer.mozilla.org"],
  suffixes: [" | MDN", " - MDN Web Docs"],
});

export const codeDevelopmentProviders: readonly TitleProvider[] = [
  githubProvider,
  gitlabProvider,
  giteeProvider,
  stackOverflowProvider,
  stackExchangeProvider,
  mdnProvider,
  npmProvider,
  pypiProvider,
  cratesProvider,
  goPackagesProvider,
  appleDeveloperProvider,
  unityProvider,
  nextjsProvider,
  vueProvider,
  nodejsProvider,
];

function createHtmlRequest(rawUrl: string): TitleRequestSpec[] {
  return [
    {
      kind: "html",
      request: {
        url: rawUrl,
        headers: HTML_HEADERS,
      },
    },
  ];
}

function formatRepositoryPathTitle(
  rawUrl: string,
  format: "repository" | "owner-repository" | "github-owner-repository"
): string | null {
  const url = new URL(rawUrl);
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 2) {
    return null;
  }

  const repository = `${parts[0]}/${parts[1]}`;
  if (format === "repository") {
    return parts[1];
  }

  return format === "github-owner-repository" ? `GitHub - ${repository}` : repository;
}

function formatGitLabProjectPath(rawUrl: string): string | null {
  const parts = new URL(rawUrl).pathname.split("/").filter(Boolean);
  const separatorIndex = parts.indexOf("-");
  const projectParts = separatorIndex >= 0 ? parts.slice(0, separatorIndex) : parts;
  return projectParts.length >= 2 ? projectParts.join("/") : null;
}

function formatGiteeProjectPath(rawUrl: string): string | null {
  const parts = new URL(rawUrl).pathname.split("/").filter(Boolean);
  return parts.length === 2 ? `${parts[0]}/${parts[1]}` : null;
}

function extractNpmPackageName(url: URL): string | null {
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] !== "package" || parts.length < 2) {
    return null;
  }

  return parts[1].startsWith("@") && parts[2] ? `${parts[1]}/${parts[2]}` : parts[1];
}

function extractPathPart(url: URL, pattern: RegExp): string | null {
  return url.pathname.match(pattern)?.[1] ?? null;
}

function parseJsonName(text: string): string | null {
  try {
    const data = JSON.parse(text) as { name?: unknown };
    return typeof data.name === "string" ? data.name : null;
  } catch {
    return null;
  }
}

function parsePyPiName(text: string): string | null {
  try {
    const data = JSON.parse(text) as { info?: { name?: unknown } };
    return typeof data.info?.name === "string" ? data.info.name : null;
  } catch {
    return null;
  }
}

function extractCrateName(url: URL): string | null {
  return extractPathPart(url, /^\/crates\/([^/]+)/);
}
