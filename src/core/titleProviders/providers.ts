import type { SupportedSiteGroup, TitleProvider } from "./types.ts";
import { chineseContentProviders } from "./groups/chineseContent.ts";
import { codeDevelopmentProviders } from "./groups/codeDevelopment.ts";
import { communityKnowledgeProviders } from "./groups/communityKnowledge.ts";
import { entertainmentProviders } from "./groups/entertainment.ts";
import { videoCreationProviders } from "./groups/videoCreation.ts";

export const SUPPORTED_SITE_GROUPS: readonly SupportedSiteGroup[] = [
  {
    id: "video-creation",
    zhName: "视频与创作",
    enName: "Video and creation",
    providers: videoCreationProviders,
  },
  {
    id: "entertainment",
    zhName: "娱乐",
    enName: "Entertainment",
    providers: entertainmentProviders,
  },
  {
    id: "code-development",
    zhName: "代码与开发",
    enName: "Code and development",
    providers: codeDevelopmentProviders,
  },
  {
    id: "community-knowledge",
    zhName: "社区与百科",
    enName: "Community and knowledge",
    providers: communityKnowledgeProviders,
  },
  {
    id: "chinese-content",
    zhName: "中文内容",
    enName: "Chinese content",
    providers: chineseContentProviders,
  },
];

export const TITLE_PROVIDERS: readonly TitleProvider[] = SUPPORTED_SITE_GROUPS.flatMap(
  (group) => group.providers
);

export const SUPPORTED_SITE_NAMES = TITLE_PROVIDERS.map((provider) => provider.displayName);
