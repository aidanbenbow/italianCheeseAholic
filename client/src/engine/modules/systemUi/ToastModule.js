import { SceneNode } from "../../nodes/sceneNode.js";

const toastBehavior = {
  render(node, ctx) {
    const { x, y, width, height } = node.bounds;
    ctx.save();
    ctx.fillStyle = node.style.background ?? "rgba(20, 20, 20, 0.9)";
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = node.style.color ?? "#ffffff";
    ctx.font = node.style.font ?? "14px sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(node.message ?? "", x + 12, y + height / 2);
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

export class ToastModule {
  static create(engine) {
    return new ToastModule(engine);
  }

  constructor(engine) {
    this.engine = engine;
    this.root = new SceneNode({
      id: "toast-layer",
      context: engine.context,
      behavior: fullLayerBehavior,
      style: {
        x: 0,
        y: 0
      }
    });

    this.toasts = new Map();
    this.toastIdCounter = 0;
  }

  // Show a toast notification
  show(message, options = {}) {
    const id = `toast-${++this.toastIdCounter}`;
    const duration = options.duration ?? 3000;

    const toast = new SceneNode({
      id,
      context: this.engine.context,
      behavior: toastBehavior,
      style: {
        x: options.style?.x ?? 20,
        y: options.style?.y ?? 20,
        width: options.style?.width ?? 280,
        height: options.style?.height ?? 44,
        ...options.style
      }
    });
    toast.message = message;

    this.toasts.set(id, toast);
    this.root.add(toast);
    
    // Only emit if someone is listening (avoid BaseEngine warning)
    if (this.engine.eventListeners.get("toast:shown")?.size) {
      this.engine.emit("toast:shown", { id, message, options });
    }

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => this.hide(id), duration);
    }

    return id;
  }

  hide(id) {
    const toast = this.toasts.get(id);
    if (toast) {
      this.root.remove(toast);
      this.toasts.delete(id);
      
      // Only emit if someone is listening
      if (this.engine.eventListeners.get("toast:hidden")?.size) {
        this.engine.emit("toast:hidden", { id });
      }
    }
  }

  destroy() {
    this.toasts.clear();
  }
}
