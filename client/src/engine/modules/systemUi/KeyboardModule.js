import { SceneNode } from "../../nodes/sceneNode.js";

const KEYBOARD_MARGIN = 12;
const KEYBOARD_MAX_WIDTH = 760;
const KEYBOARD_MIN_WIDTH = 320;
const KEYBOARD_PADDING = 12;
const KEYBOARD_HEADER_HEIGHT = 26;
const KEYBOARD_ROW_HEIGHT = 44;
const KEYBOARD_ROW_GAP = 8;
const KEYBOARD_KEY_GAP = 8;
const KEYBOARD_PANEL_HEIGHT =
  (KEYBOARD_PADDING * 2) +
  KEYBOARD_HEADER_HEIGHT +
  (KEYBOARD_ROW_HEIGHT * 5) +
  (KEYBOARD_ROW_GAP * 4);

const KEYBOARD_LAYOUT = [
  [
    { kind: "char", key: "1" },
    { kind: "char", key: "2" },
    { kind: "char", key: "3" },
    { kind: "char", key: "4" },
    { kind: "char", key: "5" },
    { kind: "char", key: "6" },
    { kind: "char", key: "7" },
    { kind: "char", key: "8" },
    { kind: "char", key: "9" },
    { kind: "char", key: "0" }
  ],
  [
    { kind: "char", key: "q" },
    { kind: "char", key: "w" },
    { kind: "char", key: "e" },
    { kind: "char", key: "r" },
    { kind: "char", key: "t" },
    { kind: "char", key: "y" },
    { kind: "char", key: "u" },
    { kind: "char", key: "i" },
    { kind: "char", key: "o" },
    { kind: "char", key: "p" }
  ],
  [
    { kind: "char", key: "a" },
    { kind: "char", key: "s" },
    { kind: "char", key: "d" },
    { kind: "char", key: "f" },
    { kind: "char", key: "g" },
    { kind: "char", key: "h" },
    { kind: "char", key: "j" },
    { kind: "char", key: "k" },
    { kind: "char", key: "l" }
  ],
  [
    { kind: "shift", label: "Shift", units: 1.5 },
    { kind: "char", key: "z" },
    { kind: "char", key: "x" },
    { kind: "char", key: "c" },
    { kind: "char", key: "v" },
    { kind: "char", key: "b" },
    { kind: "char", key: "n" },
    { kind: "char", key: "m" },
    { kind: "backspace", label: "Backspace", units: 1.75 }
  ],
  [
    { kind: "space", label: "Space", units: 5 },
    { kind: "enter", label: "Enter", units: 2 },
    { kind: "done", label: "Done", units: 2 }
  ]
];

function createKeyboardLayerBehavior(module) {
  return {
    measure(node, constraints) {
      const maxWidth = Number.isFinite(constraints?.maxWidth)
        ? constraints.maxWidth
        : 0;
      const maxHeight = Number.isFinite(constraints?.maxHeight)
        ? constraints.maxHeight
        : 0;

      return {
        width: maxWidth,
        height: maxHeight
      };
    },

    layout(node, bounds, ctx) {
      const [backdropNode, panelNode] = node.children;
      if (!backdropNode || !panelNode) {
        return;
      }

      backdropNode.applyLayout(
        {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height
        },
        ctx
      );

      const panelBounds = getKeyboardPanelBounds(bounds);
      panelNode.applyLayout(panelBounds, ctx);
    }
  };
}

function getKeyboardPanelBounds(bounds) {
  const availableWidth = Math.max(0, (bounds?.width ?? 0) - (KEYBOARD_MARGIN * 2));
  const minWidth = Math.min(KEYBOARD_MIN_WIDTH, availableWidth);
  const width = Math.max(minWidth, Math.min(KEYBOARD_MAX_WIDTH, availableWidth));
  const maxHeight = Math.max(0, (bounds?.height ?? 0) - (KEYBOARD_MARGIN * 2));
  const height = Math.min(KEYBOARD_PANEL_HEIGHT, maxHeight);
  const x = (bounds?.x ?? 0) + Math.max(0, ((bounds?.width ?? 0) - width) / 2);
  const y = (bounds?.y ?? 0) + Math.max(KEYBOARD_MARGIN, (bounds?.height ?? 0) - height - KEYBOARD_MARGIN);

  return {
    x,
    y,
    width,
    height
  };
}

const keyboardBackdropBehavior = {
  measure() {
    return { width: 0, height: 0 };
  },

  render(node, ctx) {
    const { x, y, width, height } = node.bounds;
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.24)";
    ctx.fillRect(x, y, width, height);
    ctx.restore();
  }
};

function createKeyboardPanelBehavior(module) {
  return {
    measure(node, constraints) {
      const availableWidth = Math.max(0, (constraints?.maxWidth ?? 0) - (KEYBOARD_MARGIN * 2));
      const minWidth = Math.min(KEYBOARD_MIN_WIDTH, availableWidth);
      const width = Math.max(minWidth, Math.min(KEYBOARD_MAX_WIDTH, availableWidth));
      const maxHeight = Math.max(0, (constraints?.maxHeight ?? 0) - (KEYBOARD_MARGIN * 2));

      return {
        width,
        height: Math.min(KEYBOARD_PANEL_HEIGHT, maxHeight)
      };
    },

    layout(node, bounds, ctx) {
      const rows = node.keyRows ?? [];
      const contentX = bounds.x + KEYBOARD_PADDING;
      const contentY = bounds.y + KEYBOARD_PADDING + KEYBOARD_HEADER_HEIGHT;
      const contentWidth = Math.max(0, bounds.width - (KEYBOARD_PADDING * 2));

      let rowY = contentY;
      for (const row of rows) {
        const totalUnits = row.reduce((sum, child) => sum + (child.keySpec?.units ?? 1), 0);
        const gapWidth = KEYBOARD_KEY_GAP * Math.max(0, row.length - 1);
        const unitWidth = totalUnits > 0
          ? Math.max(20, (contentWidth - gapWidth) / totalUnits)
          : 0;

        let keyX = contentX;
        for (const child of row) {
          const units = child.keySpec?.units ?? 1;
          const keyWidth = Math.max(28, unitWidth * units);

          child.applyLayout(
            {
              x: keyX,
              y: rowY,
              width: keyWidth,
              height: KEYBOARD_ROW_HEIGHT
            },
            ctx
          );

          keyX += keyWidth + KEYBOARD_KEY_GAP;
        }

        rowY += KEYBOARD_ROW_HEIGHT + KEYBOARD_ROW_GAP;
      }
    },

    render(node, ctx) {
      const { x, y, width, height } = node.bounds;
      const activeInput = module.engine.context.textEditor?.activeNode ?? null;
      const title = activeInput?.placeholder
        ? `Keyboard · ${String(activeInput.placeholder)}`
        : "Keyboard";

      ctx.save();
      ctx.fillStyle = "rgba(15, 23, 42, 0.96)";
      ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#E2E8F0";
      ctx.font = "600 13px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(title, x + KEYBOARD_PADDING, y + (KEYBOARD_PADDING + (KEYBOARD_HEADER_HEIGHT / 2)));

      ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
      ctx.beginPath();
      ctx.moveTo(x + KEYBOARD_PADDING, y + KEYBOARD_PADDING + KEYBOARD_HEADER_HEIGHT);
      ctx.lineTo(x + width - KEYBOARD_PADDING, y + KEYBOARD_PADDING + KEYBOARD_HEADER_HEIGHT);
      ctx.stroke();
      ctx.restore();
    }
  };
}

const keyboardKeyBehavior = {
  measure(node) {
    return {
      width: node.style?.width ?? 44,
      height: node.style?.height ?? KEYBOARD_ROW_HEIGHT
    };
  },

  render(node, ctx) {
    const { x, y, width, height } = node.bounds;
    const pressed = Boolean(node.state?.pressed);
    const hovered = Boolean(node.state?.hovered);
    const active = Boolean(node.state?.active);
    const special = node.keySpec?.kind !== "char";

    let fill = special ? "#334155" : "#1E293B";
    if (hovered) {
      fill = special ? "#475569" : "#334155";
    }
    if (active) {
      fill = "#2563EB";
    }
    if (pressed) {
      fill = "#60A5FA";
    }

    ctx.save();
    ctx.fillStyle = fill;
    ctx.strokeStyle = pressed
      ? "rgba(255,255,255,0.42)"
      : "rgba(148, 163, 184, 0.32)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#F8FAFC";
    ctx.font = width > 92 ? "600 13px sans-serif" : "600 15px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.label ?? "", x + (width / 2), y + (height / 2));
    ctx.restore();
  }
};

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
    preventDefault() {
      this.defaultPrevented = true;
    },
    stopPropagation() {
      this.propagationStopped = true;
    }
  };
}

export class KeyboardModule {
  static create(engine) {
    return new KeyboardModule(engine);
  }

  constructor(engine) {
    this.engine = engine;
    this._keydownHandler = null;
    this._keyupHandler = null;
    this.isShifted = false;
    this.panelNode = null;
    this.backdropNode = null;
    this.keyRows = [];
    this.keyNodes = [];
    this.shiftKeyNode = null;
    this.root = new SceneNode({
      id: "keyboard-layer",
      context: engine.context,
      behavior: createKeyboardLayerBehavior(this),
      visible: false,
      style: {
        x: 0,
        y: 0
      }
    });

    this.isVisible = false;
    this._buildVisualKeyboard();
    this._bindKeyboardEvents();
  }

  _buildVisualKeyboard() {
    this.backdropNode = new SceneNode({
      id: "keyboard-backdrop",
      context: this.engine.context,
      behavior: keyboardBackdropBehavior,
      style: {}
    });

    this.backdropNode.onEvent = (event) => {
      if (!event) return false;
      if (event.type === "pointerdown") {
        this.engine.context.focusManager?.clearFocus?.({ source: "KeyboardModule.backdrop" });
        return true;
      }

      if (event.type === "pointerup") {
        return true;
      }

      return false;
    };

    this.panelNode = new SceneNode({
      id: "keyboard-panel",
      context: this.engine.context,
      behavior: createKeyboardPanelBehavior(this),
      style: {}
    });
    this.panelNode.keyRows = [];

    for (const rowSpec of KEYBOARD_LAYOUT) {
      const rowNodes = rowSpec.map((keySpec) => this._createKeyNode(keySpec));
      this.panelNode.keyRows.push(rowNodes);
      this.keyRows.push(rowNodes);

      for (const keyNode of rowNodes) {
        this.panelNode.add(keyNode);
        this.keyNodes.push(keyNode);
      }
    }

    this.root.add(this.backdropNode);
    this.root.add(this.panelNode);
    this._refreshKeyLabels();
  }

  _createKeyNode(keySpec) {
    const node = new SceneNode({
      id: `keyboard-key-${this.keyNodes.length + 1}`,
      context: this.engine.context,
      behavior: keyboardKeyBehavior,
      style: {}
    });

    node.keySpec = { ...keySpec };
    node.label = keySpec.label ?? keySpec.key ?? "";
    node.state = {
      hovered: false,
      pressed: false,
      active: false
    };

    if (keySpec.kind === "shift") {
      this.shiftKeyNode = node;
    }

    node.onEvent = (event) => {
      if (!event) return false;

      if (event.type === "pointerenter") {
        node.state.hovered = true;
        node.requestRender?.();
        return true;
      }

      if (event.type === "pointerleave") {
        node.state.hovered = false;
        node.state.pressed = false;
        node.requestRender?.();
        return true;
      }

      if (event.type === "pointerdown") {
        node.state.pressed = true;
        node.requestRender?.();
        return true;
      }

      if (event.type === "pointerup") {
        const wasPressed = node.state.pressed;
        node.state.pressed = false;
        node.requestRender?.();
        if (wasPressed) {
          this._handleKeyPress(node.keySpec);
        }
        return true;
      }

      return false;
    };

    return node;
  }

  _bindKeyboardEvents() {
    this._keydownHandler = (e) => {
      this.engine.emit("keyboard:keydown", { key: e.key, code: e.code, event: e });
    };

    this._keyupHandler = (e) => {
      this.engine.emit("keyboard:keyup", { key: e.key, code: e.code, event: e });
    };

    window.addEventListener("keydown", this._keydownHandler);
    window.addEventListener("keyup", this._keyupHandler);
  }

  _handleKeyPress(keySpec) {
    switch (keySpec.kind) {
      case "shift":
        this.isShifted = !this.isShifted;
        this._refreshKeyLabels();
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
          this.engine.context.focusManager?.clearFocus?.({ source: "KeyboardModule.enter" });
          return;
        }

        this._emitVirtualKey("Enter", { code: "Enter" });
        return;
      }

      case "done":
        this.engine.context.focusManager?.clearFocus?.({ source: "KeyboardModule.done" });
        return;

      case "char": {
        const key = this._resolveCharacterKey(keySpec.key);
        this._emitVirtualKey(key, {
          code: `Key${String(keySpec.key ?? "").toUpperCase()}`,
          shiftKey: this.isShifted
        });

        if (this.isShifted && /^[a-z]$/i.test(String(keySpec.key ?? ""))) {
          this.isShifted = false;
          this._refreshKeyLabels();
        }
        return;
      }
    }
  }

  _resolveCharacterKey(key) {
    const input = String(key ?? "");
    if (this.isShifted && /^[a-z]$/.test(input)) {
      return input.toUpperCase();
    }

    return input;
  }

  _refreshKeyLabels() {
    for (const keyNode of this.keyNodes) {
      const keySpec = keyNode.keySpec ?? {};
      if (keySpec.kind === "char") {
        keyNode.label = this._resolveCharacterKey(keySpec.key);
      } else {
        keyNode.label = keySpec.label ?? keySpec.key ?? "";
      }

      keyNode.state.active = keySpec.kind === "shift" && this.isShifted;
      keyNode.requestRender?.();
    }

    this.panelNode?.requestRender?.();
  }

  _emitVirtualKey(key, options = {}) {
    const event = createVirtualKeyboardEvent(key, options);
    this.engine.emit("keyboard:keydown", { key, code: event.code, event });
    this.engine.emit("keyboard:keyup", { key, code: event.code, event });
  }

  show() {
    if (this.isVisible) {
      return;
    }

    this.isShifted = false;
    this._refreshKeyLabels();
    this.isVisible = true;
    this.root.visible = true;
    this.root.requestRender?.();
    this.engine.emit("keyboard:shown");
  }

  hide() {
    if (!this.isVisible) {
      return;
    }

    this.isShifted = false;
    this._refreshKeyLabels();
    this.isVisible = false;
    this.root.visible = false;
    this.root.requestRender?.();
    this.engine.emit("keyboard:hidden");
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

    this.keyRows = [];
    this.keyNodes = [];
    this.shiftKeyNode = null;
  }
}
