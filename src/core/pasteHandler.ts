import type { Editor } from "obsidian";
import { buildMarkdownInsertion } from "./markdownInserter";
import { classifyUrlText } from "./urlClassifier";
import { isInYamlFrontmatter } from "./yamlRangeDetector";
import type { AutoPasteLinkSettings } from "../settings/pluginSettings";

export class PasteHandler {
  constructor(private readonly getSettings: () => AutoPasteLinkSettings) {}

  handlePaste(event: ClipboardEvent, editor: Editor): boolean {
    const settings = this.getSettings();
    if (!settings.enabled) {
      return false;
    }

    const pastedText = event.clipboardData?.getData("text/plain") ?? "";
    const classification = classifyUrlText(pastedText, settings);
    if (classification.kind === "unsupported") {
      return false;
    }

    const cursor = editor.getCursor("from");
    if (!settings.processYamlFrontmatter && isInYamlFrontmatter(editor.getValue(), cursor.line)) {
      return false;
    }

    event.preventDefault();
    const insertion = buildMarkdownInsertion({
      kind: classification.kind,
      url: classification.url,
      selection: editor.getSelection(),
      cursor,
      useSelectionAsLinkText: settings.useSelectionAsLinkText,
      addNewlineAfterImage: settings.addNewlineAfterImage,
    });

    editor.replaceSelection(insertion.text);
    editor.setCursor(insertion.cursor);
    return true;
  }
}
