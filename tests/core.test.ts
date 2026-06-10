import test from "node:test";
import assert from "node:assert/strict";
import { buildMarkdownInsertion } from "../src/core/markdownInserter.ts";
import { classifyUrlText } from "../src/core/urlClassifier.ts";
import { isInYamlFrontmatter } from "../src/core/yamlRangeDetector.ts";
import { DEFAULT_SETTINGS } from "../src/settings/pluginSettings.ts";

test("普通 URL 被识别为普通链接", () => {
  assert.deepEqual(classifyUrlText("https://www.baidu.com", DEFAULT_SETTINGS), {
    kind: "normal-link",
    url: "https://www.baidu.com",
  });
});

test("图片扩展名 URL 被识别为图片链接", () => {
  assert.deepEqual(classifyUrlText("https://example.com/a/b/c.webp", DEFAULT_SETTINGS), {
    kind: "image-link",
    url: "https://example.com/a/b/c.webp",
  });
});

test("无扩展名图片 URL 可通过规则识别", () => {
  assert.deepEqual(classifyUrlText("https://images.unsplash.com/photo-1", DEFAULT_SETTINGS), {
    kind: "image-link",
    url: "https://images.unsplash.com/photo-1",
  });
});

test("混合文本不触发自动替换", () => {
  assert.equal(classifyUrlText("看这里 https://www.baidu.com", DEFAULT_SETTINGS).kind, "unsupported");
});

test("普通链接无选中文本时光标停在标题位置", () => {
  assert.deepEqual(
    buildMarkdownInsertion({
      kind: "normal-link",
      url: "https://www.baidu.com",
      selection: "",
      cursor: { line: 3, ch: 5 },
      useSelectionAsLinkText: true,
      addNewlineAfterImage: true,
    }),
    {
      text: "[](https://www.baidu.com)",
      cursor: { line: 3, ch: 6 },
    }
  );
});

test("普通链接有选中文本时使用选中文本作为标题", () => {
  assert.deepEqual(
    buildMarkdownInsertion({
      kind: "normal-link",
      url: "https://www.baidu.com",
      selection: "百度",
      cursor: { line: 0, ch: 0 },
      useSelectionAsLinkText: true,
      addNewlineAfterImage: true,
    }),
    {
      text: "[百度](https://www.baidu.com)",
      cursor: { line: 0, ch: 27 },
    }
  );
});

test("图片链接默认插入后换行并把光标放到下一行开头", () => {
  assert.deepEqual(
    buildMarkdownInsertion({
      kind: "image-link",
      url: "https://example.com/a.jpg",
      selection: "",
      cursor: { line: 2, ch: 8 },
      useSelectionAsLinkText: true,
      addNewlineAfterImage: true,
    }),
    {
      text: "![](https://example.com/a.jpg)\n",
      cursor: { line: 3, ch: 0 },
    }
  );
});

test("YAML frontmatter 范围可被识别", () => {
  const documentText = "---\ntitle: test\n---\nbody";
  assert.equal(isInYamlFrontmatter(documentText, 1), true);
  assert.equal(isInYamlFrontmatter(documentText, 3), false);
});
