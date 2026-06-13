export interface PasteShortcutKeyEvent {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

export class PasteShortcutTracker {
  private skipNextPaste = false;
  private expiresAt = 0;
  private readonly shortcutWindowMs: number;

  constructor(shortcutWindowMs = 1000) {
    this.shortcutWindowMs = shortcutWindowMs;
  }

  handleKeydown(event: PasteShortcutKeyEvent, now = Date.now()): void {
    if (!isPasteShortcut(event)) {
      return;
    }

    this.skipNextPaste = event.shiftKey;
    this.expiresAt = now + this.shortcutWindowMs;
  }

  consumeShouldSkipPaste(now = Date.now()): boolean {
    if (now > this.expiresAt) {
      this.reset();
      return false;
    }

    const shouldSkip = this.skipNextPaste;
    this.reset();
    return shouldSkip;
  }

  private reset(): void {
    this.skipNextPaste = false;
    this.expiresAt = 0;
  }
}

function isPasteShortcut(event: PasteShortcutKeyEvent): boolean {
  return event.key.toLowerCase() === "v" && (event.ctrlKey || event.metaKey);
}
