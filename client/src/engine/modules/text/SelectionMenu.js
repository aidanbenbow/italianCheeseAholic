// /engine/modules/text/SelectionMenu.js

import { SceneNode } from "../../nodes/sceneNode.js";

const TOOLBAR_BUTTON_WIDTH = 64;
const TOOLBAR_BUTTON_HEIGHT = 28;
const TOOLBAR_GAP = 6;
const TOOLBAR_PADDING = 6;

const toolbarBehavior = {
  measure(node) {
    return {
      width: node.style?.width ?? 0,
      height: node.style?.height ?? 0
    };
  },

  layout(node, bounds, ctx) {
    const children = node.children ?? [];
    for (const child of children) {
      const measured = child.measure({ maxWidth: bounds.width, maxHeight: bounds.height }, ctx);
      child.applyLayout({
        x: bounds.x + (child.style?.x ?? 0),
        y: bounds.y + (child.style?.y ?? 0),
        width: child.style?.width ?? measured?.width ?? TOOLBAR_BUTTON_WIDTH,
        height: child.style?.height ?? measured?.height ?? TOOLBAR_BUTTON_HEIGHT
      }, ctx);
    }
  },

  render(node, ctx) {
    const { x, y, width, height } = node.bounds;
    ctx.save();
    ctx.fillStyle = node.style?.background ?? "rgba(255,255,255,0.95)";
    ctx.strokeStyle = node.style?.borderColor ?? "#d0d0d0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, node.style?.radius ?? 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
};

const toolbarButtonBehavior = {
  measure(node) {
    return {
      width: node.style?.width ?? TOOLBAR_BUTTON_WIDTH,
      height: node.style?.height ?? TOOLBAR_BUTTON_HEIGHT
    };
  },

  layout(node, bounds) {
    node.bounds = bounds;
  },

  render(node, ctx) {
    const { x, y, width, height } = node.bounds;
    const hovered = Boolean(node.state?.hovered);
    const pressed = Boolean(node.state?.pressed);

    ctx.save();
    ctx.fillStyle = pressed
      ? "#e5e7eb"
      : (hovered ? "#f3f4f6" : "#f9fafb");
    ctx.strokeStyle = "#c7c7c7";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#111827";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.label ?? "", x + width / 2, y + height / 2);
    ctx.restore();
  }
};

function createToolbarButtonNode({ id, label, index, context, onPress }) {
  const buttonNode = new SceneNode({
    id,
    context,
    behavior: toolbarButtonBehavior,
    style: {
      x: TOOLBAR_PADDING + (index * (TOOLBAR_BUTTON_WIDTH + TOOLBAR_GAP)),
      y: TOOLBAR_PADDING,
      width: TOOLBAR_BUTTON_WIDTH,
      height: TOOLBAR_BUTTON_HEIGHT
    }
  });

  buttonNode.label = label;
  buttonNode.state = { hovered: false, pressed: false };
  buttonNode.onPress = onPress;

  buttonNode.onEvent = function onToolbarButtonEvent(event) {
    if (!event) return false;

    if (event.type === "pointerenter") {
      this.state.hovered = true;
      this.requestRender();
      return false;
    }

    if (event.type === "pointerleave") {
      this.state.hovered = false;
      this.state.pressed = false;
      this.requestRender();
      return false;
    }

    if (event.type === "pointerdown") {
      this.state.pressed = true;
      this.requestRender();
      return false;
    }

    if (event.type === "pointerup") {
      const wasPressed = this.state.pressed;
      this.state.pressed = false;
      this.requestRender();
      if (wasPressed && typeof this.onPress === "function") {
        this.onPress();
      }
      return false;
    }

    return false;
  };

  return buttonNode;
}

export class SelectionMenu {
  constructor(system) {
    this.system = system;
    this.popupId = "text-selection-toolbar";
    this.toolbarNode = null;
    this.currentButtonsKey = "";
    this.mode = "hidden";
    this.visible = false;
    this.inputToolbarPinned = false;
  }

  mount() {
    this._rebuildToolbarIfNeeded(this._getInputToolbarActions());
  }

  destroy() {
    this.hide();
    this.toolbarNode = null;
    this.currentButtonsKey = "";
  }

  showForInputNode(node) {
    if (!node?.layout) return;

    if (this.mode === "input-toolbar" && this.visible && this.inputToolbarPinned) {
      return;
    }

    const anchorX = node.layout.x + (node.layout.width / 2);
    const anchorY = Math.max(8, node.layout.y - 40);

    this.mode = "input-toolbar";
    this._rebuildToolbarIfNeeded(this._getInputToolbarActions());
    this.showAt(anchorX, anchorY);
    this.inputToolbarPinned = true;
  }

  showForSelection() {
    const caretPos = this.system.caret.getScenePosition();
    if (!caretPos) return;

    this.mode = "selection";
    this.inputToolbarPinned = false;
    this._rebuildToolbarIfNeeded(this._getSelectionToolbarActions());
    this.showAt(caretPos.x, caretPos.y - 40);
  }

  showAt(sceneX, sceneY) {
    if (!this.toolbarNode) {
      this._rebuildToolbarIfNeeded(this._getInputToolbarActions());
      if (!this.toolbarNode) return;
    }

    const canvas = this.system.engine.context.canvasManager?.getCanvas?.("main");
    const logicalWidth = canvas?._logicalWidth ?? canvas?.width ?? 0;
    const logicalHeight = canvas?._logicalHeight ?? canvas?.height ?? 0;
    const width = this.toolbarNode.style.width ?? 0;
    const height = this.toolbarNode.style.height ?? 0;

    const xMax = Math.max(0, logicalWidth - width);
    const yMax = Math.max(0, logicalHeight - height);

    const clampedX = Math.min(Math.max(0, (sceneX ?? 0) - width / 2), xMax);
    const clampedY = Math.min(Math.max(0, sceneY ?? 0), yMax);

    this.toolbarNode.style.x = clampedX;
    this.toolbarNode.style.y = clampedY;
    this.toolbarNode.requestLayout();

    this.system.engine.context.systemUI?.popupLayer?.showNode(this.popupId, this.toolbarNode, {
      backdrop: false
    });
    this.visible = true;
  }

  hide() {
    this.mode = "hidden";
    this.visible = false;
    this.inputToolbarPinned = false;
    this.system.engine.context.systemUI?.popupLayer?.hide(this.popupId);
  }

  _getSelectionToolbarActions() {
    return [
      { label: "Cut", onPress: () => this.system.clipboard.cut() },
      { label: "Copy", onPress: () => this.system.clipboard.copy() },
      { label: "Paste", onPress: () => this.system.clipboard.paste() },
      {
        label: "Bold",
        onPress: () => {
          const selected = this.system.selection.getRangeText();
          this.system.replaceSelection("**" + selected + "**");
          this.hide();
        }
      }
    ];
  }

  _getInputToolbarActions() {
    return [
      { label: "Cut", onPress: () => this.system.clipboard.cut() },
      { label: "Copy", onPress: () => this.system.clipboard.copy() },
      { label: "Paste", onPress: () => this.system.clipboard.paste() },
      {
        label: "Bold",
        onPress: () => {
          if (!this.system.selection.hasRange()) return;
          this.system.replaceSelection("**" + this.system.selection.getRangeText() + "**");
        }
      }
    ];
  }

  _rebuildToolbarIfNeeded(actions) {
    const key = actions.map(action => action.label).join("|");
    if (this.toolbarNode && this.currentButtonsKey === key) return;

    this.toolbarNode = this._createToolbarNode(actions);
    this.currentButtonsKey = key;
  }

  _createToolbarNode(actions) {
    const context = this.system.engine.context;
    const width = (actions.length * TOOLBAR_BUTTON_WIDTH) + ((actions.length - 1) * TOOLBAR_GAP) + (TOOLBAR_PADDING * 2);
    const height = TOOLBAR_BUTTON_HEIGHT + (TOOLBAR_PADDING * 2);

    const toolbarNode = new SceneNode({
      id: "text-toolbar-node",
      context,
      behavior: toolbarBehavior,
      style: {
        x: 0,
        y: 0,
        width,
        height,
        background: "rgba(255,255,255,0.95)",
        borderColor: "#d0d0d0",
        radius: 8
      }
    });

    actions.forEach((action, index) => {
      const buttonNode = createToolbarButtonNode({
        id: `text-toolbar-btn-${index}-${action.label.toLowerCase()}`,
        label: action.label,
        index,
        context,
        onPress: action.onPress
      });

      toolbarNode.add(buttonNode);
    });

    return toolbarNode;
  }
}