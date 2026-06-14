import { App, PluginSettingTab, Setting } from "obsidian";
import { SUPPORTED_SITE_GROUPS, type SupportedSiteGroup } from "../core/titleResolver";
import type AutoPasteLinkPlugin from "../main";
import { getSettingText } from "./i18n";
import {
  BUILTIN_TRUSTED_IMAGE_SOURCES,
  normalizeGitHubTitleFormat,
  normalizeImageExtensions,
  normalizePatternList,
  normalizeTitleFetchTimeoutMs,
  normalizeTrustedImageSources,
  normalizeTrustedVideoSources,
  normalizeVideoExtensions,
  type TrustedMediaSource,
} from "./pluginSettings";

export class AutoPasteLinkSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: AutoPasteLinkPlugin) {
    super(app, plugin);
  }

  display(): void {
    this.renderSettings();
  }

  private renderSettings(): void {
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

    const siteSupportSection = addSubsection(containerEl, text.siteSupportSubsectionName);
    new Setting(siteSupportSection)
      .setName(text.supportedSitesName)
      .setDesc(createSupportedSitesDescription(SUPPORTED_SITE_GROUPS, text.language, text.supportedSitesDesc));

    new Setting(siteSupportSection)
      .setName(text.fetchGenericSiteTitleName)
      .setDesc(text.fetchGenericSiteTitleDesc)
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.fetchGenericSiteTitle).onChange(async (value) => {
          this.plugin.settings.fetchGenericSiteTitle = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(siteSupportSection)
      .setName(text.githubTitleFormatName)
      .setDesc(text.githubTitleFormatDesc)
      .addDropdown((dropdown) =>
        dropdown
          .addOption("repository", text.githubTitleFormatRepository)
          .addOption("owner-repository", text.githubTitleFormatOwnerRepository)
          .addOption("github-owner-repository", text.githubTitleFormatGitHubOwnerRepository)
          .setValue(this.plugin.settings.githubTitleFormat)
          .onChange(async (value) => {
            this.plugin.settings.githubTitleFormat = normalizeGitHubTitleFormat(value);
            await this.plugin.saveSettings();
          })
      );

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

    new Setting(imageSection)
      .setName(text.builtinTrustedImageSourcesName)
      .setDesc(createTrustedMediaSourcesDescription(BUILTIN_TRUSTED_IMAGE_SOURCES));

    new Setting(imageSection)
      .setName(text.trustedImageSourcesName)
      .setDesc(text.trustedImageSourcesDesc)
      .addButton((button) =>
        button
          .setButtonText(text.addTrustedImageSourceButtonText)
          .onClick(() => {
            this.plugin.settings.trustedImageSources = [
              ...this.plugin.settings.trustedImageSources,
              createEmptyTrustedMediaSource(),
            ];
            this.renderSettings();
          })
      );

    this.plugin.settings.trustedImageSources.forEach((source, index) => {
      new Setting(imageSection)
        .setName(`${text.trustedImageSourceRowName} ${index + 1}`)
        .setDesc(text.trustedImageSourceRowDesc)
        .addText((input) =>
          input
            .setPlaceholder(text.trustedImageSourceHostPlaceholder)
            .setValue(source.host)
            .onChange(async (value) => {
              await this.updateTrustedImageSource(index, {
                host: value,
              });
            })
        )
        .addText((input) =>
          input
            .setPlaceholder(text.trustedImageSourcePathPrefixPlaceholder)
            .setValue(source.pathPrefix)
            .onChange(async (value) => {
              await this.updateTrustedImageSource(index, {
                pathPrefix: value,
              });
            })
        )
        .addToggle((toggle) =>
          toggle
            .setTooltip(text.trustedImageSourceIncludeSubdomainsText)
            .setValue(source.includeSubdomains)
            .onChange(async (value) => {
              await this.updateTrustedImageSource(index, {
                includeSubdomains: value,
              });
            })
        )
        .addButton((button) =>
          button
            .setButtonText(text.deleteTrustedImageSourceButtonText)
            .onClick(async () => {
              this.plugin.settings.trustedImageSources = this.plugin.settings.trustedImageSources.filter(
                (_, sourceIndex) => sourceIndex !== index
              );
              await this.plugin.saveSettings();
              this.renderSettings();
            })
        );
    });

    const advancedImageSection = addSubsection(imageSection, text.advancedImageRulesSubsectionName);
    const patternSetting = new Setting(advancedImageSection)
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

    new Setting(videoSection)
      .setName(text.trustedVideoSourcesName)
      .setDesc(text.trustedVideoSourcesDesc)
      .addButton((button) =>
        button
          .setButtonText(text.addTrustedImageSourceButtonText)
          .onClick(() => {
            this.plugin.settings.trustedVideoSources = [
              ...this.plugin.settings.trustedVideoSources,
              createEmptyTrustedMediaSource(),
            ];
            this.renderSettings();
          })
      );

    this.plugin.settings.trustedVideoSources.forEach((source, index) => {
      new Setting(videoSection)
        .setName(`${text.trustedImageSourceRowName} ${index + 1}`)
        .setDesc(text.trustedImageSourceRowDesc)
        .addText((input) =>
          input
            .setPlaceholder(text.trustedImageSourceHostPlaceholder)
            .setValue(source.host)
            .onChange(async (value) => {
              await this.updateTrustedVideoSource(index, {
                host: value,
              });
            })
        )
        .addText((input) =>
          input
            .setPlaceholder(text.trustedImageSourcePathPrefixPlaceholder)
            .setValue(source.pathPrefix)
            .onChange(async (value) => {
              await this.updateTrustedVideoSource(index, {
                pathPrefix: value,
              });
            })
        )
        .addToggle((toggle) =>
          toggle
            .setTooltip(text.trustedImageSourceIncludeSubdomainsText)
            .setValue(source.includeSubdomains)
            .onChange(async (value) => {
              await this.updateTrustedVideoSource(index, {
                includeSubdomains: value,
              });
            })
        )
        .addButton((button) =>
          button
            .setButtonText(text.deleteTrustedImageSourceButtonText)
            .onClick(async () => {
              this.plugin.settings.trustedVideoSources = this.plugin.settings.trustedVideoSources.filter(
                (_, sourceIndex) => sourceIndex !== index
              );
              await this.plugin.saveSettings();
              this.renderSettings();
            })
        );
    });
  }

  private async updateTrustedImageSource(index: number, patch: Partial<TrustedMediaSource>): Promise<void> {
    const sources = [...this.plugin.settings.trustedImageSources];
    sources[index] = {
      ...(sources[index] ?? createEmptyTrustedMediaSource()),
      ...patch,
    };
    this.plugin.settings.trustedImageSources = normalizeTrustedImageSources(sources);
    await this.plugin.saveSettings();
  }

  private async updateTrustedVideoSource(index: number, patch: Partial<TrustedMediaSource>): Promise<void> {
    const sources = [...this.plugin.settings.trustedVideoSources];
    sources[index] = {
      ...(sources[index] ?? createEmptyTrustedMediaSource()),
      ...patch,
    };
    this.plugin.settings.trustedVideoSources = normalizeTrustedVideoSources(sources);
    await this.plugin.saveSettings();
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
  const fragment = activeDocument.createDocumentFragment();
  fragment.append(description);

  const hintEl = activeDocument.createElement("div");
  hintEl.classList.add("auto-paste-link-setting-hint");
  hintEl.textContent = hint;
  fragment.append(hintEl);

  return fragment;
}

function createSupportedSitesDescription(
  groups: readonly SupportedSiteGroup[],
  language: "zh" | "en",
  description: string
): DocumentFragment {
  const fragment = activeDocument.createDocumentFragment();
  fragment.append(description);

  const list = activeDocument.createElement("ul");
  for (const group of groups) {
    const item = activeDocument.createElement("li");
    const groupName = language === "zh" ? group.zhName : group.enName;
    const separator = language === "zh" ? "、" : ", ";
    item.textContent = `${groupName}: ${group.providers.map((provider) => provider.displayName).join(separator)}`;
    list.append(item);
  }

  fragment.append(list);
  return fragment;
}

function createTrustedMediaSourcesDescription(sources: TrustedMediaSource[]): DocumentFragment {
  const fragment = activeDocument.createDocumentFragment();
  const list = activeDocument.createElement("ul");

  for (const source of sources) {
    const item = activeDocument.createElement("li");
    const pathPrefix = source.pathPrefix || "/";
    item.textContent = `${source.host}${pathPrefix}`;
    list.append(item);
  }

  fragment.append(list);
  return fragment;
}

function createEmptyTrustedMediaSource(): TrustedMediaSource {
  return {
    host: "",
    pathPrefix: "",
    includeSubdomains: false,
  };
}
