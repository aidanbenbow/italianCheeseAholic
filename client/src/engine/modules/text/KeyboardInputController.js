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

    this._engineKeydownOff = null;
    this._engineKeyupOff = null;

    this._pendingInputEcho = "";
    this._pendingInputAt = 0;
    this._lastVirtualKey = "";
    this._lastVirtualKeyAt = 0;
  }

  // -------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------

  mount() {
    this._input = (e) => this.onInput(e);
    this._compositionStart = () => this.onCompositionStart();
    this._compositionUpdate = (e) => this.onCompositionUpdate(e);
    this._compositionEnd = (e) => this.onCompositionEnd(e);

    this._engineKeydownOff = this.system.engine.on("keyboard:keydown", ({ event }) => {
      this.onKeyDown(event);
    });

    this._engineKeyupOff = this.system.engine.on("keyboard:keyup", ({ event }) => {
      this.onKeyUp(event);
    });

    window.addEventListener("input", this._input);
    window.addEventListener("compositionstart", this._compositionStart);
    window.addEventListener("compositionupdate", this._compositionUpdate);
    window.addEventListener("compositionend", this._compositionEnd);

    this.startBlink();
  }

  destroy() {
    window.removeEventListener("input", this._input);
    window.removeEventListener("compositionstart", this._compositionStart);
    window.removeEventListener("compositionupdate", this._compositionUpdate);
    window.removeEventListener("compositionend", this._compositionEnd);

    this._engineKeydownOff?.();
    this._engineKeydownOff = null;

    this._engineKeyupOff?.();
    this._engineKeyupOff = null;

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
    if (!this.enabled || !this.system.activeNode || !e) return;

    if (e.isVirtual === true) {
      this._lastVirtualKey = String(e.key ?? "");
      this._lastVirtualKeyAt = Date.now();
    } else if (this.shouldSuppressMirroredNativeKey(e)) {
      return;
    }

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
        if (this.system.activeNode?.multiline !== false) {
          this.system.insertText("\n");
        }
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

    if (this.shouldInsertFromKeyDown(e)) {
      e.preventDefault();
      this.registerInputEcho(e.key);
      this.system.insertText(e.key);
    }
  }

  onKeyUp(e) {
    if (!this.enabled || !this.system.activeNode || !e) return;
  }

  // -------------------------------------------------------
  // Text input (normal characters)
  // -------------------------------------------------------

  onInput(e) {
    if (!this.enabled || !this.system.activeNode) return;
    if (this.composing) return; // IME composition in progress

    const text = e.data;
    if (text) {
      if (this.isInputEcho(text)) return;
      this.system.insertText(text);
    }
  }

  shouldInsertFromKeyDown(e) {
    if (!e || this.composing || e.isComposing) return false;
    if (e.ctrlKey || e.metaKey || e.altKey) return false;
    if (e.key === "Dead") return false;
    return typeof e.key === "string" && e.key.length === 1;
  }

  registerInputEcho(key) {
    this._pendingInputEcho = String(key ?? "");
    this._pendingInputAt = Date.now();
  }

  isInputEcho(text) {
    const now = Date.now();
    return (
      String(text ?? "") === this._pendingInputEcho &&
      (now - this._pendingInputAt) <= 120
    );
  }

  shouldSuppressMirroredNativeKey(e) {
    if (!e || e.isVirtual === true) return false;

    const key = String(e.key ?? "");
    if (key.length !== 1) return false;

    return (
      key === this._lastVirtualKey &&
      (Date.now() - this._lastVirtualKeyAt) <= 120
    );
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