import { SceneNode } from "../../nodes/sceneNode.js";

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

const fullLayerBehavior = {
  measure(node, constraints) {
    return {
      width: constraints?.maxWidth ?? 0,
      height: constraints?.maxHeight ?? 0
    };
  }
};

export class PopupModule {
  static create(engine) {
    return new PopupModule(engine);
  }

  constructor(engine) {
    this.engine = engine;
    this.root = new SceneNode({
      id: "popup-layer",
      context: engine.context,
      behavior: {
        measure: fullLayerBehavior.measure,
        render: backdropBehavior.render
      },
      style: {
        x: 0,
        y: 0,
        background: "rgba(0,0,0,0.25)"
      }
    });
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

    this.popups.set(id, popup);
    this.root.add(popup);
    this.root.visible = true;
    
    // Only emit if someone is listening
    if (this.engine.eventListeners.get("popup:shown")?.size) {
      this.engine.emit("popup:shown", { id, content });
    }
  }

  // Hide a popup
  hide(id) {
    const popup = this.popups.get(id);
    if (popup) {
      this.root.remove(popup);
      this.popups.delete(id);
      this.root.visible = this.popups.size > 0;
      
      // Only emit if someone is listening
      if (this.engine.eventListeners.get("popup:hidden")?.size) {
        this.engine.emit("popup:hidden", { id });
      }
    }
  }

  destroy() {
    this.popups.clear();
  }
}
