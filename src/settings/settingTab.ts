import { App, PluginSettingTab, Setting } from "obsidian";
import type AutoPasteLinkPlugin from "../main";
import { getSettingText } from "./i18n";
import {
  normalizeImageExtensions,
  normalizePatternList,
  normalizeTitleFetchTimeoutMs,
  normalizeVideoExtensions,
} from "./pluginSettings";

export class AutoPasteLinkSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: AutoPasteLinkPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    const text = getSettingText();
    containerEl.empty();

    addSection(containerEl, text.titleCompletionSectionName);

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

    addSection(containerEl, text.pasteBehaviorSectionName);

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
      .setName(text.processYamlFrontmatterName)
      .setDesc(text.processYamlFrontmatterDesc)
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.processYamlFrontmatter).onChange(async (value) => {
          this.plugin.settings.processYamlFrontmatter = value;
          await this.plugin.saveSettings();
        })
      );

    addSection(containerEl, text.mediaDetectionSectionName);

    const imageSection = addSubsection(containerEl, text.imageSubsectionName);

    new Setting(imageSection)
      .setName(text.embedImageLinksName)
      .setDesc(text.embedImageLinksDesc)
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.embedImageLinks).onChange(async (value) => {
          this.plugin.settings.embedImageLinks = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(imageSection)
      .setName(text.addNewlineAfterImageName)
      .setDesc(text.addNewlineAfterImageDesc)
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.addNewlineAfterImage).onChange(async (value) => {
          this.plugin.settings.addNewlineAfterImage = value;
          await this.plugin.saveSettings();
        })
      );

    const imageExtensionSetting = new Setting(imageSection)
      .setName(text.imageExtensionsName)
      .setDesc(text.imageExtensionsDesc);
    imageExtensionSetting.settingEl.addClass("auto-paste-link-extension-setting");
    imageExtensionSetting.addTextArea((area) =>
      area
        .setValue(this.plugin.settings.imageExtensions.join("\n"))
        .onChange(async (value) => {
          this.plugin.settings.imageExtensions = normalizeImageExtensions(value);
          await this.plugin.saveSettings();
        })
    );

    const patternSetting = new Setting(imageSection)
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

    const videoSection = addSubsection(containerEl, text.videoSubsectionName);

    new Setting(videoSection)
      .setName(text.embedVideoLinksName)
      .setDesc(text.embedVideoLinksDesc)
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.embedVideoLinks).onChange(async (value) => {
          this.plugin.settings.embedVideoLinks = value;
          await this.plugin.saveSettings();
        })
      );

    const videoExtensionSetting = new Setting(videoSection)
      .setName(text.videoExtensionsName)
      .setDesc(text.videoExtensionsDesc);
    videoExtensionSetting.settingEl.addClass("auto-paste-link-extension-setting");
    videoExtensionSetting.addTextArea((area) =>
      area
        .setValue(this.plugin.settings.videoExtensions.join("\n"))
        .onChange(async (value) => {
          this.plugin.settings.videoExtensions = normalizeVideoExtensions(value);
          await this.plugin.saveSettings();
        })
    );
  }
}

function addSection(containerEl: HTMLElement, name: string): void {
  new Setting(containerEl)
    .setName(name)
    .setClass("auto-paste-link-section")
    .setHeading();
}

function addSubsection(containerEl: HTMLElement, name: string): HTMLElement {
  const details = containerEl.createEl("details", {
    cls: "auto-paste-link-subsection",
    attr: {
      open: "",
    },
  });
  details.createEl("summary", {
    cls: "auto-paste-link-subsection-summary",
    text: name,
  });

  return details.createDiv({
    cls: "auto-paste-link-subsection-content",
  });
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
