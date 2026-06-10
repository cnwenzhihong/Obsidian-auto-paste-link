import { App, PluginSettingTab, Setting } from "obsidian";
import type AutoPasteLinkPlugin from "../main";
import { normalizeImageExtensions, normalizePatternList } from "./pluginSettings";

export class AutoPasteLinkSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: AutoPasteLinkPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("启用插件")
      .setDesc("关闭后不拦截任何粘贴行为。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enabled).onChange(async (value) => {
          this.plugin.settings.enabled = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("处理 YAML frontmatter")
      .setDesc("默认关闭，避免破坏笔记顶部元数据。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.processYamlFrontmatter).onChange(async (value) => {
          this.plugin.settings.processYamlFrontmatter = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("选中文本作为链接标题")
      .setDesc("开启后，选中文字再粘贴普通 URL 会生成 [选中文字](URL)。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.useSelectionAsLinkText).onChange(async (value) => {
          this.plugin.settings.useSelectionAsLinkText = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("图片链接后自动换行")
      .setDesc("开启后，图片 Markdown 插入完成后光标移动到下一行开头。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.addNewlineAfterImage).onChange(async (value) => {
          this.plugin.settings.addNewlineAfterImage = value;
          await this.plugin.saveSettings();
        })
      );

    const extensionSetting = new Setting(containerEl)
      .setName("图片扩展名")
      .setDesc("每行或逗号分隔一个扩展名，不需要写点号。");
    extensionSetting.settingEl.addClass("auto-paste-link-setting");
    extensionSetting.addTextArea((text) =>
      text
        .setValue(this.plugin.settings.imageExtensions.join("\n"))
        .onChange(async (value) => {
          this.plugin.settings.imageExtensions = normalizeImageExtensions(value);
          await this.plugin.saveSettings();
        })
    );

    const patternSetting = new Setting(containerEl)
      .setName("图片链接匹配规则")
      .setDesc("每行一个 JavaScript 正则，用于识别无扩展名图片 URL。无效正则会被忽略。");
    patternSetting.settingEl.addClass("auto-paste-link-setting");
    patternSetting.addTextArea((text) =>
      text
        .setValue(this.plugin.settings.imageUrlPatterns.join("\n"))
        .onChange(async (value) => {
          this.plugin.settings.imageUrlPatterns = normalizePatternList(value);
          await this.plugin.saveSettings();
        })
    );
  }
}
