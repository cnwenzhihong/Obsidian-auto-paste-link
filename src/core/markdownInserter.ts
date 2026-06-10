import type { UrlKind } from "./urlClassifier";

export interface EditorPositionLike {
  line: number;
  ch: number;
}

export interface MarkdownInsertionInput {
  kind: Exclude<UrlKind, "unsupported">;
  url: string;
  selection: string;
  cursor: EditorPositionLike;
  useSelectionAsLinkText: boolean;
  addNewlineAfterImage: boolean;
}

export interface MarkdownInsertion {
  text: string;
  cursor: EditorPositionLike;
}

export function buildMarkdownInsertion(input: MarkdownInsertionInput): MarkdownInsertion {
  if (input.kind === "image-link") {
    return buildImageInsertion(input);
  }

  return buildNormalLinkInsertion(input);
}

function buildNormalLinkInsertion(input: MarkdownInsertionInput): MarkdownInsertion {
  const title = input.useSelectionAsLinkText ? escapeLinkText(input.selection) : "";
  const text = `[${title}](${input.url})`;

  if (title.length > 0) {
    return {
      text,
      cursor: advancePosition(input.cursor, text),
    };
  }

  return {
    text,
    cursor: {
      line: input.cursor.line,
      ch: input.cursor.ch + 1,
    },
  };
}

function buildImageInsertion(input: MarkdownInsertionInput): MarkdownInsertion {
  const text = input.addNewlineAfterImage ? `![](${input.url})\n` : `![](${input.url})`;
  return {
    text,
    cursor: input.addNewlineAfterImage
      ? {
          line: input.cursor.line + 1,
          ch: 0,
        }
      : advancePosition(input.cursor, text),
  };
}

function escapeLinkText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\]/g, "\\]");
}

function advancePosition(position: EditorPositionLike, text: string): EditorPositionLike {
  const lines = text.split("\n");
  if (lines.length === 1) {
    return {
      line: position.line,
      ch: position.ch + text.length,
    };
  }

  return {
    line: position.line + lines.length - 1,
    ch: lines[lines.length - 1].length,
  };
}
