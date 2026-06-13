# Auto Paste Link

Auto Paste Link is an Obsidian plugin that formats a single pasted URL into a Markdown link, image embed, or video embed. For selected supported websites, it can also fill the link title automatically.

中文：这是一个 Obsidian 插件，用于在粘贴单个 URL 时自动生成 Markdown 普通链接、图片嵌入或视频嵌入。对受支持的重要站点，可以自动补全链接标题。

## Demo

[Watch the demo video](docs/assets/auto-paste-link-trail.mp4)

中文：[查看演示视频](docs/assets/auto-paste-link-trail.mp4)

## Core Behavior

- Normal URL: inserts `[](URL)` and keeps the cursor inside `[]`.
- Selected text + normal URL: inserts `[selected text](URL)`.
- Supported website URL: inserts `[](URL)` first, then fills the title when the title request succeeds.
- Image URL: inserts `![](URL)`.
- Direct video file URL: inserts `<video src="URL" controls muted autoplay loop></video>`.
- Mixed text is not converted.
- YAML frontmatter is ignored by default.
- `Ctrl+Shift+V` keeps Obsidian's plain paste behavior and skips plugin processing.

## Examples

Normal link:

```md
[](https://www.baidu.com)
```

Normal link with selected text:

```md
[百度](https://www.baidu.com)
```

Image link:

```md
![](https://images.steamusercontent.com/ugc/example/hash/?imw=5000)
```

Video link:

```html
<video src="https://example.com/video.mp4" controls muted autoplay loop></video>
```

## Supported Title Sites

Automatic title fetching is intentionally limited to important supported sites:

- bilibili
- YouTube
- Fab

Other websites are not fetched for titles.

## Image Detection

Image detection is deliberately conservative. The plugin does not treat every CDN as an image source.

Detection order:

1. Image file extension, such as `.jpg`, `.png`, `.webp`, `.gif`, `.svg`, `.avif`.
2. Trusted image sources.
3. Advanced regular expressions.

Built-in trusted image sources include:

- `images.unsplash.com/`
- `i.imgur.com/`
- `images.steamusercontent.com/`
- `pbs.twimg.com/media/`
- `i.ytimg.com/vi/`
- `img.youtube.com/vi/`
- `i0.hdslb.com/bfs/`
- `i1.hdslb.com/bfs/`
- `i2.hdslb.com/bfs/`

Generic CDN domains such as `cloudfront.net`, `akamaihd.net`, `fastly.net`, and `googleusercontent.com` are not built in, because they can serve images, webpages, scripts, downloads, and many other resource types.

## Custom Trusted Image Sources

Use custom trusted image sources for hosts or paths that clearly serve images.

Each source has:

- Host: required, for example `images.example.com`.
- Path prefix: optional, for example `/media/`.
- Include subdomains: optional. Keep it off unless subdomains are also known image sources.

Examples:

```text
host: images.example.com
path prefix: /media/
include subdomains: off
```

This matches:

```text
https://images.example.com/media/abc
```

It does not match:

```text
https://images.example.com/files/abc
https://sub.images.example.com/media/abc
```

If `include subdomains` is enabled, then subdomains such as `cdn.images.example.com` can also match.

## Advanced Regular Expressions

Advanced image URL regular expressions are still available for edge cases, but they should be treated as an escape hatch.

Use trusted image sources first. Use regular expressions only when a source cannot be expressed by host and path prefix.

The default advanced rule recognizes explicit image format query parameters, for example:

```text
https://example.com/resource?id=1&format=jpg
```

## Settings

- Auto fetch supported site titles: enabled by default.
- Title request timeout: `3000ms` by default. Fab is usually slower than other supported sites.
- Use selected text as the link title: enabled by default.
- Process YAML frontmatter: disabled by default.
- Auto embed image links: enabled by default.
- Add newline after image links: enabled by default.
- Image extensions are configurable.
- Custom trusted image sources are configurable.
- Advanced image URL regular expressions are configurable.
- Auto embed video links: enabled by default.
- Video extensions are configurable. The default is `mp4`.

## Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest GitHub release.
2. Create this folder in your vault: `.obsidian/plugins/auto-paste-link/`.
3. Put the three downloaded files into that folder.
4. Enable the plugin in Obsidian settings.

## Development

```bash
corepack pnpm install
corepack pnpm test
corepack pnpm build
```

The GitHub release tag must exactly match the version in `manifest.json`, for example `1.0.0` without a `v` prefix. Release assets must include `main.js`, `manifest.json`, and `styles.css`.
