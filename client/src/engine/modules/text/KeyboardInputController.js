// /engine/modules/text/KeyboardInputController.js

export class KeyboardInputController {
  constructor(system) {
    this.system = system;

    this.enabled = false;

    // caret blink state
    this.blinkState = true;
    this._blinkInterval = null;

    // IME composition buffer
    this.composing = false;
    this.compositionText = "";
  }

  // -------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------

  mount() {
    this._keydown = (e) => this.onKeyDown(e);
    this._input = (e) => this.onInput(e);
    this._compositionStart = () => this.onCompositionStart();
    this._compositionUpdate = (e) => this.onCompositionUpdate(e);
    this._compositionEnd = (e) => this.onCompositionEnd(e);

    window.addEventListener("keydown", this._keydown);
    window.addEventListener("input", this._input);
    window.addEventListener("compositionstart", this._compositionStart);
    window.addEventListener("compositionupdate", this._compositionUpdate);
    window.addEventListener("compositionend", this._compositionEnd);

    this.startBlink();
  }

  destroy() {
    window.removeEventListener("keydown", this._keydown);
    window.removeEventListener("input", this._input);
    window.removeEventListener("compositionstart", this._compositionStart);
    window.removeEventListener("compositionupdate", this._compositionUpdate);
    window.removeEventListener("compositionend", this._compositionEnd);

    this.stopBlink();
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  // -------------------------------------------------------
  // Caret blinking
  // -------------------------------------------------------

  startBlink() {
    this.stopBlink();
    this._blinkInterval = setInterval(() => {
      this.blinkState = !this.blinkState;
      this.system.invalidate();
    }, 500);
  }

  stopBlink() {
    if (this._blinkInterval) {
      clearInterval(this._blinkInterval);
      this._blinkInterval = null;
    }
  }

  // -------------------------------------------------------
  // Keyboard events
  // -------------------------------------------------------

  onKeyDown(e) {
    if (!this.enabled || !this.system.activeNode) return;

    const caret = this.system.caret;
    const selection = this.system.selection;

    // Prevent browser scrolling
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
    }

    // Handle special keys
    switch (e.key) {
      case "ArrowLeft":
        this.moveCaret(-1, e.shiftKey);
        return;

      case "ArrowRight":
        this.moveCaret(+1, e.shiftKey);
        return;

      case "ArrowUp":
        this.moveCaretVertical(-1, e.shiftKey);
        return;

      case "ArrowDown":
        this.moveCaretVertical(+1, e.shiftKey);
        return;

      case "Backspace":
        e.preventDefault();
        this.system.backspace();
        return;

      case "Delete":
        e.preventDefault();
        this.deleteForward();
        return;

      case "Enter":
        e.preventDefault();
        this.system.insertText("\n");
        return;

      case "a":
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          this.selectAll();
          return;
        }
        break;

      case "c":
        if (e.metaKey || e.ctrlKey) {
          // clipboard controller handles this
          return;
        }
        break;

      case "x":
        if (e.metaKey || e.ctrlKey) {
          // clipboard controller handles this
          return;
        }
        break;

      case "v":
        if (e.metaKey || e.ctrlKey) {
          // clipboard controller handles this
          return;
        }
        break;
    }
  }

  // -------------------------------------------------------
  // Text input (normal characters)
  // -------------------------------------------------------

  onInput(e) {
    if (!this.enabled || !this.system.activeNode) return;
    if (this.composing) return; // IME composition in progress

    const text = e.data;
    if (text) {
      this.system.insertText(text);
    }
  }

  // -------------------------------------------------------
  // IME composition
  // -------------------------------------------------------

  onCompositionStart() {
    this.composing = true;
    this.compositionText = "";
  }

  onCompositionUpdate(e) {
    this.compositionText = e.data;
    // Optional: show composition underline in OverlayRenderer
    this.system.invalidate();
  }

  onCompositionEnd(e) {
    this.composing = false;
    const text = e.data;
    if (text) {
      this.system.insertText(text);
    }
    this.compositionText = "";
    this.system.invalidate();
  }

  // -------------------------------------------------------
  // Caret movement helpers
  // -------------------------------------------------------

  moveCaret(offset, shiftKey) {
    const caret = this.system.caret;
    const selection = this.system.selection;

    caret.move(offset);

    if (shiftKey) {
      selection.extendWithShift(caret.index);
    } else {
      selection.collapseTo(caret.index);
    }

    this.system.invalidate();
  }

  moveCaretVertical(direction, shiftKey) {
    // Vertical movement requires layout access
    const node = this.system.activeNode;
    const textLayout = node?.text?.getLayout?.();
    if (!node || !textLayout) return;

    const { lines } = textLayout;
    const caretIndex = this.system.caret.index;

    // Find current line
    let lineIndex = 0;
    let lineStart = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineEnd = lines[i].endIndex;
      if (caretIndex <= lineEnd) {
        lineIndex = i;
        break;
      }
      lineStart = lineEnd;
    }

    const targetLine = lineIndex + direction;
    if (targetLine < 0 || targetLine >= lines.length) return;

    const currentOffset = caretIndex - lineStart;
    const targetLineLength = lines[targetLine].text.length;

    const newIndex =
      lines[targetLine].startIndex +
      Math.min(currentOffset, targetLineLength);

    this.moveCaretTo(newIndex, shiftKey);
  }

  moveCaretTo(pos, shiftKey) {
    const caret = this.system.caret;
    const selection = this.system.selection;

    caret.setIndex(pos);

    if (shiftKey) {
      selection.extendWithShift(pos);
    } else {
      selection.collapseTo(pos);
    }

    this.system.invalidate();
  }

  // -------------------------------------------------------
  // Delete forward
  // -------------------------------------------------------

  deleteForward() {
    const caret = this.system.caret;
    const selection = this.system.selection;

    if (selection.hasRange()) {
      this.system.replaceSelection("");
      return;
    }

    const text = this.system.model.getText();
    if (caret.index >= text.length) return;

    const { newText, newCaret } = this.system.model.replaceRange(
      caret.index,
      caret.index + 1,
      ""
    );

    this.system.applyTextChange(newText);
    caret.setIndex(newCaret);
    selection.collapseTo(newCaret);
  }

  // -------------------------------------------------------
  // Select all
  // -------------------------------------------------------

  selectAll() {
    const text = this.system.model.getText();
    this.system.selection.start = 0;
    this.system.selection.end = text.length;
    this.system.caret.setIndex(text.length);
    this.system.invalidate();
  }
}