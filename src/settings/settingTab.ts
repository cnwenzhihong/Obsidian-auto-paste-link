import { App, PluginSettingTab, Setting } from "obsidian";
import type AutoPasteLinkPlugin from "../main";
import { getSettingText } from "./i18n";
import {
  normalizeImageExtensions,
  normalizePatternList,
  normalizeTitleFetchTimeoutMs,
} from "./pluginSettings";

export class AutoPasteLinkSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: AutoPasteLinkPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    const text = getSettingText();
    containerEl.empty();

    addSection(containerEl, text.titleCompletionSectionName, text.titleCompletionSectionDesc);

    new Setting(containerEl)
      .setName(text.fetchSupportedSiteTitleName)
      .setDesc(text.fetchSupportedSiteTitleDesc)
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.fetchSupportedSiteTitle).onChange(async (value) => {
          this.plugin.settings.fetchSupportedSiteTitle = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName(text.titleFetchTimeoutName)
      .setDesc(createDescription(text.titleFetchTimeoutDesc, text.fabSlowHint))
      .addText((input) =>
        input
          .setValue(String(this.plugin.settings.titleFetchTimeoutMs))
          .onChange(async (value) => {
            this.plugin.settings.titleFetchTimeoutMs = normalizeTitleFetchTimeoutMs(value);
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(text.supportedSitesName)
      .setDesc(text.supportedSitesDesc);

    addSection(containerEl, text.pasteBehaviorSectionName, text.pasteBehaviorSectionDesc);

    new Setting(containerEl)
      .setName(text.useSelectionAsLinkTextName)
      .setDesc(text.useSelectionAsLinkTextDesc)
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.useSelectionAsLinkText).onChange(async (value) => {
          this.plugin.settings.useSelectionAsLinkText = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName(text.addNewlineAfterImageName)
      .setDesc(text.addNewlineAfterImageDesc)
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.addNewlineAfterImage).onChange(async (value) => {
          this.plugin.settings.addNewlineAfterImage = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName(text.processYamlFrontmatterName)
      .setDesc(text.processYamlFrontmatterDesc)
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.processYamlFrontmatter).onChange(async (value) => {
          this.plugin.settings.processYamlFrontmatter = value;
          await this.plugin.saveSettings();
        })
      );

    addSection(containerEl, text.imageDetectionSectionName, text.imageDetectionSectionDesc);

    const extensionSetting = new Setting(containerEl)
      .setName(text.imageExtensionsName)
      .setDesc(text.imageExtensionsDesc);
    extensionSetting.settingEl.addClass("auto-paste-link-setting");
    extensionSetting.addTextArea((area) =>
      area
        .setValue(this.plugin.settings.imageExtensions.join("\n"))
        .onChange(async (value) => {
          this.plugin.settings.imageExtensions = normalizeImageExtensions(value);
          await this.plugin.saveSettings();
        })
    );

    const patternSetting = new Setting(containerEl)
      .setName(text.imageUrlPatternsName)
      .setDesc(text.imageUrlPatternsDesc);
    patternSetting.settingEl.addClass("auto-paste-link-setting");
    patternSetting.addTextArea((area) =>
      area
        .setValue(this.plugin.settings.imageUrlPatterns.join("\n"))
        .onChange(async (value) => {
          this.plugin.settings.imageUrlPatterns = normalizePatternList(value);
          await this.plugin.saveSettings();
        })
    );
  }
}

function addSection(containerEl: HTMLElement, name: string, description: string): void {
  new Setting(containerEl)
    .setName(name)
    .setDesc(description)
    .setClass("auto-paste-link-section")
    .setHeading();
}

function createDescription(description: string, hint: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  fragment.append(description);

  const hintEl = document.createElement("div");
  hintEl.classList.add("auto-paste-link-setting-hint");
  hintEl.textContent = hint;
  fragment.append(hintEl);

  return fragment;
}
