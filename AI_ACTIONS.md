# AI 关键行动文档

## 项目边界

- 插件只处理“粘贴内容整体是单个 URL”的场景。
- 不联网探测图片类型，默认只用扩展名和配置规则判断。
- YAML frontmatter 默认不处理，除非用户在设置中开启。

## 模块职责

- `src/main.ts`：加载设置、注册编辑器粘贴事件、挂载设置页。
- `src/core/pasteHandler.ts`：粘贴流程编排，不放复杂识别规则。
- `src/core/urlClassifier.ts`：URL 合法性与图片/普通链接分类。
- `src/core/markdownInserter.ts`：生成 Markdown 文本和最终光标位置。
- `src/core/yamlRangeDetector.ts`：判断光标是否在 YAML frontmatter 内。
- `src/settings/*`：默认配置、配置归一化、设置页 UI。

## 修改原则

- 新识别规则优先放到配置或 `UrlClassifier`，不要写进粘贴入口。
- 新插入格式优先扩展 `MarkdownInserter`，不要在 UI 层拼字符串。
- 影响粘贴行为的变更必须补充 `tests/core.test.ts`。
- 默认行为以少误伤为优先，不自动处理混合文本。
