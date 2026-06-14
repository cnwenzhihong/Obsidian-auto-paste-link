import type { TitleProvider } from "../types.ts";
import {
  cleanCsdnTitle,
  cleanSiteSuffix,
  createHtmlTitleProvider,
  extractHtmlTitle,
  HTML_HEADERS,
  isHost,
} from "../utils.ts";

const juejinProvider = createHtmlTitleProvider({
  id: "juejin",
  displayName: "Juejin",
  domains: ["juejin.cn"],
  suffixes: [" - 掘金"],
});

const csdnProvider: TitleProvider = {
  id: "csdn",
  displayName: "CSDN",
  matches(url) {
    return isHost(url, "blog.csdn.net") || isHost(url, "csdn.net");
  },
  createRequests(_url, rawUrl) {
    return createHtmlRequest(rawUrl);
  },
  parse(response) {
    return cleanCsdnTitle(extractHtmlTitle(response.text));
  },
};

const tencentCloudProvider = createHtmlTitleProvider({
  id: "tencent-cloud",
  displayName: "Tencent Cloud Developer",
  domains: ["cloud.tencent.com"],
  suffixes: ["-腾讯云开发者社区-腾讯云", "-腾讯云开发者社区", "-腾讯云"],
});

const aliyunDeveloperProvider = createHtmlTitleProvider({
  id: "aliyun-developer",
  displayName: "Alibaba Cloud Developer",
  domains: ["developer.aliyun.com"],
  suffixes: ["-阿里云开发者社区", " - 阿里云开发者社区"],
});

const wechatProvider = createHtmlTitleProvider({
  id: "wechat",
  displayName: "WeChat Official Accounts",
  domains: ["mp.weixin.qq.com"],
  suffixes: [" - 微信公众平台"],
});

const doubanProvider = createHtmlTitleProvider({
  id: "douban",
  displayName: "Douban",
  domains: ["douban.com"],
  suffixes: [" (豆瓣)", " | 豆瓣"],
});

const cnblogsProvider = createHtmlTitleProvider({
  id: "cnblogs",
  displayName: "CNBlogs",
  domains: ["cnblogs.com"],
  suffixes: [" - 博客园"],
});

const segmentFaultProvider = createHtmlTitleProvider({
  id: "segmentfault",
  displayName: "SegmentFault",
  domains: ["segmentfault.com"],
  suffixes: [" - SegmentFault 思否", " - SegmentFault"],
});

const jianshuProvider: TitleProvider = {
  id: "jianshu",
  displayName: "Jianshu",
  matches(url) {
    return isHost(url, "jianshu.com");
  },
  createRequests(_url, rawUrl) {
    return createHtmlRequest(rawUrl);
  },
  parse(response) {
    const title = cleanSiteSuffix(extractHtmlTitle(response.text), [" - 简书"]);
    return title === "抱歉，你访问的页面不存在。" ? null : title;
  },
};

export const chineseContentProviders: readonly TitleProvider[] = [
  juejinProvider,
  csdnProvider,
  tencentCloudProvider,
  aliyunDeveloperProvider,
  wechatProvider,
  doubanProvider,
  cnblogsProvider,
  segmentFaultProvider,
  jianshuProvider,
];

function createHtmlRequest(rawUrl: string) {
  return [
    {
      kind: "html",
      request: {
        url: rawUrl,
        headers: HTML_HEADERS,
      },
    },
  ];
}
