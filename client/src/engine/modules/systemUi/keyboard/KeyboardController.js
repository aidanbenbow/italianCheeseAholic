/**
 * KeyboardController
 *
 * Owns:
 *  - Physical keyboard event bridge (window keydown/keyup → engine events)
 *  - Virtual key press logic (what to do when a key is tapped)
 *  - Shift state
 *
 * Knows nothing about SceneNodes or rendering — those live in KeyboardView.
 */

function createVirtualKeyboardEvent(key, options = {}) {
  return {
    key,
    code: options.code ?? key,
    shiftKey: Boolean(options.shiftKey),
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    isComposing: false,
    defaultPrevented: false,
    propagationStopped: false,
    preventDefault() { this.defaultPrevented = true; },
    stopPropagation() { this.propagationStopped = true; }
  };
}

export class KeyboardController {
  /**
   * @param {object} engine
   * @param {{ onShiftChanged: (isShifted: boolean) => void }} callbacks
   */
  constructor(engine, { onShiftChanged } = {}) {
    this.engine = engine;
    this.isShifted = false;

    this._onShiftChanged = onShiftChanged ?? null;

    this._keydownHandler = null;
    this._keyupHandler = null;
  }

  // -------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------

  /** Bind physical keyboard events so the hardware keyboard still works. */
  mount() {
    this._keydownHandler = (e) => {
      this.engine.emit("keyboard:keydown", { key: e.key, code: e.code, event: e });
    };

    this._keyupHandler = (e) => {
      this.engine.emit("keyboard:keyup", { key: e.key, code: e.code, event: e });
    };

    window.addEventListener("keydown", this._keydownHandler);
    window.addEventListener("keyup", this._keyupHandler);
  }

  destroy() {
    if (this._keydownHandler) {
      window.removeEventListener("keydown", this._keydownHandler);
      this._keydownHandler = null;
    }

    if (this._keyupHandler) {
      window.removeEventListener("keyup", this._keyupHandler);
      this._keyupHandler = null;
    }
  }

  // -------------------------------------------------------
  // Key press handling (called by KeyboardView on tap)
  // -------------------------------------------------------

  onKeyPress(keySpec) {
    switch (keySpec.kind) {

      case "shift":
        this.isShifted = !this.isShifted;
        this._onShiftChanged?.(this.isShifted);
        return;

      case "backspace":
        this._emitVirtualKey("Backspace", { code: "Backspace" });
        return;

      case "space":
        this._emitVirtualKey(" ", { code: "Space" });
        return;

      case "enter": {
        const activeNode = this.engine.context.textEditor?.activeNode ?? null;
        if (activeNode?.multiline === false) {
          this._clearFocus("KeyboardController.enter");
          return;
        }
        this._emitVirtualKey("Enter", { code: "Enter" });
        return;
      }

      case "done":
        this._clearFocus("KeyboardController.done");
        return;

      case "char": {
        const key = this.resolveCharKey(keySpec.key);
        this._emitVirtualKey(key, {
          code: `Key${String(keySpec.key ?? "").toUpperCase()}`,
          shiftKey: this.isShifted
        });

        // Auto-unshift after a single capital letter
        if (this.isShifted && /^[a-z]$/i.test(String(keySpec.key ?? ""))) {
          this.isShifted = false;
          this._onShiftChanged?.(this.isShifted);
        }
        return;
      }
    }
  }

  // -------------------------------------------------------
  // Helpers
  // -------------------------------------------------------

  /**
   * Return the character that should be emitted for a given base key,
   * taking current shift state into account.
   */
  resolveCharKey(key) {
    const input = String(key ?? "");
    if (this.isShifted && /^[a-z]$/.test(input)) {
      return input.toUpperCase();
    }
    return input;
  }

  _emitVirtualKey(key, options = {}) {
    const event = createVirtualKeyboardEvent(key, options);
    this.engine.emit("keyboard:keydown", { key, code: event.code, event });
    this.engine.emit("keyboard:keyup",   { key, code: event.code, event });
  }

  _clearFocus(source) {
    this.engine.context.focusManager?.clearFocus?.({ source });
  }
}
