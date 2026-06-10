import { getLanguage } from "obsidian";

interface SettingText {
  titleCompletionSectionName: string;
  titleCompletionSectionDesc: string;
  pasteBehaviorSectionName: string;
  pasteBehaviorSectionDesc: string;
  imageDetectionSectionName: string;
  imageDetectionSectionDesc: string;
  fetchSupportedSiteTitleName: string;
  fetchSupportedSiteTitleDesc: string;
  titleFetchTimeoutName: string;
  titleFetchTimeoutDesc: string;
  fabSlowHint: string;
  supportedSitesName: string;
  supportedSitesDesc: string;
  useSelectionAsLinkTextName: string;
  useSelectionAsLinkTextDesc: string;
  addNewlineAfterImageName: string;
  addNewlineAfterImageDesc: string;
  processYamlFrontmatterName: string;
  processYamlFrontmatterDesc: string;
  imageExtensionsName: string;
  imageExtensionsDesc: string;
  imageUrlPatternsName: string;
  imageUrlPatternsDesc: string;
}

const ZH: SettingText = {
  titleCompletionSectionName: "标题补全",
  titleCompletionSectionDesc: "最常用：为受支持的重要站点自动填写 Markdown 链接标题。",
  pasteBehaviorSectionName: "粘贴行为",
  pasteBehaviorSectionDesc: "控制普通链接、图片链接和 YAML 区域的粘贴结果。",
  imageDetectionSectionName: "图片识别",
  imageDetectionSectionDesc: "较少修改：用于判断哪些 URL 应按图片链接处理。",
  fetchSupportedSiteTitleName: "自动获取支持站点标题",
  fetchSupportedSiteTitleDesc: "仅对支持的网站请求标题；其它网站不会联网。",
  titleFetchTimeoutName: "标题请求超时",
  titleFetchTimeoutDesc: "单位毫秒，默认 3000。超时后保留空标题链接。",
  fabSlowHint: "提示：Fab 访问速度通常较慢，低于 3000ms 可能经常取不到标题。",
  supportedSitesName: "当前支持站点",
  supportedSitesDesc: "bilibili、YouTube、Fab。",
  useSelectionAsLinkTextName: "选中文本作为链接标题",
  useSelectionAsLinkTextDesc: "开启后，选中文字再粘贴普通 URL 会生成 [选中文字](URL)。",
  addNewlineAfterImageName: "图片链接后自动换行",
  addNewlineAfterImageDesc: "开启后，图片 Markdown 插入完成后光标移动到下一行开头。",
  processYamlFrontmatterName: "处理 YAML frontmatter",
  processYamlFrontmatterDesc: "默认关闭，避免破坏笔记顶部元数据。",
  imageExtensionsName: "图片扩展名",
  imageExtensionsDesc: "每行或逗号分隔一个扩展名，不需要写点号。",
  imageUrlPatternsName: "图片链接匹配规则",
  imageUrlPatternsDesc: "每行一个 JavaScript 正则，用于识别无扩展名图片 URL。无效正则会被忽略。",
};

const EN: SettingText = {
  titleCompletionSectionName: "Title completion",
  titleCompletionSectionDesc: "Most used: fill Markdown link titles for important supported sites.",
  pasteBehaviorSectionName: "Paste behavior",
  pasteBehaviorSectionDesc: "Control how normal links, image links, and YAML areas are handled.",
  imageDetectionSectionName: "Image detection",
  imageDetectionSectionDesc: "Less frequently edited rules for deciding which URLs should become image links.",
  fetchSupportedSiteTitleName: "Fetch titles for supported sites",
  fetchSupportedSiteTitleDesc: "Only supported sites are requested. Other sites never trigger title requests.",
  titleFetchTimeoutName: "Title request timeout",
  titleFetchTimeoutDesc: "In milliseconds. Default: 3000. Empty link titles are kept after timeout.",
  fabSlowHint: "Note: Fab is usually slow to access. Values below 3000ms may often fail to fetch its title.",
  supportedSitesName: "Supported sites",
  supportedSitesDesc: "bilibili, YouTube, Fab.",
  useSelectionAsLinkTextName: "Use selection as link title",
  useSelectionAsLinkTextDesc: "When enabled, selecting text before pasting a normal URL creates [selected text](URL).",
  addNewlineAfterImageName: "Add newline after image links",
  addNewlineAfterImageDesc: "When enabled, the cursor moves to the start of the next line after inserting an image link.",
  processYamlFrontmatterName: "Process YAML frontmatter",
  processYamlFrontmatterDesc: "Disabled by default to avoid changing note metadata.",
  imageExtensionsName: "Image extensions",
  imageExtensionsDesc: "Enter one extension per line or separate them with commas. Do not include the dot.",
  imageUrlPatternsName: "Image URL patterns",
  imageUrlPatternsDesc: "Enter one JavaScript regular expression per line for image URLs without extensions. Invalid patterns are ignored.",
};

export function getSettingText(): SettingText {
  return getLanguage().toLowerCase().startsWith("zh") ? ZH : EN;
}
