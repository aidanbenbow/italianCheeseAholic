import { TinyEmitter } from "./tinyEmitter.js";

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
    this.style = style;
    this.visible = visible;

    this.parent = null;
    this.children = [];

    // Always initialized
    this.bounds = { x: 0, y: 0, width: 0, height: 0 };
    this.measured = { width: 0, height: 0 };

    this.hitTestable = true;

    // Optional dirty metadata (your pipeline can use it)
    this.meta = {
      dirty: false,
      dirtyChildren: 0,
      lastFrame: 0
    };

    this.emitter = new TinyEmitter();

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
  }

  remove(child) {
    const i = this.children.indexOf(child);
    if (i >= 0) {
      this.children.splice(i, 1);
      child.parent = null;
    }
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
    this.measured =
      this.behavior?.measure?.(this, constraints, ctx) ??
      { width: this.style.width ?? 100, height: this.style.height ?? 30 };

    return this.measured;
  }

  layout(bounds, ctx) {
    this.bounds = bounds;
    this.behavior?.layout?.(this, bounds, ctx);
  }

  // --- Update ---
  update(dt, ctx) {
    this.behavior?.update?.(this, dt, ctx);
    for (const c of this.children) c.update(dt, ctx);
  }

  // --- Render ---
  render(ctx) {
    if (!this.visible) return;

    ctx.save();
    this.behavior?.render?.(this, ctx);

    for (const c of this.children) {
      c.render(ctx);
    }

    ctx.restore();
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
}
