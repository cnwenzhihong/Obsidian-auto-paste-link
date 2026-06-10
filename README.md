# Auto Paste Link

Obsidian 插件：从外部粘贴单个 URL 时，自动生成 Markdown 普通链接、图片链接或视频嵌入。对受支持的重要站点，可自动补全链接标题。

## 行为

- 粘贴普通 URL：立即插入 `[](URL)`，光标停在标题位置。
- 粘贴受支持站点 URL：先插入 `[](URL)`，标题请求成功后自动补全为 `[标题](URL)`。
- 选中文本后粘贴普通 URL：插入 `[选中文本](URL)`，不联网获取标题。
- 粘贴图片 URL：插入 `![](URL)` 并把光标移动到下一行开头。
- 粘贴视频文件 URL：插入 `<video src="URL" controls muted autoplay loop></video>` 并换行。
- 粘贴一段混合文本时不自动转换，保持原样。
- YAML frontmatter 默认不处理，避免破坏元数据。

## 设置

- 自动获取支持站点标题：默认开启。
- 标题请求超时：默认 `3000ms`。Fab 访问速度通常较慢，低于该值可能经常取不到标题。
- 当前支持站点：bilibili、YouTube、Fab。
- 选中文本作为链接标题：默认开启。
- 自动嵌入图片链接：默认开启。
- 图片链接后自动换行：默认开启。
- 处理 YAML frontmatter：默认关闭。
- 自动嵌入视频链接：默认开启。
- 视频扩展名：默认 `mp4`，用于识别直接视频文件 URL。
- 图片扩展名：用于识别 `.jpg`、`.png`、`.webp` 等 URL。
- 图片链接匹配规则：每行一个 JavaScript 正则，用于识别无扩展名图片链接。

## 开发

```bash
corepack pnpm install
corepack pnpm test
corepack pnpm build
```

构建完成后，把 `main.js`、`manifest.json`、`styles.css` 放入 Obsidian 库的 `.obsidian/plugins/auto-paste-link/` 目录并启用插件。
