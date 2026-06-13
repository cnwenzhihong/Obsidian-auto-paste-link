import { requestUrl, type Editor } from "obsidian";
import {
  buildMarkdownInsertion,
  escapeMarkdownLinkText,
  type EditorPositionLike,
  type MarkdownInsertion,
} from "./markdownInserter";
import { classifyUrlText } from "./urlClassifier";
import { isInYamlFrontmatter } from "./yamlRangeDetector";
import type { AutoPasteLinkSettings } from "../settings/pluginSettings";
import {
  getSupportedTitleProvider,
  resolveSupportedSiteTitle,
  type TitleRequestInput,
  type TitleRequestResponse,
} from "./titleResolver";

export class PasteHandler {
  constructor(
    private readonly getSettings: () => AutoPasteLinkSettings,
    private readonly shouldSkipPaste = () => false
  ) {}

  handlePaste(event: ClipboardEvent, editor: Editor): boolean {
    if (this.shouldSkipPaste()) {
      return false;
    }

    const settings = this.getSettings();
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
    const selection = editor.getSelection();
    const insertion = buildMarkdownInsertion({
      kind: classification.kind,
      url: classification.url,
      selection,
      cursor,
      useSelectionAsLinkText: settings.useSelectionAsLinkText,
      addNewlineAfterImage: settings.addNewlineAfterImage,
    });

    editor.replaceSelection(insertion.text);
    editor.setCursor(insertion.cursor);
    this.completeSupportedSiteTitle(editor, classification.url, selection, insertion, settings);
    return true;
  }

  private completeSupportedSiteTitle(
    editor: Editor,
    url: string,
    selection: string,
    insertion: MarkdownInsertion,
    settings: AutoPasteLinkSettings
  ): void {
    if (!settings.fetchSupportedSiteTitle || selection.length > 0 || !insertion.titleRange) {
      return;
    }

    if (!getSupportedTitleProvider(url)) {
      return;
    }

    void resolveSupportedSiteTitle(url, {
      request: requestTitle,
      timeoutMs: settings.titleFetchTimeoutMs,
    }).then((title) => {
      if (!title || !isEmptyMarkdownLinkTitle(editor, insertion.titleRange!.from)) {
        return;
      }

      editor.replaceRange(escapeMarkdownLinkText(title), insertion.titleRange!.from, insertion.titleRange!.to);
    });
  }
}

async function requestTitle(request: TitleRequestInput): Promise<TitleRequestResponse> {
  const response = await requestUrl({
    url: request.url,
    method: "GET",
    headers: request.headers,
    throw: false,
  });

  return {
    status: response.status,
    headers: response.headers,
    text: response.text,
  };
}

function isEmptyMarkdownLinkTitle(editor: Editor, position: EditorPositionLike): boolean {
  if (position.line > editor.lastLine()) {
    return false;
  }

  const line = editor.getLine(position.line);
  return line.charAt(position.ch - 1) === "[" && line.charAt(position.ch) === "]";
}
