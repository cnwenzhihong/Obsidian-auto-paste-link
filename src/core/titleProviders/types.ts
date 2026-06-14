export interface TitleRequestInput {
  url: string;
  headers?: Record<string, string>;
}

export interface TitleRequestResponse {
  status: number;
  headers: Record<string, string>;
  text: string;
}

export type TitleRequest = (request: TitleRequestInput) => Promise<TitleRequestResponse>;

export type GitHubTitleFormat = "repository" | "owner-repository" | "github-owner-repository";

export interface TitleResolveContext {
  githubTitleFormat: GitHubTitleFormat;
}

export interface TitleRequestSpec {
  kind: string;
  request: TitleRequestInput;
}

export interface TitleProvider {
  id: string;
  displayName: string;
  matches(url: URL): boolean;
  createRequests(url: URL, rawUrl: string): TitleRequestSpec[];
  parse(response: TitleRequestResponse, spec: TitleRequestSpec, context: TitleResolveContext): string | null;
  fallbackTitle?(url: URL, rawUrl: string, context: TitleResolveContext): string | null;
}

export interface SupportedSiteGroup {
  id: string;
  zhName: string;
  enName: string;
  providers: readonly TitleProvider[];
}
