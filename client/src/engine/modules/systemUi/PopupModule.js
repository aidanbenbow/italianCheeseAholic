import { SceneNode } from "../../nodes/sceneNode.js";
import { createOverlayBehavior } from "./createOverlayBehavior.js";

const popupBehavior = {
  render(node, ctx) {
    const { x, y, width, height } = node.bounds;
    ctx.save();
    ctx.fillStyle = node.style.background ?? "#ffffff";
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = node.style.borderColor ?? "#d1d5db";
    ctx.strokeRect(x, y, width, height);
    ctx.fillStyle = node.style.color ?? "#111827";
    ctx.font = node.style.font ?? "16px sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText(node.content ?? "", x + 16, y + 16);
    ctx.restore();
  }
};

const backdropBehavior = {
  render(node, ctx) {
    const { x, y, width, height } = node.bounds;
    ctx.save();
    ctx.fillStyle = node.style.background ?? "rgba(0,0,0,0.25)";
    ctx.fillRect(x, y, width, height);
    ctx.restore();
  }
};

export class PopupModule {
  static create(engine) {
    return new PopupModule(engine);
  }

  constructor(engine) {
    this.engine = engine;
    this.defaultBackdrop = "rgba(0,0,0,0.25)";
    const overlayBehavior = createOverlayBehavior();
    overlayBehavior.render = backdropBehavior.render;

    this.root = new SceneNode({
      id: "popup-layer",
      context: engine.context,
      behavior: overlayBehavior,
      style: {
        x: 0,
        y: 0,
        background: this.defaultBackdrop
      }
    });
    this.root.hitTestable = false;
    this.root.visible = false;
    this.popups = new Map();
  }

  // Show a popup/modal
  show(id, content, options = {}) {
    if (this.popups.has(id)) {
      console.warn(`Popup "${id}" already exists`);
      return;
    }

    const popup = new SceneNode({
      id: `popup-${id}`,
      context: this.engine.context,
      behavior: popupBehavior,
      style: {
        x: options.style?.x ?? 120,
        y: options.style?.y ?? 90,
        width: options.style?.width ?? 360,
        height: options.style?.height ?? 180,
        ...options.style
      }
    });
    popup.content = String(content ?? "");
    this._attachPopupEntry(id, popup, {
      backdrop: options.backdrop !== false
    });
    
    // Only emit if someone is listening
    if (this.engine.eventListeners.get("popup:shown")?.size) {
      this.engine.emit("popup:shown", { id, content });
    }
  }

  showNode(id, node, options = {}) {
    if (this.popups.has(id)) {
      console.warn(`Popup "${id}" already exists`);
      return;
    }
    if (!node) return;

    node.context ??= this.engine.context;

    this._attachPopupEntry(id, node, {
      backdrop: options.backdrop === true
    });

    if (this.engine.eventListeners.get("popup:shown")?.size) {
      this.engine.emit("popup:shown", { id, customNode: true });
    }
  }

  // Hide a popup
  hide(id) {
    const entry = this.popups.get(id);
    if (entry) {
      this.root.remove(entry.node);
      this.popups.delete(id);
      this._syncLayerVisibility();
      
      // Only emit if someone is listening
      if (this.engine.eventListeners.get("popup:hidden")?.size) {
        this.engine.emit("popup:hidden", { id });
      }
    }
  }

  destroy() {
    for (const entry of this.popups.values()) {
      this.root.remove(entry.node);
    }
    this.popups.clear();
    this._syncLayerVisibility();
  }

  _attachPopupEntry(id, node, { backdrop = true } = {}) {
    this.popups.set(id, { node, backdrop: backdrop === true });
    this.root.add(node);
    this._syncLayerVisibility();
  }

  _syncLayerVisibility() {
    this.root.visible = this.popups.size > 0;
    const hasBackdropPopup = Array.from(this.popups.values()).some(entry => entry.backdrop === true);
    this.root.style.background = hasBackdropPopup
      ? this.defaultBackdrop
      : "transparent";
  }
}
