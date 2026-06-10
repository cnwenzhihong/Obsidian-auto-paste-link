# AI 关键行动文档

## 项目边界

- 插件只处理“粘贴内容整体是单个 URL”的场景。
- 图片类型判断不联网，默认只用扩展名和配置规则判断。
- 普通链接标题只对明确支持的重要站点联网获取；其它网站不请求标题。
- YAML frontmatter 默认不处理，除非用户在设置中开启。

## 模块职责

- `src/main.ts`：加载设置、注册编辑器粘贴事件、挂载设置页。
- `src/core/pasteHandler.ts`：粘贴流程编排和异步标题补全触发，不放站点规则。
- `src/core/urlClassifier.ts`：URL 合法性与图片/普通链接分类。
- `src/core/titleResolver.ts`：支持站点匹配、标题请求、标题解析和站点标题清理。
- `src/core/markdownInserter.ts`：生成 Markdown 文本、最终光标位置和标题占位范围。
- `src/core/yamlRangeDetector.ts`：判断光标是否在 YAML frontmatter 内。
- `src/settings/*`：默认配置、配置归一化、中英文文案、设置页 UI。

## 站点注意事项

- Fab 普通请求会返回 Cloudflare 403 挑战页，拿不到商品标题。
- Fab Provider 使用 `facebookexternalhit/1.1` User-Agent 获取面向社交预览的 HTML，其中包含真实 `<title>`。
- 不要把 Fab 的专用 User-Agent 改回普通浏览器 UA，除非重新验证示例链接仍能取到标题。

## 修改原则

- 新增支持站点时，优先扩展 `TitleResolver` Provider，不要写进粘贴入口。
- 新识别规则优先放到配置或 `UrlClassifier`，不要写进粘贴入口。
- 新插入格式优先扩展 `MarkdownInserter`，不要在 UI 层拼字符串。
- 影响粘贴行为的变更必须补充 `tests/core.test.ts`。
- 默认行为以少误伤为优先，不自动处理混合文本。
