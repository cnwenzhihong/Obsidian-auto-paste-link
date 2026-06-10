# Auto Paste Link

Obsidian 插件：从外部粘贴单个 URL 时，自动生成 Markdown 普通链接或图片链接。

## 行为

- 粘贴 `https://www.baidu.com`：插入 `[](https://www.baidu.com)`，光标停在标题位置。
- 选中 `百度` 后粘贴 `https://www.baidu.com`：插入 `[百度](https://www.baidu.com)`。
- 粘贴图片 URL：插入 `![](URL)` 并把光标移动到下一行开头。
- 粘贴一段混合文本时不自动转换，保持原样。
- YAML frontmatter 默认不处理，避免破坏元数据。

## 设置

- 启用插件：总开关。
- 处理 YAML frontmatter：默认关闭。
- 选中文本作为链接标题：默认开启。
- 图片链接后自动换行：默认开启。
- 图片扩展名：用于识别 `.jpg`、`.png`、`.webp` 等 URL。
- 图片链接匹配规则：每行一个 JavaScript 正则，用于识别无扩展名图片链接。

## 开发

```bash
corepack pnpm install
corepack pnpm test
corepack pnpm build
```

构建完成后，把 `main.js`、`manifest.json`、`styles.css` 放入 Obsidian 库的 `.obsidian/plugins/auto-paste-link/` 目录并启用插件。
