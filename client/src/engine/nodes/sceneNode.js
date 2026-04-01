import { TinyEmitter } from "../core/TinyEmitter.js";


export const DIRTY_LAYOUT = 1 << 0;
export const DIRTY_RENDER = 1 << 1;
export const DIRTY_UPDATE = 1 << 2;

export class SceneNode {
  constructor({
    id,
    context,
    behavior = null,
    style = {},
    visible = true,
    children = []
  }) {
    this.id = id;
    this.context = context;
    this.behavior = behavior;
    this.visible = visible;

    this.parent = null;
    this.children = [];

    // Always initialized
    this.bounds = { x: 0, y: 0, width: 0, height: 0 };
    this.layout = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      contentX: 0,
      contentY: 0,
      contentWidth: 0,
      contentHeight: 0,
      padding: { left: 0, right: 0, top: 0, bottom: 0 }
    };
    this.measured = { width: 0, height: 0 };

    this.hitTestable = true;

    // Optional dirty metadata (your pipeline can use it)
    this.meta = {
      dirty: false,
      dirtyChildren: 0,
      lastFrame: 0
    };

    this.emitter = new TinyEmitter();
    this.disposeCallbacks = new Set();
    this.flags = DIRTY_LAYOUT | DIRTY_RENDER | DIRTY_UPDATE;
    this.lastMeasureConstraints = null;
    this.lastLayoutBounds = null;
    this.lastRenderedBounds = null;
    this.style = this.createStyleProxy(style);

    children.forEach(c => this.add(c));
  }

  // --- Tree management ---
  add(child) {
    if (child.parent) {
      child.parent.remove(child);
    }

    child.parent = this;
    child.context ??= this.context;

    this.children.push(child);
    this.requestLayout();
    child.requestLayout();
  }

  remove(child) {
    const i = this.children.indexOf(child);
    if (i >= 0) {
      this.children.splice(i, 1);
      child.disposeSubtree();
      child.parent = null;
      this.requestLayout();
    }
  }

  replaceChild(oldChild, newChild) {
    const index = this.children.indexOf(oldChild);
    if (index < 0) return;

    if (newChild.parent) {
      newChild.parent.remove(newChild);
    }

    oldChild.disposeSubtree();
    oldChild.parent = null;

    newChild.parent = this;
    newChild.context ??= this.context;
    this.children[index] = newChild;
    this.requestLayout();
    newChild.requestLayout();
  }

  onDispose(callback) {
    if (typeof callback !== "function") {
      return () => {};
    }

    this.disposeCallbacks.add(callback);
    return () => {
      this.disposeCallbacks.delete(callback);
    };
  }

  dispose() {
    for (const callback of this.disposeCallbacks) {
      try {
        callback();
      } catch (error) {
        console.error("SceneNode dispose callback failed", error);
      }
    }

    this.disposeCallbacks.clear();
    this.emitter.emit("dispose", { node: this });
  }

  disposeSubtree() {
    for (const child of this.children) {
      child.disposeSubtree();
    }
    this.dispose();
  }

  findById(id) {
  if (this.id === id) return this;

  for (const child of this.children) {
    const found = child.findById?.(id);
    if (found) return found;
  }

  return null;
}

  // --- Layout ---
  measure(constraints, ctx) {
    this.lastMeasureConstraints = constraints;
    this.measured =
      this.behavior?.measure?.(this, constraints, ctx) ??
      { width: this.style.width ?? 100, height: this.style.height ?? 30 };

    return this.measured;
  }

  applyLayout(bounds, ctx) {
    this.lastLayoutBounds = bounds;
    this.bounds = bounds;
    this.layout = buildNodeLayout(bounds, this.style);
    this.behavior?.layout?.(this, bounds, ctx);
    this.clearDirty(DIRTY_LAYOUT);
  }

  // --- Update ---
  update(dt, ctx) {
    this.behavior?.update?.(this, dt, ctx);
    for (const c of this.children) c.update(dt, ctx);
    this.clearDirty(DIRTY_UPDATE);
  }

  // --- Render ---
  render(ctx) {
    if (!this.visible) return;

    ctx.save();
    this.behavior?.render?.(this, ctx);

    for (const c of this.children) {
      c.render(ctx);
    }

    // postRender runs after all children — used for overlays (e.g. scrollbars)
    // that must appear on top of child content.
    this.behavior?.postRender?.(this, ctx);

    ctx.restore();
    this.lastRenderedBounds = cloneBounds(this.bounds);
    this.clearDirty(DIRTY_RENDER);
  }

  // --- Hit testing ---
  containsLocal(x, y) {
    const b = this.bounds;
    return x >= 0 && y >= 0 && x <= b.width && y <= b.height;
  }

  globalToLocal(point) {
    const b = this.bounds;
    return { x: point.x - b.x, y: point.y - b.y };
  }

  hitTest(point) {
    if (!this.visible) return null;
    if (!this.hitTestable) return null;

    // 1. Children first (reverse order)
    for (let i = this.children.length - 1; i >= 0; i--) {
      const child = this.children[i];
      const local = child.globalToLocal(point);
      const hit = child.hitTest(local);
      if (hit) return hit;
    }

    // 2. Self
    if (this.containsLocal(point.x, point.y)) {
      return this;
    }

    return null;
  }

  // --- Events ---
  on(type, fn) { this.emitter.on(type, fn); }
  off(type, fn) { this.emitter.off(type, fn); }
  emit(type, payload) { this.emitter.emit(type, payload); }

  onEvent(event) {
    return this.behavior?.onEvent?.(this, event) ?? false;
  }

  onEventCapture(event) {
    return this.behavior?.onEventCapture?.(this, event) ?? false;
  }

  onEventBubble(event) {
    return this.behavior?.onEventBubble?.(this, event) ?? false;
  }

  getRoot() {
    let node = this;
    while (node?.parent) {
      node = node.parent;
    }
    return node;
  }

  markDirty(flags) {
    this.flags |= flags;
  }

  clearDirty(flags) {
    this.flags &= ~flags;
  }

  hasDirty(flags) {
    return (this.flags & flags) !== 0;
  }

  requestLayout() {
    this.markDirty(DIRTY_LAYOUT | DIRTY_RENDER);
    const root = this.getRoot();
    root?.emit("scheduleLayout", { node: this });
    root?.emit("scheduleRender", { node: this });
    root?.emit("invalidate", { node: this, flags: this.flags });
  }

  requestRender() {
    this.markDirty(DIRTY_RENDER);
    const root = this.getRoot();
    root?.emit("scheduleRender", { node: this });
    root?.emit("invalidate", { node: this, flags: this.flags });
  }

  requestUpdate() {
    this.markDirty(DIRTY_UPDATE | DIRTY_RENDER);
    const root = this.getRoot();
    root?.emit("scheduleUpdate", { node: this });
    root?.emit("scheduleRender", { node: this });
    root?.emit("invalidate", { node: this, flags: this.flags });
  }

  createStyleProxy(style = {}) {
    return new Proxy(style, {
      set: (target, key, value) => {
        const previous = target[key];
        if (previous === value) {
          return true;
        }

        target[key] = value;

        if (isLayoutStyleKey(key)) {
          this.requestLayout();
        } else {
          this.requestRender();
        }

        return true;
      },
      deleteProperty: (target, key) => {
        if (!(key in target)) {
          return true;
        }

        delete target[key];

        if (isLayoutStyleKey(key)) {
          this.requestLayout();
        } else {
          this.requestRender();
        }

        return true;
      }
    });
  }
}

const LAYOUT_STYLE_KEYS = new Set([
  "width",
  "height",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft"
]);

function isLayoutStyleKey(key) {
  return LAYOUT_STYLE_KEYS.has(String(key));
}

function cloneBounds(bounds) {
  if (!bounds) return null;
  return {
    x: bounds.x ?? 0,
    y: bounds.y ?? 0,
    width: bounds.width ?? 0,
    height: bounds.height ?? 0
  };
}

function buildNodeLayout(bounds, style = {}) {
  const left = toFinite(style.paddingLeft, 0) + toFinite(style.paddingX, 0);
  const right = toFinite(style.paddingRight, 0) + toFinite(style.paddingX, 0);
  const top = toFinite(style.paddingTop, 0) + toFinite(style.paddingY, 0);
  const bottom = toFinite(style.paddingBottom, 0) + toFinite(style.paddingY, 0);

  const width = bounds?.width ?? 0;
  const height = bounds?.height ?? 0;
  const x = bounds?.x ?? 0;
  const y = bounds?.y ?? 0;

  return {
    x,
    y,
    width,
    height,
    contentX: x + left,
    contentY: y + top,
    contentWidth: Math.max(0, width - left - right),
    contentHeight: Math.max(0, height - top - bottom),
    padding: { left, right, top, bottom }
  };
}

function toFinite(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}
