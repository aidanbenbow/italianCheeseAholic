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