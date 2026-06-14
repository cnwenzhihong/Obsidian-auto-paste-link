interface SettingText {
  language: "zh" | "en";
  titleCompletionSectionName: string;
  pasteBehaviorSectionName: string;
  mediaDetectionSectionName: string;
  fetchSupportedSiteTitleName: string;
  fetchSupportedSiteTitleDesc: string;
  fetchGenericSiteTitleName: string;
  fetchGenericSiteTitleDesc: string;
  titleFetchTimeoutName: string;
  titleFetchTimeoutDesc: string;
  fabSlowHint: string;
  supportedSitesName: string;
  supportedSitesDesc: string;
  siteSupportSubsectionName: string;
  githubTitleFormatName: string;
  githubTitleFormatDesc: string;
  githubTitleFormatRepository: string;
  githubTitleFormatOwnerRepository: string;
  githubTitleFormatGitHubOwnerRepository: string;
  useSelectionAsLinkTextName: string;
  useSelectionAsLinkTextDesc: string;
  processYamlFrontmatterName: string;
  processYamlFrontmatterDesc: string;
  embedImageLinksName: string;
  embedImageLinksDesc: string;
  imageSubsectionName: string;
  addNewlineAfterImageName: string;
  addNewlineAfterImageDesc: string;
  imageExtensionsName: string;
  imageExtensionsDesc: string;
  builtinTrustedImageSourcesName: string;
  trustedImageSourcesName: string;
  trustedImageSourcesDesc: string;
  addTrustedImageSourceButtonText: string;
  trustedImageSourceRowName: string;
  trustedImageSourceRowDesc: string;
  trustedImageSourceHostPlaceholder: string;
  trustedImageSourcePathPrefixPlaceholder: string;
  trustedImageSourceIncludeSubdomainsText: string;
  deleteTrustedImageSourceButtonText: string;
  advancedImageRulesSubsectionName: string;
  imageUrlPatternsName: string;
  imageUrlPatternsDesc: string;
  embedVideoLinksName: string;
  embedVideoLinksDesc: string;
  videoSubsectionName: string;
  videoExtensionsName: string;
  videoExtensionsDesc: string;
  trustedVideoSourcesName: string;
  trustedVideoSourcesDesc: string;
}

const ZH: SettingText = {
  language: "zh",
  titleCompletionSectionName: "标题补全",
  pasteBehaviorSectionName: "粘贴行为",
  mediaDetectionSectionName: "媒体识别",
  fetchSupportedSiteTitleName: "自动获取支持站点标题",
  fetchSupportedSiteTitleDesc: "仅对支持的网站请求标题；其它网站不会联网。",
  fetchGenericSiteTitleName: "默认获取其它网站标题",
  fetchGenericSiteTitleDesc: "开启后，未知网站也会尝试获取标题；只有标题足够干净时才会填入。",
  titleFetchTimeoutName: "标题请求超时",
  titleFetchTimeoutDesc: "单位毫秒，默认 3000。超时后保留空标题链接。",
  fabSlowHint: "提示：Fab 访问速度通常较慢，低于 3000ms 可能经常取不到标题。",
  supportedSitesName: "当前支持站点",
  supportedSitesDesc: "按类型分组显示当前可自动补全标题的网站。",
  siteSupportSubsectionName: "站点支持",
  githubTitleFormatName: "GitHub 仓库标题格式",
  githubTitleFormatDesc: "仅影响 GitHub 仓库根链接，例如 github.com/owner/repo。",
  githubTitleFormatRepository: "仅项目名",
  githubTitleFormatOwnerRepository: "作者/项目名",
  githubTitleFormatGitHubOwnerRepository: "GitHub - 作者/项目名",
  useSelectionAsLinkTextName: "选中文本作为链接标题",
  useSelectionAsLinkTextDesc: "开启后，选中文字再粘贴普通 URL 会生成 [选中文字](URL)。",
  processYamlFrontmatterName: "处理 YAML frontmatter",
  processYamlFrontmatterDesc: "默认关闭，避免破坏笔记顶部元数据。",
  embedImageLinksName: "自动嵌入图片链接",
  embedImageLinksDesc: "开启后，直接图片 URL 会插入为 Markdown 图片链接。",
  imageSubsectionName: "图片",
  addNewlineAfterImageName: "图片链接后自动换行",
  addNewlineAfterImageDesc: "开启后，图片 Markdown 插入完成后光标移动到下一行开头。",
  imageExtensionsName: "图片扩展名",
  imageExtensionsDesc: "每行或逗号分隔一个扩展名，不需要写点号。",
  builtinTrustedImageSourcesName: "内置可信图片来源",
  trustedImageSourcesName: "自定义可信图片来源",
  trustedImageSourcesDesc: "适合添加明确只承载图片的站点或路径。普通 CDN 不建议添加。",
  addTrustedImageSourceButtonText: "添加来源",
  trustedImageSourceRowName: "来源",
  trustedImageSourceRowDesc: "第一个输入 Host，第二个输入路径前缀；开关表示包含子域名。",
  trustedImageSourceHostPlaceholder: "host，例如 images.example.com",
  trustedImageSourcePathPrefixPlaceholder: "路径前缀，可留空，例如 /media/",
  trustedImageSourceIncludeSubdomainsText: "包含子域名",
  deleteTrustedImageSourceButtonText: "删除",
  advancedImageRulesSubsectionName: "高级规则",
  imageUrlPatternsName: "高级正则规则",
  imageUrlPatternsDesc: "每行一个 JavaScript 正则。仅建议在可信来源无法表达时使用，无效正则会被忽略。",
  embedVideoLinksName: "自动嵌入视频链接",
  embedVideoLinksDesc: "开启后，直接视频文件 URL 会插入为 HTML video 标签。",
  videoSubsectionName: "视频",
  videoExtensionsName: "视频扩展名",
  videoExtensionsDesc: "每行或逗号分隔一个扩展名，默认 mp4，不需要写点号。",
  trustedVideoSourcesName: "自定义可信视频来源",
  trustedVideoSourcesDesc: "适合添加明确只承载视频的站点或路径。普通 CDN 不建议添加。",
};

const EN: SettingText = {
  language: "en",
  titleCompletionSectionName: "Title completion",
  pasteBehaviorSectionName: "Paste behavior",
  mediaDetectionSectionName: "Media detection",
  fetchSupportedSiteTitleName: "Fetch titles for supported sites",
  fetchSupportedSiteTitleDesc: "Only supported sites are requested. Other sites never trigger title requests.",
  fetchGenericSiteTitleName: "Fetch titles for other sites by default",
  fetchGenericSiteTitleDesc: "When enabled, unknown sites are requested too. Titles are filled only when they look clean.",
  titleFetchTimeoutName: "Title request timeout",
  titleFetchTimeoutDesc: "In milliseconds. Default: 3000. Empty link titles are kept after timeout.",
  fabSlowHint: "Note: Fab is usually slow to access. Values below 3000ms may often fail to fetch its title.",
  supportedSitesName: "Supported sites",
  supportedSitesDesc: "Supported title sites are grouped by content type.",
  siteSupportSubsectionName: "Site support",
  githubTitleFormatName: "GitHub repository title format",
  githubTitleFormatDesc: "Only affects GitHub repository root links, such as github.com/owner/repo.",
  githubTitleFormatRepository: "Repository only",
  githubTitleFormatOwnerRepository: "Owner/repository",
  githubTitleFormatGitHubOwnerRepository: "GitHub - owner/repository",
  useSelectionAsLinkTextName: "Use selection as link title",
  useSelectionAsLinkTextDesc: "When enabled, selecting text before pasting a normal URL creates [selected text](URL).",
  processYamlFrontmatterName: "Process YAML frontmatter",
  processYamlFrontmatterDesc: "Disabled by default to avoid changing note metadata.",
  embedImageLinksName: "Embed image links",
  embedImageLinksDesc: "When enabled, direct image URLs are inserted as Markdown image links.",
  imageSubsectionName: "Images",
  addNewlineAfterImageName: "Add newline after image links",
  addNewlineAfterImageDesc: "When enabled, the cursor moves to the start of the next line after inserting an image link.",
  imageExtensionsName: "Image extensions",
  imageExtensionsDesc: "Enter one extension per line or separate them with commas. Do not include the dot.",
  builtinTrustedImageSourcesName: "Built-in trusted image sources",
  trustedImageSourcesName: "Custom trusted image sources",
  trustedImageSourcesDesc: "Use this for hosts or paths that clearly serve images. Avoid generic CDN domains.",
  addTrustedImageSourceButtonText: "Add source",
  trustedImageSourceRowName: "Source",
  trustedImageSourceRowDesc: "First input is the host, second input is the path prefix. The toggle includes subdomains.",
  trustedImageSourceHostPlaceholder: "host, e.g. images.example.com",
  trustedImageSourcePathPrefixPlaceholder: "optional path prefix, e.g. /media/",
  trustedImageSourceIncludeSubdomainsText: "Include subdomains",
  deleteTrustedImageSourceButtonText: "Delete",
  advancedImageRulesSubsectionName: "Advanced rules",
  imageUrlPatternsName: "Advanced regular expressions",
  imageUrlPatternsDesc: "Enter one JavaScript regular expression per line. Use only when trusted sources cannot express the rule. Invalid patterns are ignored.",
  embedVideoLinksName: "Embed video links",
  embedVideoLinksDesc: "When enabled, direct video file URLs are inserted as HTML video tags.",
  videoSubsectionName: "Videos",
  videoExtensionsName: "Video extensions",
  videoExtensionsDesc: "Enter one extension per line or separate them with commas. Default: mp4. Do not include the dot.",
  trustedVideoSourcesName: "Custom trusted video sources",
  trustedVideoSourcesDesc: "Use this for hosts or paths that clearly serve videos. Avoid generic CDN domains.",
};

export function getSettingText(): SettingText {
  return activeWindow.navigator.language.toLowerCase().startsWith("zh") ? ZH : EN;
}
