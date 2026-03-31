// behaviors/Behavior.js
export class Behavior {
  constructor(node) {
    this.node = node;
  }

  toFinite(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  normalizeConstraints(constraints) {
    return {
      maxWidth: Number.isFinite(constraints?.maxWidth) ? constraints.maxWidth : Infinity,
      maxHeight: Number.isFinite(constraints?.maxHeight) ? constraints.maxHeight : Infinity
    };
  }

  measureFillConstraints(constraints) {
    return {
      width: constraints?.maxWidth ?? 0,
      height: constraints?.maxHeight ?? 0
    };
  }

  layoutAbsoluteChildren(node, bounds, ctx) {
    const childConstraints = {
      maxWidth: bounds.width,
      maxHeight: bounds.height
    };

    for (const child of node.children) {
      const measured = child.measure(childConstraints, ctx);
      const width = child.style?.width ?? measured?.width ?? 0;
      const height = child.style?.height ?? measured?.height ?? 0;
      const x = bounds.x + (child.style?.x ?? 0);
      const y = bounds.y + (child.style?.y ?? 0);

      child.applyLayout(
        {
          x,
          y,
          width,
          height
        },
        ctx
      );
    }
  }

  // --- Layout ---
  measure(node, constraints, ctx) {
    return { width: 0, height: 0 };
  }

  layout(node, bounds, ctx) {
    // default: do nothing
  }

  // --- Update ---
  update(node, dt, ctx) {
    // default: do nothing
  }

  // --- Render ---
  render(node, ctx) {
    // default: do nothing
  }

  // --- Hit testing ---
  hitTest(node, point) {
    return node.containsLocal(point.x, point.y) ? node : null;
  }

  // --- Optional event propagation ---
  onEvent(node, event) {
    return false;
  }

  onEventCapture(node, event) {
    return false;
  }

  onEventBubble(node, event) {
    return false;
  }
}