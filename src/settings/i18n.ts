import { getLanguage } from "obsidian";

interface SettingText {
  titleCompletionSectionName: string;
  pasteBehaviorSectionName: string;
  mediaDetectionSectionName: string;
  fetchSupportedSiteTitleName: string;
  fetchSupportedSiteTitleDesc: string;
  titleFetchTimeoutName: string;
  titleFetchTimeoutDesc: string;
  fabSlowHint: string;
  supportedSitesName: string;
  supportedSitesDesc: string;
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
  imageUrlPatternsName: string;
  imageUrlPatternsDesc: string;
  embedVideoLinksName: string;
  embedVideoLinksDesc: string;
  videoSubsectionName: string;
  videoExtensionsName: string;
  videoExtensionsDesc: string;
}

const ZH: SettingText = {
  titleCompletionSectionName: "标题补全",
  pasteBehaviorSectionName: "粘贴行为",
  mediaDetectionSectionName: "媒体识别",
  fetchSupportedSiteTitleName: "自动获取支持站点标题",
  fetchSupportedSiteTitleDesc: "仅对支持的网站请求标题；其它网站不会联网。",
  titleFetchTimeoutName: "标题请求超时",
  titleFetchTimeoutDesc: "单位毫秒，默认 3000。超时后保留空标题链接。",
  fabSlowHint: "提示：Fab 访问速度通常较慢，低于 3000ms 可能经常取不到标题。",
  supportedSitesName: "当前支持站点",
  supportedSitesDesc: "bilibili、YouTube、Fab。",
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
  imageUrlPatternsName: "图片链接匹配规则",
  imageUrlPatternsDesc: "每行一个 JavaScript 正则，用于识别无扩展名图片 URL。无效正则会被忽略。",
  embedVideoLinksName: "自动嵌入视频链接",
  embedVideoLinksDesc: "开启后，直接视频文件 URL 会插入为 HTML video 标签。",
  videoSubsectionName: "视频",
  videoExtensionsName: "视频扩展名",
  videoExtensionsDesc: "每行或逗号分隔一个扩展名，默认 mp4，不需要写点号。",
};

const EN: SettingText = {
  titleCompletionSectionName: "Title completion",
  pasteBehaviorSectionName: "Paste behavior",
  mediaDetectionSectionName: "Media detection",
  fetchSupportedSiteTitleName: "Fetch titles for supported sites",
  fetchSupportedSiteTitleDesc: "Only supported sites are requested. Other sites never trigger title requests.",
  titleFetchTimeoutName: "Title request timeout",
  titleFetchTimeoutDesc: "In milliseconds. Default: 3000. Empty link titles are kept after timeout.",
  fabSlowHint: "Note: Fab is usually slow to access. Values below 3000ms may often fail to fetch its title.",
  supportedSitesName: "Supported sites",
  supportedSitesDesc: "bilibili, YouTube, Fab.",
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
  imageUrlPatternsName: "Image URL patterns",
  imageUrlPatternsDesc: "Enter one JavaScript regular expression per line for image URLs without extensions. Invalid patterns are ignored.",
  embedVideoLinksName: "Embed video links",
  embedVideoLinksDesc: "When enabled, direct video file URLs are inserted as HTML video tags.",
  videoSubsectionName: "Videos",
  videoExtensionsName: "Video extensions",
  videoExtensionsDesc: "Enter one extension per line or separate them with commas. Default: mp4. Do not include the dot.",
};

export function getSettingText(): SettingText {
  return getLanguage().toLowerCase().startsWith("zh") ? ZH : EN;
}
