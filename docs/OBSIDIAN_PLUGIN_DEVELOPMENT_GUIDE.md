# Obsidian Plugin Development Guide for GPT

本文档总结 Auto Paste Link 的完整开发、发布和审核流程，目标是让下次 GPT 从零接手 Obsidian 插件时，能直接按成熟流程推进。

## 核心原则

- 先确认真实用户需求，再设计功能。
- 默认行为必须保守，宁可少处理，也不要误改用户内容。
- Obsidian 插件发布不是只写代码，还包括版本文件、Release assets、GitHub Actions、官方审查规则。
- 任何会影响粘贴、光标、设置、发布资产的变更，都要测试。
- 不要把构建产物、源码文件、Release 文件混为一谈。

## 从零开始的推荐流程

1. 初始化官方插件结构：
   - `manifest.json`
   - `package.json`
   - `versions.json`
   - `src/main.ts`
   - `styles.css`
   - `tsconfig.json`
   - `esbuild.config.mjs`

2. 先设置 `.gitignore`：
   - 忽略 `node_modules/`
   - 忽略 `.pnpm-store/`
   - 忽略根目录 `main.js`
   - 忽略 `release/`
   - 不忽略 `manifest.json`、`styles.css`、`versions.json`

3. 确定插件最小可用行为。

4. 拆模块实现，不要把逻辑都放进 `main.ts`。

5. 补测试。

6. 准备 README、LICENSE、发布 workflow。

7. 用 GitHub Actions 生成 Release assets 和 artifact attestations。

8. 提交 Obsidian 社区插件申请。

## 推荐目录结构

```text
.
├── .github/workflows/release.yml
├── docs/
├── src/
│   ├── core/
│   ├── settings/
│   └── main.ts
├── tests/
├── manifest.json
├── package.json
├── versions.json
├── styles.css
├── README.md
├── LICENSE
└── AI_ACTIONS.md
```

## 模块边界

`src/main.ts`

- 只做插件生命周期、事件注册、设置页挂载。
- 不写具体业务判断。
- 注册 DOM 事件时用 `activeDocument`，不要用 `document`。

`src/core/pasteHandler.ts`

- 编排粘贴流程。
- 读取剪贴板文本。
- 判断 YAML frontmatter 策略。
- 调用 URL 分类器和 Markdown 插入器。
- 触发异步标题补全。

`src/core/urlClassifier.ts`

- 只负责 URL 类型判断。
- 类型判断顺序保持简单。
- 当前推荐顺序：
  1. 图片扩展名
  2. 可信图片来源
  3. 高级正则
  4. 视频扩展名
  5. 普通链接

`src/core/markdownInserter.ts`

- 只负责生成插入文本和光标位置。
- 普通链接、图片、视频都在这里统一处理。

`src/core/titleResolver.ts`

- 只负责支持站点标题获取。
- 只对明确支持的重要站点联网。
- 不做全站通用抓取。
- 超时用 `window.setTimeout()` 和 `window.clearTimeout()`。
- Promise reject 原因必须是 `Error`。

`src/settings/*`

- 设置默认值、归一化、中英文文案、设置页 UI 分开写。
- 设置页 DOM 创建使用 `activeDocument`。
- Obsidian 旧版本兼容时可以保留 `display()`，但内部刷新不要调用 `this.display()`。

## 需求设计经验

### 粘贴行为

只处理“剪贴板整体是单个 URL”的情况。

不要自动转换混合文本，例如：

```text
看这里 https://example.com
```

这类内容应保持原样粘贴，避免破坏用户从网页、聊天、文档复制来的原格式。

### 普通链接

无选中文本：

```md
[](https://example.com)
```

光标停在 `[]` 中间。

有选中文本：

```md
[selected text](https://example.com)
```

不再请求标题。

### 图片链接

直接图片 URL：

```md
![](https://example.com/image.jpg)
```

图片识别必须保守。不能因为一个域名是 CDN 就判断为图片。

推荐模型：

- 扩展名
- 内置高置信图片来源
- 用户自定义可信图片来源
- 高级正则兜底

不要内置泛 CDN：

- `cloudfront.net`
- `akamaihd.net`
- `fastly.net`
- `googleusercontent.com`

这些域名可能承载图片、网页、脚本、下载文件，误判风险高。

### 视频链接

只处理直接视频文件链接，例如 `.mp4`。

输出：

```html
<video src="URL" controls muted autoplay loop></video>
```

URL 必须做 HTML attribute escape，避免 `&`、`"` 破坏标签。

### Ctrl+Shift+V

`ClipboardEvent` 本身不可靠提供 `shiftKey`。

正确做法：

- 监听 `keydown`
- 记录最近一次 `Ctrl/Cmd+Shift+V`
- 下一次 `paste` 直接放行
- 标记只消费一次，并设置短超时

### YAML frontmatter

默认不处理 YAML frontmatter。

原因：frontmatter 是元数据区域，自动改写 URL 可能破坏字段值。

可以提供设置允许用户主动开启。

## 标题补全经验

不要做“所有网站自动抓标题”。

原因：

- 慢
- 有隐私问题
- 失败率高
- 容易被反爬、Cloudflare、登录墙影响

推荐只支持重要站点 Provider。

当前站点经验：

- YouTube：优先使用 oEmbed。
- bilibili：优先 API，失败再退回页面 HTML。
- Fab：普通 UA 可能返回 Cloudflare 403，需要用 `facebookexternalhit/1.1` 获取社交预览 HTML。

标题请求默认超时时间建议 `3000ms`。Fab 访问慢，需要在设置里提示。

## 设置页经验

设置应按用户常用程度排序：

1. 标题补全
2. 粘贴行为
3. 媒体识别

媒体识别中图片和视频可以做可折叠子分类。

普通用户不应直接面对正则。更好的配置方式是“可信图片来源列表”：

- Host
- Path prefix
- Include subdomains
- Delete

高级正则保留，但折叠到高级设置中。

## Obsidian 审核注意事项

### minAppVersion

`manifest.json.minAppVersion` 必须和实际使用的 Obsidian API 匹配。

如果声明：

```json
"minAppVersion": "1.5.0"
```

就不要使用较新的 API，例如 `getLanguage()`。

语言判断可以用：

```ts
activeWindow.navigator.language
```

### Popout window compatibility

不要直接用：

```ts
document
globalThis
setTimeout()
clearTimeout()
```

优先使用：

```ts
activeDocument
activeWindow
window.setTimeout()
window.clearTimeout()
```

实际审核中出现过这些规则：

- Use `activeDocument` instead of `document`.
- Avoid using `globalThis`.
- Use `window.setTimeout()` instead of `setTimeout()`.
- Use `window.clearTimeout()` instead of `clearTimeout()`.
- Promise rejection reason should be an `Error`.

### display deprecated

`PluginSettingTab.display()` 在 Obsidian 1.13 后被标记 deprecated，但如果插件要支持旧版本，仍可保留作为兼容入口。

不要在代码内部调用 `this.display()` 刷新设置页。改用：

```ts
display(): void {
  this.renderSettings();
}

private renderSettings(): void {
  // actual render logic
}
```

## 版本与发布

三个版本文件必须一致：

```text
manifest.json.version
package.json.version
versions.json 中的版本键
```

`versions.json` 是历史映射，不要删除旧版本：

```json
{
  "1.0.0": "1.5.0",
  "1.0.1": "1.5.0",
  "1.0.2": "1.5.0"
}
```

GitHub Release tag 必须等于 `manifest.json.version`。

推荐 tag 不加 `v`：

```text
1.0.2
```

## Release assets

Obsidian 安装需要三个文件：

```text
main.js
manifest.json
styles.css
```

源码仓库可以忽略根目录 `main.js`，因为它是构建产物。

但 GitHub Release assets 必须上传 `main.js`。

推荐由 GitHub Actions 构建并上传，不要手动上传本地构建产物。

## Artifact attestations

GitHub 会建议为 Release assets 添加 artifact attestations。

这个不能给本地已构建文件事后补签。

正确做法：

- GitHub Actions checkout 源码
- 安装依赖
- 测试
- 构建
- 对 `main.js`、`manifest.json`、`styles.css` 运行 `actions/attest-build-provenance`
- 上传 Release assets

需要权限：

```yaml
permissions:
  contents: write
  id-token: write
  attestations: write
```

workflow 应防止 tag 和源码不一致：

- 如果 tag 已存在但不指向当前提交，应失败。
- 如果 tag 不存在，可以由 workflow 创建。

## 发布后的正确流程

1. 修改版本文件。
2. 提交并推送。
3. 在 GitHub Actions 手动运行 Release workflow。
4. 输入 tag，例如 `1.0.2`。
5. 等待 workflow 创建 tag、构建、签发 attestations、上传 assets。
6. 检查 GitHub Release。
7. 再提交 Obsidian 申请或更新申请信息。

不要先手动创建旧 tag，再继续改源码。这样会导致 tag 指向旧提交，Release assets 和源码不一致。

## 本项目快速发布协作模式

本项目实际协作方式是 GPT 负责绝大多数本地和远端维护工作，包括代码修改、文档修改、版本文件更新、提交、推送、tag 状态检查和 Release 状态检查。

用户默认只手动触发 GitHub Actions 里的 Release workflow。因此发布前不需要重复执行早期上架阶段的完整人工检查链路，除非改动涉及发布工作流、构建配置、Obsidian 审核报错或 GitHub Release 失败。

可以降级为轻量检查的事项：

- 版本检查：确认 `manifest.json.version` 和 `package.json.version` 相同，且 `versions.json` 包含新版本。
- Release assets：默认交给 GitHub Actions 构建、签发 attestations 并上传，不手动复制或比对本地 `release/` 目录。
- 本地构建：仅在核心逻辑、构建配置、依赖或类型定义发生变化时运行；纯文档或发布说明修改不需要跑完整构建。
- tag 和 Release 查询：发布前确认一次即可，不要反复查询旧版本历史，除非发现不一致。

不能省的事项：

- 修改前先看 `git status -sb`。
- 改版本时保持 `manifest.json`、`package.json`、`versions.json` 一致。
- 影响核心逻辑时运行必要测试或类型检查。
- 推送后确认远端 branch 或 tag 已更新。
- Release workflow 跑完后确认 GitHub Release 成功生成。

## Obsidian 社区插件审核通过后

审核通过后没有“发布按钮”。

通常等待同步即可，插件会出现在 Obsidian 的 Community plugins 搜索中。

后续更新只需发布新的 GitHub Release，Obsidian 会自动识别更新。

## 常用检查命令

```bash
git status -sb
node --experimental-default-type=module --test tests/*.test.ts
./node_modules/.bin/tsc.CMD -noEmit -skipLibCheck
node esbuild.config.mjs production
git ls-remote origin refs/heads/main refs/tags/VERSION
```

Windows PowerShell 中如果 `corepack pnpm test` 因 Corepack 调用裸 `pnpm` 失败，可以直接运行等价命令：

```bash
node --experimental-default-type=module --test tests/*.test.ts
```

构建可直接运行：

```bash
./node_modules/.bin/tsc.CMD -noEmit -skipLibCheck
node esbuild.config.mjs production
```

## 本项目的关键反思

- 最初把 CDN 图片识别放进默认正则，短期能解决问题，但长期不够清晰。更好的模型是内置可信来源加用户可信来源列表。
- 手动上传 Release assets 可以工作，但无法自然获得 artifact attestations。正式项目应从一开始用 GitHub Actions 发布。
- `minAppVersion` 不是随便写的。只要用了新 API，就会被 Obsidian 审核发现。
- Popout window compatibility 需要从第一天就考虑，避免后期被审查反复提醒。
- 版本发布要保持源码、tag、Release assets 同步。tag 一旦指向旧提交，最好发新 patch 版本，不要随便移动旧 tag。
- README 演示视频可以用 GitHub user attachment 链接。仓库内 mp4 更适合作为备用资产，不一定能在 README 内稳定播放。
- GPT 接手时必须先检查 Git 状态，尊重用户未提交改动，不要把无关改动混进提交。

## 下次 GPT 接手前必须做的事

1. 读 `git status -sb`。
2. 读 `manifest.json`、`package.json`、`versions.json`。
3. 检查当前 branch、远端 branch、tag 指向。
4. 明确是否需要改版本。
5. 明确是否需要更新 Release assets。
6. 不要自动提交，除非用户明确要求。
7. 如果要发布，优先走 GitHub Actions release workflow。
8. 本项目由 GPT 负责大部分修改和远端操作，用户通常只手动触发 Release Action；不要默认套用完整人工发布检查流程。
