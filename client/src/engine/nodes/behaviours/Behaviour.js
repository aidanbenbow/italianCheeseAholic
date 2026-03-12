// behaviors/Behavior.js
export class Behavior {
  constructor(node) {
    this.node = node;
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

  // --- Optional pointer events ---
  onPointerEnter(node) {}
  onPointerLeave(node) {}
  onPointerDown(node, x, y) {}
  onPointerUp(node, x, y) {}
  onPointerDoubleClick(node, x, y) {}

  // --- Optional event propagation ---
  onEvent(node, event) {
    return false;
  }
}