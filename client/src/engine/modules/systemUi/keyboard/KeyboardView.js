/**
 * KeyboardView
 *
 * Owns all SceneNode construction, layout behaviors, and canvas rendering for
 * the on-screen keyboard.  Knows nothing about the engine event bus — it
 * receives callbacks for the two things that need to escape back to the module:
 *
 *   onKeyPress(keySpec)   — a key was tapped
 *   onBackdropDown()      — the dim area behind the panel was tapped
 */

import { SceneNode } from "../../../nodes/sceneNode.js";
import { KEYBOARD_LAYOUT, getKeyboardPanelBounds } from "./keyboardLayout.js";
import {
  KEYBOARD_PADDING,
  KEYBOARD_HEADER_HEIGHT,
  KEYBOARD_ROW_HEIGHT,
  KEYBOARD_ROW_GAP,
  KEYBOARD_KEY_GAP,
  KEYBOARD_PANEL_HEIGHT,
  KEYBOARD_MAX_WIDTH,
  KEYBOARD_MIN_WIDTH
} from "./keyboardConstants.js";

// -------------------------------------------------------
// Behavior objects (plain objects, no engine dependency)
// -------------------------------------------------------

const layerBehavior = {
  measure(node, constraints) {
    return {
      width:  Number.isFinite(constraints?.maxWidth)  ? constraints.maxWidth  : 0,
      height: Number.isFinite(constraints?.maxHeight) ? constraints.maxHeight : 0
    };
  },

  layout(node, bounds, ctx) {
    const [backdropNode, panelNode] = node.children;
    if (!backdropNode || !panelNode) return;

    backdropNode.applyLayout(
      { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
      ctx
    );

    panelNode.applyLayout(getKeyboardPanelBounds(bounds), ctx);
  }
};

const backdropBehavior = {
  measure() { return { width: 0, height: 0 }; },

  render(node, ctx) {
    const { x, y, width, height } = node.bounds;
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.24)";
    ctx.fillRect(x, y, width, height);
    ctx.restore();
  }
};

function createPanelBehavior(view) {
  return {
    measure(node, constraints) {
      const availableWidth = Math.max(0, (constraints?.maxWidth ?? 0) - 24);
      const minWidth = Math.min(KEYBOARD_MIN_WIDTH, availableWidth);
      const width = Math.max(minWidth, Math.min(KEYBOARD_MAX_WIDTH, availableWidth));
      const maxHeight = Math.max(0, (constraints?.maxHeight ?? 0) - 24);

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

          child.applyLayout({ x: keyX, y: rowY, width: keyWidth, height: KEYBOARD_ROW_HEIGHT }, ctx);

          keyX += keyWidth + KEYBOARD_KEY_GAP;
        }

        rowY += KEYBOARD_ROW_HEIGHT + KEYBOARD_ROW_GAP;
      }
    },

    render(node, ctx) {
      const { x, y, width, height } = node.bounds;
      const title = view.getTitle();

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
      ctx.fillText(title, x + KEYBOARD_PADDING, y + KEYBOARD_PADDING + KEYBOARD_HEADER_HEIGHT / 2);

      ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
      ctx.beginPath();
      ctx.moveTo(x + KEYBOARD_PADDING, y + KEYBOARD_PADDING + KEYBOARD_HEADER_HEIGHT);
      ctx.lineTo(x + width - KEYBOARD_PADDING, y + KEYBOARD_PADDING + KEYBOARD_HEADER_HEIGHT);
      ctx.stroke();
      ctx.restore();
    }
  };
}

const keyBehavior = {
  measure(node) {
    return {
      width:  node.style?.width  ?? 44,
      height: node.style?.height ?? KEYBOARD_ROW_HEIGHT
    };
  },

  render(node, ctx) {
    const { x, y, width, height } = node.bounds;
    const pressed = Boolean(node.state?.pressed);
    const hovered = Boolean(node.state?.hovered);
    const active  = Boolean(node.state?.active);
    const special = node.keySpec?.kind !== "char";

    let fill = special ? "#334155" : "#1E293B";
    if (hovered) fill = special ? "#475569" : "#334155";
    if (active)  fill = "#2563EB";
    if (pressed) fill = "#60A5FA";

    ctx.save();
    ctx.fillStyle   = fill;
    ctx.strokeStyle = pressed ? "rgba(255,255,255,0.42)" : "rgba(148, 163, 184, 0.32)";
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle    = "#F8FAFC";
    ctx.font         = width > 92 ? "600 13px sans-serif" : "600 15px sans-serif";
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.label ?? "", x + width / 2, y + height / 2);
    ctx.restore();
  }
};

// -------------------------------------------------------
// KeyboardView
// -------------------------------------------------------

export class KeyboardView {
  /**
   * @param {object} engine
   * @param {object} callbacks
   * @param {(keySpec: object) => void} callbacks.onKeyPress
   * @param {() => void} callbacks.onBackdropDown
   * @param {() => string} callbacks.getTitle
   */
  constructor(engine, { onKeyPress, onBackdropDown, getTitle }) {
    this.engine = engine;
    this._onKeyPress    = onKeyPress;
    this._onBackdropDown = onBackdropDown;

    // getTitle is supplied from outside to decouple the view from the engine
    this.getTitle = getTitle ?? (() => "Keyboard");

    this.keyNodes = [];
    this.keyRows  = [];
    this.panelNode    = null;
    this.backdropNode = null;

    this._root = new SceneNode({
      id:       "keyboard-layer",
      context:  engine.context,
      behavior: layerBehavior,
      visible:  false,
      style:    { x: 0, y: 0 }
    });

    this._build();
  }

  get root() {
    return this._root;
  }

  // -------------------------------------------------------
  // Build
  // -------------------------------------------------------

  _build() {
    this.backdropNode = new SceneNode({
      id:       "keyboard-backdrop",
      context:  this.engine.context,
      behavior: backdropBehavior,
      style:    {}
    });

    this.backdropNode.onEvent = (event) => {
      if (!event) return false;
      if (event.type === "pointerdown") {
        this._onBackdropDown?.();
        return true;
      }
      if (event.type === "pointerup") {
        return true;
      }
      return false;
    };

    this.panelNode = new SceneNode({
      id:       "keyboard-panel",
      context:  this.engine.context,
      behavior: createPanelBehavior(this),
      style:    {}
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

    this._root.add(this.backdropNode);
    this._root.add(this.panelNode);
  }

  _createKeyNode(keySpec) {
    const index = this.keyNodes.length + 1;
    const node = new SceneNode({
      id:       `keyboard-key-${index}`,
      context:  this.engine.context,
      behavior: keyBehavior,
      style:    {}
    });

    node.keySpec = { ...keySpec };
    node.label   = keySpec.label ?? keySpec.key ?? "";
    node.state   = { hovered: false, pressed: false, active: false };

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
          this._onKeyPress?.(node.keySpec);
        }
        return true;
      }

      return false;
    };

    return node;
  }

  // -------------------------------------------------------
  // Label / state refresh (called after shift changes)
  // -------------------------------------------------------

  /**
   * @param {(key: string) => string} resolveChar  - from KeyboardController
   * @param {boolean} isShifted
   */
  refreshLabels(resolveChar, isShifted) {
    for (const keyNode of this.keyNodes) {
      const keySpec = keyNode.keySpec ?? {};
      keyNode.label = keySpec.kind === "char"
        ? resolveChar(keySpec.key)
        : (keySpec.label ?? keySpec.key ?? "");

      keyNode.state.active = keySpec.kind === "shift" && isShifted;
      keyNode.requestRender?.();
    }

    this.panelNode?.requestRender?.();
  }

  // -------------------------------------------------------
  // Visibility
  // -------------------------------------------------------

  show() {
    this._root.visible = true;
    this._root.requestRender?.();
  }

  hide() {
    this._root.visible = false;
    this._root.requestRender?.();
  }

  // -------------------------------------------------------
  // Tear-down
  // -------------------------------------------------------

  destroy() {
    this.keyRows  = [];
    this.keyNodes = [];
    this.panelNode    = null;
    this.backdropNode = null;
  }
}
