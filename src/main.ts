import { MarkdownView, Plugin } from "obsidian";
import { EditorView } from "@codemirror/view";
import { PasteHandler } from "./core/pasteHandler";
import { PasteShortcutTracker } from "./core/pasteShortcutTracker";
import { AutoPasteLinkSettingTab } from "./settings/settingTab";
import {
  DEFAULT_SETTINGS,
  normalizeSettings,
  type AutoPasteLinkSettings,
} from "./settings/pluginSettings";

export default class AutoPasteLinkPlugin extends Plugin {
  settings: AutoPasteLinkSettings = DEFAULT_SETTINGS;
  private pasteHandler: PasteHandler | null = null;
  private pasteShortcutTracker = new PasteShortcutTracker();

  async onload(): Promise<void> {
    await this.loadSettings();
    this.pasteHandler = new PasteHandler(
      () => this.settings,
      () => this.pasteShortcutTracker.consumeShouldSkipPaste()
    );

    this.registerDomEvent(
      document,
      "keydown",
      (event) => {
        this.pasteShortcutTracker.handleKeydown(event);
      },
      {
        capture: true,
      }
    );

    this.registerEditorExtension(
      EditorView.domEventHandlers({
        paste: (event) => {
          const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
          if (!markdownView || !this.pasteHandler) {
            return false;
          }

          return this.pasteHandler.handlePaste(event, markdownView.editor);
        },
      })
    );

    this.addSettingTab(new AutoPasteLinkSettingTab(this.app, this));
  }

  async loadSettings(): Promise<void> {
    const data = (await this.loadData()) as Partial<AutoPasteLinkSettings> | null;
    this.settings = normalizeSettings(data ?? {});
  }

  async saveSettings(): Promise<void> {
    this.settings = normalizeSettings(this.settings);
    await this.saveData(this.settings);
  }
}
