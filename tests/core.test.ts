import test from "node:test";
import assert from "node:assert/strict";

Object.defineProperty(globalThis, "window", {
  value: {
    setTimeout,
    clearTimeout,
  },
  configurable: true,
});

import { buildMarkdownInsertion } from "../src/core/markdownInserter.ts";
import { classifyUrlText } from "../src/core/urlClassifier.ts";
import { isInYamlFrontmatter } from "../src/core/yamlRangeDetector.ts";
import { PasteShortcutTracker } from "../src/core/pasteShortcutTracker.ts";
import { DEFAULT_SETTINGS, normalizeSettings } from "../src/settings/pluginSettings.ts";
import {
  cleanBilibiliTitle,
  cleanFabTitle,
  cleanYouTubeTitle,
  extractHtmlTitle,
  getSupportedTitleProvider,
  resolveSupportedSiteTitle,
  type TitleRequest,
} from "../src/core/titleResolver.ts";

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

test("关闭图片嵌入后图片 URL 回退为普通链接", () => {
  assert.deepEqual(
    classifyUrlText("https://example.com/a/b/c.webp", {
      ...DEFAULT_SETTINGS,
      embedImageLinks: false,
    }),
    {
      kind: "normal-link",
      url: "https://example.com/a/b/c.webp",
    }
  );
});

test("MP4 URL 被识别为视频链接", () => {
  assert.deepEqual(classifyUrlText("https://example.com/a/b/c.mp4", DEFAULT_SETTINGS), {
    kind: "video-link",
    url: "https://example.com/a/b/c.mp4",
  });
});

test("带查询参数的 MP4 URL 仍被识别为视频链接", () => {
  assert.deepEqual(classifyUrlText("https://example.com/video.mp4?token=abc&x=1", DEFAULT_SETTINGS), {
    kind: "video-link",
    url: "https://example.com/video.mp4?token=abc&x=1",
  });
});

test("关闭视频嵌入后 MP4 URL 回退为普通链接", () => {
  assert.deepEqual(
    classifyUrlText("https://example.com/video.mp4", {
      ...DEFAULT_SETTINGS,
      embedVideoLinks: false,
    }),
    {
      kind: "normal-link",
      url: "https://example.com/video.mp4",
    }
  );
});

test("自定义视频扩展名可识别新增视频类型", () => {
  assert.deepEqual(
    classifyUrlText("https://example.com/video.mov", {
      ...DEFAULT_SETTINGS,
      videoExtensions: ["mov"],
    }),
    {
      kind: "video-link",
      url: "https://example.com/video.mov",
    }
  );
});

test("无扩展名图片 URL 可通过内置可信来源识别", () => {
  assert.deepEqual(classifyUrlText("https://images.unsplash.com/photo-1", DEFAULT_SETTINGS), {
    kind: "image-link",
    url: "https://images.unsplash.com/photo-1",
  });
});

test("Steam 无扩展名图片 URL 可通过默认规则识别", () => {
  const url = "https://images.steamusercontent.com/ugc/1751306654054219740/8964AA9866F67EB209B64B7F151D13DF053038A5/?imw=5000&imh=5000&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=false";

  assert.deepEqual(classifyUrlText(url, DEFAULT_SETTINGS), {
    kind: "image-link",
    url,
  });
});

test("常见高置信图片来源可被识别", () => {
  assert.equal(classifyUrlText("https://pbs.twimg.com/media/example?format=jpg", DEFAULT_SETTINGS).kind, "image-link");
  assert.equal(classifyUrlText("https://i.ytimg.com/vi/video-id/maxresdefault", DEFAULT_SETTINGS).kind, "image-link");
  assert.equal(classifyUrlText("https://i0.hdslb.com/bfs/archive/example", DEFAULT_SETTINGS).kind, "image-link");
});

test("泛 CDN 不会被误识别为图片", () => {
  assert.equal(classifyUrlText("https://example.cloudfront.net/assets/resource", DEFAULT_SETTINGS).kind, "normal-link");
  assert.equal(classifyUrlText("https://lh3.googleusercontent.com/a/resource", DEFAULT_SETTINGS).kind, "normal-link");
});

test("用户可信图片来源按 host 和路径前缀识别", () => {
  const settings = normalizeSettings({
    ...DEFAULT_SETTINGS,
    trustedImageSources: [
      {
        host: "cdn.example.com",
        pathPrefix: "/images/",
        includeSubdomains: false,
      },
    ],
  });

  assert.equal(classifyUrlText("https://cdn.example.com/images/resource", settings).kind, "image-link");
  assert.equal(classifyUrlText("https://cdn.example.com/files/resource", settings).kind, "normal-link");
  assert.equal(classifyUrlText("https://sub.cdn.example.com/images/resource", settings).kind, "normal-link");
});

test("用户可信图片来源可选择包含子域名", () => {
  const settings = normalizeSettings({
    ...DEFAULT_SETTINGS,
    trustedImageSources: [
      {
        host: "cdn.example.com",
        pathPrefix: "",
        includeSubdomains: true,
      },
    ],
  });

  assert.equal(classifyUrlText("https://sub.cdn.example.com/resource", settings).kind, "image-link");
});

test("高级正则规则仍可识别查询参数图片 URL", () => {
  assert.equal(classifyUrlText("https://example.com/resource?id=1&format=jpg", DEFAULT_SETTINGS).kind, "image-link");
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
      titleRange: {
        from: { line: 3, ch: 6 },
        to: { line: 3, ch: 6 },
      },
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

test("视频链接插入 HTML video 标签并换行", () => {
  assert.deepEqual(
    buildMarkdownInsertion({
      kind: "video-link",
      url: "https://example.com/video.mp4",
      selection: "",
      cursor: { line: 1, ch: 4 },
      useSelectionAsLinkText: true,
      addNewlineAfterImage: true,
    }),
    {
      text: '<video src="https://example.com/video.mp4" controls muted autoplay loop></video>\n',
      cursor: { line: 2, ch: 0 },
    }
  );
});

test("视频链接 src 会进行 HTML 属性转义", () => {
  assert.deepEqual(
    buildMarkdownInsertion({
      kind: "video-link",
      url: "https://example.com/video.mp4?token=abc&x=1",
      selection: "",
      cursor: { line: 0, ch: 0 },
      useSelectionAsLinkText: true,
      addNewlineAfterImage: true,
    }),
    {
      text: '<video src="https://example.com/video.mp4?token=abc&amp;x=1" controls muted autoplay loop></video>\n',
      cursor: { line: 1, ch: 0 },
    }
  );
});

test("YAML frontmatter 范围可被识别", () => {
  const documentText = "---\ntitle: test\n---\nbody";
  assert.equal(isInYamlFrontmatter(documentText, 1), true);
  assert.equal(isInYamlFrontmatter(documentText, 3), false);
});

test("supported title providers match only important sites", () => {
  assert.equal(getSupportedTitleProvider("https://www.bilibili.com/video/BV1xx411c7mD"), "bilibili");
  assert.equal(getSupportedTitleProvider("https://b23.tv/abc123"), "bilibili");
  assert.equal(getSupportedTitleProvider("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "YouTube");
  assert.equal(getSupportedTitleProvider("https://youtu.be/dQw4w9WgXcQ"), "YouTube");
  assert.equal(getSupportedTitleProvider("https://www.fab.com/listings/example"), "Fab");
  assert.equal(getSupportedTitleProvider("https://github.com/cnwenzhihong/Obsidian-auto-paste-link"), "GitHub");
  assert.equal(getSupportedTitleProvider("https://stackoverflow.com/questions/1/example"), "Stack Overflow");
  assert.equal(getSupportedTitleProvider("https://superuser.com/questions/1/example"), "Stack Exchange");
  assert.equal(getSupportedTitleProvider("https://www.reddit.com/r/ObsidianMD/comments/example"), "Reddit");
  assert.equal(getSupportedTitleProvider("https://en.wikipedia.org/wiki/Obsidian"), "Wikipedia");
  assert.equal(getSupportedTitleProvider("https://store.steampowered.com/app/620/Portal_2/"), "Steam");
  assert.equal(getSupportedTitleProvider("https://developer.mozilla.org/en-US/docs/Web/API/URL"), "MDN");
  assert.equal(getSupportedTitleProvider("https://www.npmjs.com/package/obsidian"), "npm");
  assert.equal(getSupportedTitleProvider("https://www.zhihu.com/question/123"), "Zhihu");
  assert.equal(getSupportedTitleProvider("https://juejin.cn/post/123"), "Juejin");
  assert.equal(getSupportedTitleProvider("https://blog.csdn.net/example/article/details/1"), "CSDN");
  assert.equal(getSupportedTitleProvider("https://mp.weixin.qq.com/s/example"), "WeChat Official Accounts");
  assert.equal(getSupportedTitleProvider("https://movie.douban.com/subject/1292052/"), "Douban");
  assert.equal(getSupportedTitleProvider("https://www.cnblogs.com/example/p/1.html"), "CNBlogs");
  assert.equal(getSupportedTitleProvider("https://example.com"), null);
});

test("HTML title extraction prefers Open Graph over Twitter and title tags", () => {
  assert.equal(
    extractHtmlTitle(`
      <title>Title tag</title>
      <meta name="twitter:title" content="Twitter title">
      <meta property="og:title" content="OG &amp; title">
    `),
    "OG & title"
  );
});

test("site title cleanup removes common suffixes", () => {
  assert.equal(cleanBilibiliTitle("视频标题_哔哩哔哩_bilibili"), "视频标题");
  assert.equal(cleanYouTubeTitle("Video title - YouTube"), "Video title");
  assert.equal(cleanFabTitle("Asset title | Fab"), "Asset title");
});

test("bilibili title resolver uses API title when BV id is available", async () => {
  const request: TitleRequest = async (input) => {
    assert.equal(input.url, "https://api.bilibili.com/x/web-interface/view?bvid=BV1xx411c7mD");
    return {
      status: 200,
      headers: {},
      text: JSON.stringify({ data: { title: "Bilibili title" } }),
    };
  };

  assert.equal(
    await resolveSupportedSiteTitle("https://www.bilibili.com/video/BV1xx411c7mD", {
      request,
      timeoutMs: 500,
    }),
    "Bilibili title"
  );
});

test("youtube title resolver uses oEmbed title", async () => {
  const request: TitleRequest = async (input) => {
    assert.match(input.url, /^https:\/\/www\.youtube\.com\/oembed\?/);
    return {
      status: 200,
      headers: {},
      text: JSON.stringify({ title: "YouTube title" }),
    };
  };

  assert.equal(
    await resolveSupportedSiteTitle("https://youtu.be/dQw4w9WgXcQ", {
      request,
      timeoutMs: 500,
    }),
    "YouTube title"
  );
});

test("fab title resolver extracts page title", async () => {
  const request: TitleRequest = async (input) => {
    assert.equal(input.headers?.["User-Agent"], "facebookexternalhit/1.1");
    return {
      status: 200,
      headers: {},
      text: '<title>EASY RECOIL SYSTEM | Fab</title>',
    };
  };

  assert.equal(
    await resolveSupportedSiteTitle("https://www.fab.com/listings/80807922-d57b-47ed-8f3e-1ddc9b3d86eb", {
      request,
      timeoutMs: 500,
    }),
    "EASY RECOIL SYSTEM"
  );
});

test("common HTML title providers extract and clean titles", async () => {
  const cases: Array<[string, string, string]> = [
    ["https://github.com/cnwenzhihong/Obsidian-auto-paste-link", "Auto Paste Link · GitHub", "Auto Paste Link"],
    ["https://stackoverflow.com/questions/1/example", "How to paste URLs - Stack Overflow", "How to paste URLs"],
    ["https://superuser.com/questions/1/example", "Keyboard shortcut - Super User", "Keyboard shortcut"],
    ["https://www.reddit.com/r/ObsidianMD/comments/example", "Plugin discussion - Reddit", "Plugin discussion"],
    ["https://en.wikipedia.org/wiki/Obsidian", "Obsidian - Wikipedia", "Obsidian"],
    ["https://store.steampowered.com/app/620/Portal_2/", "Portal 2 on Steam", "Portal 2"],
    ["https://developer.mozilla.org/en-US/docs/Web/API/URL", "URL | MDN", "URL"],
    ["https://www.npmjs.com/package/obsidian", "obsidian | npm", "obsidian"],
    ["https://www.zhihu.com/question/123", "如何使用 Obsidian？ - 知乎", "如何使用 Obsidian？"],
    ["https://juejin.cn/post/123", "前端工程实践 - 掘金", "前端工程实践"],
    ["https://blog.csdn.net/example/article/details/1", "TypeScript 实践-CSDN博客", "TypeScript 实践"],
    ["https://mp.weixin.qq.com/s/example", "公众号文章标题 - 微信公众平台", "公众号文章标题"],
    ["https://movie.douban.com/subject/1292052/", "肖申克的救赎 (豆瓣)", "肖申克的救赎"],
    ["https://www.cnblogs.com/example/p/1.html", "博客文章 - 博客园", "博客文章"],
  ];

  for (const [url, rawTitle, expectedTitle] of cases) {
    const request: TitleRequest = async (input) => {
      assert.equal(input.url, url);
      return {
        status: 200,
        headers: {},
        text: `<title>${rawTitle}</title>`,
      };
    };

    assert.equal(
      await resolveSupportedSiteTitle(url, {
        request,
        timeoutMs: 500,
      }),
      expectedTitle
    );
  }
});

test("unsupported sites do not request titles", async () => {
  let called = false;
  const request: TitleRequest = async () => {
    called = true;
    return { status: 200, headers: {}, text: "" };
  };

  assert.equal(
    await resolveSupportedSiteTitle("https://example.com", {
      request,
      timeoutMs: 500,
    }),
    null
  );
  assert.equal(called, false);
});

test("title resolver returns null on timeout", async () => {
  const request: TitleRequest = () => new Promise(() => undefined);

  assert.equal(
    await resolveSupportedSiteTitle("https://youtu.be/dQw4w9WgXcQ", {
      request,
      timeoutMs: 1,
    }),
    null
  );
});

test("Ctrl+Shift+V skips exactly one following paste", () => {
  const tracker = new PasteShortcutTracker(1000);
  tracker.handleKeydown(
    {
      key: "v",
      ctrlKey: true,
      metaKey: false,
      shiftKey: true,
    },
    100
  );

  assert.equal(tracker.consumeShouldSkipPaste(200), true);
  assert.equal(tracker.consumeShouldSkipPaste(201), false);
});

test("Ctrl+V does not skip paste handling", () => {
  const tracker = new PasteShortcutTracker(1000);
  tracker.handleKeydown(
    {
      key: "v",
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
    },
    100
  );

  assert.equal(tracker.consumeShouldSkipPaste(200), false);
});

test("Ctrl+Shift+V skip marker expires quickly", () => {
  const tracker = new PasteShortcutTracker(1000);
  tracker.handleKeydown(
    {
      key: "v",
      ctrlKey: true,
      metaKey: false,
      shiftKey: true,
    },
    100
  );

  assert.equal(tracker.consumeShouldSkipPaste(1201), false);
});
