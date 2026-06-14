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
  cleanCsdnTitle,
  cleanFabTitle,
  cleanSteamTitle,
  cleanYouTubeTitle,
  extractGenericHtmlTitle,
  extractHtmlTitle,
  getSupportedTitleProvider,
  resolveSupportedSiteTitle,
  SUPPORTED_SITE_GROUPS,
  SUPPORTED_SITE_NAMES,
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

test("用户可信视频来源按 host 和路径前缀识别", () => {
  const settings = normalizeSettings({
    ...DEFAULT_SETTINGS,
    trustedVideoSources: [
      {
        host: "media.example.com",
        pathPrefix: "/videos/",
        includeSubdomains: false,
      },
    ],
  });

  assert.equal(classifyUrlText("https://media.example.com/videos/resource", settings).kind, "video-link");
  assert.equal(classifyUrlText("https://media.example.com/files/resource", settings).kind, "normal-link");
  assert.equal(classifyUrlText("https://sub.media.example.com/videos/resource", settings).kind, "normal-link");
});

test("用户可信视频来源可选择包含子域名", () => {
  const settings = normalizeSettings({
    ...DEFAULT_SETTINGS,
    trustedVideoSources: [
      {
        host: "media.example.com",
        pathPrefix: "",
        includeSubdomains: true,
      },
    ],
  });

  assert.equal(classifyUrlText("https://sub.media.example.com/resource", settings).kind, "video-link");
});

test("同时命中视频可信来源和图片扩展名时图片优先", () => {
  const settings = normalizeSettings({
    ...DEFAULT_SETTINGS,
    trustedVideoSources: [
      {
        host: "media.example.com",
        pathPrefix: "/videos/",
        includeSubdomains: false,
      },
    ],
  });

  assert.equal(classifyUrlText("https://media.example.com/videos/cover.jpg", settings).kind, "image-link");
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
  assert.equal(getSupportedTitleProvider("https://gitlab.com/gitlab-org/gitlab"), "GitLab");
  assert.equal(getSupportedTitleProvider("https://gitee.com/oschina/git-osc"), "Gitee");
  assert.equal(getSupportedTitleProvider("https://stackoverflow.com/questions/1/example"), "Stack Overflow");
  assert.equal(getSupportedTitleProvider("https://superuser.com/questions/1/example"), "Stack Exchange");
  assert.equal(getSupportedTitleProvider("https://www.reddit.com/r/ObsidianMD/comments/example"), "Reddit");
  assert.equal(getSupportedTitleProvider("https://en.wikipedia.org/wiki/Obsidian"), "Wikipedia");
  assert.equal(getSupportedTitleProvider("https://store.steampowered.com/app/620/Portal_2/"), "Steam");
  assert.equal(getSupportedTitleProvider("https://www.themoviedb.org/movie/27205-inception"), "TMDb");
  assert.equal(getSupportedTitleProvider("https://letterboxd.com/film/inception/"), "Letterboxd");
  assert.equal(getSupportedTitleProvider("https://www.rottentomatoes.com/m/inception"), "Rotten Tomatoes");
  assert.equal(getSupportedTitleProvider("https://myanimelist.net/anime/20/Naruto"), "MyAnimeList");
  assert.equal(getSupportedTitleProvider("https://bangumi.tv/subject/975"), "Bangumi");
  assert.equal(getSupportedTitleProvider("https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"), "Spotify");
  assert.equal(getSupportedTitleProvider("https://www.dailymotion.com/video/x84sh87"), "Dailymotion");
  assert.equal(getSupportedTitleProvider("https://developer.mozilla.org/en-US/docs/Web/API/URL"), "MDN");
  assert.equal(getSupportedTitleProvider("https://www.npmjs.com/package/obsidian"), "npm");
  assert.equal(getSupportedTitleProvider("https://pypi.org/project/requests/"), "PyPI");
  assert.equal(getSupportedTitleProvider("https://crates.io/crates/serde"), "crates.io");
  assert.equal(getSupportedTitleProvider("https://pkg.go.dev/net/http"), "Go Packages");
  assert.equal(getSupportedTitleProvider("https://developer.apple.com/documentation/foundation/url"), "Apple Developer");
  assert.equal(getSupportedTitleProvider("https://unity.com/products/unity-engine"), "Unity");
  assert.equal(getSupportedTitleProvider("https://nextjs.org/docs"), "Next.js");
  assert.equal(getSupportedTitleProvider("https://vuejs.org/guide/introduction.html"), "Vue.js");
  assert.equal(getSupportedTitleProvider("https://nodejs.org/en/learn/getting-started/introduction-to-nodejs"), "Node.js");
  assert.equal(getSupportedTitleProvider("https://www.zhihu.com/question/123"), null);
  assert.equal(getSupportedTitleProvider("https://juejin.cn/post/123"), "Juejin");
  assert.equal(getSupportedTitleProvider("https://blog.csdn.net/example/article/details/1"), "CSDN");
  assert.equal(getSupportedTitleProvider("https://cloud.tencent.com/developer/article/2400200"), "Tencent Cloud Developer");
  assert.equal(getSupportedTitleProvider("https://developer.aliyun.com/article/1488487"), "Alibaba Cloud Developer");
  assert.equal(getSupportedTitleProvider("https://mp.weixin.qq.com/s/example"), "WeChat Official Accounts");
  assert.equal(getSupportedTitleProvider("https://movie.douban.com/subject/1292052/"), "Douban");
  assert.equal(getSupportedTitleProvider("https://www.cnblogs.com/example/p/1.html"), "CNBlogs");
  assert.equal(getSupportedTitleProvider("https://segmentfault.com/a/1190000040000000"), "SegmentFault");
  assert.equal(getSupportedTitleProvider("https://www.jianshu.com/p/1"), "Jianshu");
  assert.equal(getSupportedTitleProvider("https://example.com"), null);
});

test("supported title site names are generated from groups", () => {
  const groupedNames = SUPPORTED_SITE_GROUPS.flatMap((group) =>
    group.providers.map((provider) => provider.displayName)
  );

  assert.deepEqual(SUPPORTED_SITE_NAMES, groupedNames);
  assert.equal(new Set(SUPPORTED_SITE_NAMES).size, SUPPORTED_SITE_NAMES.length);
  assert.deepEqual(
    SUPPORTED_SITE_GROUPS.map((group) => group.id),
    ["video-creation", "entertainment", "code-development", "community-knowledge", "chinese-content"]
  );
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

test("generic title extraction accepts clean social title", () => {
  assert.equal(
    extractGenericHtmlTitle(
      '<title>Ignored</title><meta property="og:title" content="Clean title">',
      new URL("https://example.com/article")
    ),
    "Clean title"
  );
});

test("generic title extraction strips a host-related suffix", () => {
  assert.equal(
    extractGenericHtmlTitle("<title>Clean title - example.com</title>", new URL("https://example.com/article")),
    "Clean title"
  );
});

test("generic title extraction rejects noisy multi-part titles", () => {
  assert.equal(
    extractGenericHtmlTitle("<title>A - B - C | D</title>", new URL("https://example.com/article")),
    null
  );
});

test("generic title extraction rejects blocked verification titles", () => {
  assert.equal(
    extractGenericHtmlTitle("<title>Just a moment...</title>", new URL("https://example.com/article")),
    null
  );
});

test("site title cleanup removes common suffixes", () => {
  assert.equal(cleanBilibiliTitle("视频标题_哔哩哔哩_bilibili"), "视频标题");
  assert.equal(cleanYouTubeTitle("Video title - YouTube"), "Video title");
  assert.equal(cleanFabTitle("Asset title | Fab"), "Asset title");
  assert.equal(cleanSteamTitle("Save 30% on DYNASTY WARRIORS: ORIGINS on Steam"), "DYNASTY WARRIORS: ORIGINS");
  assert.equal(cleanSteamTitle("在 Steam 上购买 真・三国无双 起源 立省 30%"), "真・三国无双 起源");
  assert.equal(cleanCsdnTitle("UE5 Lyra中的UI层级与资产管理_commonui ue-CSDN博客"), "UE5 Lyra中的UI层级与资产管理");
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

test("steam title resolver uses appdetails name when app id is available", async () => {
  const request: TitleRequest = async (input) => {
    assert.match(input.url, /^https:\/\/store\.steampowered\.com\/api\/appdetails\?/);
    return {
      status: 200,
      headers: {},
      text: JSON.stringify({
        2384580: {
          success: true,
          data: {
            name: "真・三国无双 起源",
          },
        },
      }),
    };
  };

  assert.equal(
    await resolveSupportedSiteTitle("https://store.steampowered.com/app/2384580/_/", {
      request,
      timeoutMs: 500,
    }),
    "真・三国无双 起源"
  );
});

test("entertainment oEmbed providers use API titles", async () => {
  const request: TitleRequest = async (input) => {
    if (input.url.startsWith("https://open.spotify.com/oembed?")) {
      return {
        status: 200,
        headers: {},
        text: JSON.stringify({ title: "Never Gonna Give You Up" }),
      };
    }

    assert.match(input.url, /^https:\/\/www\.dailymotion\.com\/services\/oembed\?/);
    return {
      status: 200,
      headers: {},
      text: JSON.stringify({ title: "Dailymotion demo video" }),
    };
  };

  assert.equal(
    await resolveSupportedSiteTitle("https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT", {
      request,
      timeoutMs: 500,
    }),
    "Never Gonna Give You Up"
  );
  assert.equal(
    await resolveSupportedSiteTitle("https://www.dailymotion.com/video/x84sh87", {
      request,
      timeoutMs: 500,
    }),
    "Dailymotion demo video"
  );
});

test("github repository title format can be configured", async () => {
  const request: TitleRequest = async (input) => ({
    status: 200,
    headers: {},
    text: `<title>${input.url}</title>`,
  });

  const url = "https://github.com/cnwenzhihong/Obsidian-auto-paste-link";
  assert.equal(
    await resolveSupportedSiteTitle(url, {
      request,
      timeoutMs: 500,
      githubTitleFormat: "repository",
    }),
    "Obsidian-auto-paste-link"
  );
  assert.equal(
    await resolveSupportedSiteTitle(url, {
      request,
      timeoutMs: 500,
      githubTitleFormat: "owner-repository",
    }),
    "cnwenzhihong/Obsidian-auto-paste-link"
  );
  assert.equal(
    await resolveSupportedSiteTitle(url, {
      request,
      timeoutMs: 500,
      githubTitleFormat: "github-owner-repository",
    }),
    "GitHub - cnwenzhihong/Obsidian-auto-paste-link"
  );
});

test("code hosting providers can format repository paths", async () => {
  const request: TitleRequest = async (input) => ({
    status: 200,
    headers: {},
    text: `<title>${input.url}</title>`,
  });

  assert.equal(
    await resolveSupportedSiteTitle("https://gitlab.com/gitlab-org/gitlab", {
      request,
      timeoutMs: 500,
    }),
    "gitlab-org/gitlab"
  );
  assert.equal(
    await resolveSupportedSiteTitle("https://gitee.com/oschina/git-osc", {
      request,
      timeoutMs: 500,
    }),
    "oschina/git-osc"
  );
});

test("package registry providers use stable package names", async () => {
  const request: TitleRequest = async (input) => {
    if (input.url === "https://registry.npmjs.org/typescript") {
      return {
        status: 200,
        headers: {},
        text: JSON.stringify({ name: "typescript" }),
      };
    }

    if (input.url === "https://pypi.org/pypi/requests/json") {
      return {
        status: 200,
        headers: {},
        text: JSON.stringify({ info: { name: "requests" } }),
      };
    }

    return {
      status: 200,
      headers: {},
      text: "<title>crates.io: Rust Package Registry</title>",
    };
  };

  assert.equal(
    await resolveSupportedSiteTitle("https://www.npmjs.com/package/typescript", {
      request,
      timeoutMs: 500,
    }),
    "typescript"
  );
  assert.equal(
    await resolveSupportedSiteTitle("https://pypi.org/project/requests/", {
      request,
      timeoutMs: 500,
    }),
    "requests"
  );
  assert.equal(
    await resolveSupportedSiteTitle("https://crates.io/crates/serde", {
      request,
      timeoutMs: 500,
    }),
    "serde"
  );
});

test("blocked verification titles are ignored", async () => {
  const request: TitleRequest = async () => ({
    status: 200,
    headers: {},
    text: "<title>Reddit - Please wait for verification</title>",
  });

  assert.equal(
    await resolveSupportedSiteTitle("https://www.reddit.com/r/ObsidianMD/comments/example", {
      request,
      timeoutMs: 500,
    }),
    null
  );
});

test("wikipedia falls back to URL path title when request fails", async () => {
  const request: TitleRequest = async () => ({
    status: 503,
    headers: {},
    text: "",
  });

  assert.equal(
    await resolveSupportedSiteTitle("https://en.wikipedia.org/wiki/Obsidian_(software)", {
      request,
      timeoutMs: 500,
    }),
    "Obsidian (software)"
  );
});

test("generic resolver fetches clean titles for unsupported sites when enabled", async () => {
  const request: TitleRequest = async (input) => {
    assert.equal(input.url, "https://example.com/article");
    return {
      status: 200,
      headers: {},
      text: '<meta property="og:title" content="Clean title">',
    };
  };

  assert.equal(
    await resolveSupportedSiteTitle("https://example.com/article", {
      request,
      timeoutMs: 500,
      fetchGenericSiteTitle: true,
    }),
    "Clean title"
  );
});

test("generic resolver does not request unsupported sites when disabled", async () => {
  let called = false;
  const request: TitleRequest = async () => {
    called = true;
    return { status: 200, headers: {}, text: "" };
  };

  assert.equal(
    await resolveSupportedSiteTitle("https://example.com/article", {
      request,
      timeoutMs: 500,
      fetchGenericSiteTitle: false,
    }),
    null
  );
  assert.equal(called, false);
});

test("supported providers take priority over generic title fetching", async () => {
  const request: TitleRequest = async (input) => {
    assert.match(input.url, /^https:\/\/store\.steampowered\.com\/api\/appdetails\?/);
    return {
      status: 200,
      headers: {},
      text: JSON.stringify({
        620: {
          success: true,
          data: {
            name: "Portal 2",
          },
        },
      }),
    };
  };

  assert.equal(
    await resolveSupportedSiteTitle("https://store.steampowered.com/app/620/Portal_2/", {
      request,
      timeoutMs: 500,
      fetchGenericSiteTitle: true,
    }),
    "Portal 2"
  );
});

test("common HTML title providers extract and clean titles", async () => {
  const cases: Array<[string, string, string]> = [
    ["https://stackoverflow.com/questions/1/example", "How to paste URLs - Stack Overflow", "How to paste URLs"],
    ["https://superuser.com/questions/1/example", "Keyboard shortcut - Super User", "Keyboard shortcut"],
    ["https://www.reddit.com/r/ObsidianMD/comments/example", "Plugin discussion - Reddit", "Plugin discussion"],
    ["https://en.wikipedia.org/wiki/Obsidian", "Obsidian - Wikipedia", "Obsidian"],
    ["https://www.themoviedb.org/movie/27205-inception", "Inception &#8212; The Movie Database (TMDB)", "Inception"],
    ["https://letterboxd.com/film/inception/", "\u200eInception (2010) directed by Christopher Nolan • Reviews, film + cast • Letterboxd", "Inception (2010)"],
    ["https://www.rottentomatoes.com/m/inception", "Inception | Rotten Tomatoes", "Inception"],
    ["https://myanimelist.net/anime/20/Naruto", "Naruto - MyAnimeList.net", "Naruto"],
    ["https://bangumi.tv/subject/975", "ONE PIECE | Bangumi 番组计划", "ONE PIECE"],
    ["https://developer.mozilla.org/en-US/docs/Web/API/URL", "URL | MDN", "URL"],
    ["https://pkg.go.dev/net/http", "http package - net/http - Go Packages", "http package - net/http"],
    ["https://developer.apple.com/documentation/foundation/url", "URL | Apple Developer Documentation", "URL"],
    ["https://unity.com/products/unity-engine", "Unity Engine: 2D &amp; 3D Development Platform | Unity", "Unity Engine: 2D & 3D Development Platform"],
    ["https://nextjs.org/docs", "Next.js Docs | Next.js", "Next.js Docs"],
    ["https://vuejs.org/guide/introduction.html", "<meta property=\"og:title\" content=\"Vue.js\"><title>Introduction | Vue.js</title>", "Introduction"],
    ["https://nodejs.org/en/learn/getting-started/introduction-to-nodejs", "Introduction to Node.js | Node.js Learn", "Introduction to Node.js"],
    ["https://juejin.cn/post/123", "前端工程实践 - 掘金", "前端工程实践"],
    ["https://blog.csdn.net/example/article/details/1", "UE5 Lyra中的UI层级与资产管理_commonui ue-CSDN博客", "UE5 Lyra中的UI层级与资产管理"],
    ["https://cloud.tencent.com/developer/article/2400200", "Docker部署Alist全平台网盘神器-腾讯云开发者社区-腾讯云", "Docker部署Alist全平台网盘神器"],
    ["https://developer.aliyun.com/article/1488487", "点击事件中的this|click事件与change事件|v-model-阿里云开发者社区", "点击事件中的this|click事件与change事件|v-model"],
    ["https://mp.weixin.qq.com/s/example", "公众号文章标题 - 微信公众平台", "公众号文章标题"],
    ["https://movie.douban.com/subject/1292052/", "肖申克的救赎 (豆瓣)", "肖申克的救赎"],
    ["https://www.cnblogs.com/example/p/1.html", "博客文章 - 博客园", "博客文章"],
    ["https://segmentfault.com/a/1190000040000000", "文章标题 - SegmentFault 思否", "文章标题"],
  ];

  for (const [url, rawTitle, expectedTitle] of cases) {
    const request: TitleRequest = async (input) => {
      assert.equal(input.url, url);
      return {
        status: 200,
        headers: {},
        text: rawTitle.includes("<") ? rawTitle : `<title>${rawTitle}</title>`,
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
