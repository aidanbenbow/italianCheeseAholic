export class Component {
  constructor() {
    this.node = null;
    this.enabled = true;
  }

  attach(node) {
    this.node = node;
    this.onAttach?.(node);
  }

  detach() {
    this.onDetach?.(this.node);
    this.node = null;
  }

  // Lifecycle hooks
  onAttach(node) {}
  onDetach(node) {}

  // Scene lifecycle hooks
  measure(node, constraints, ctx) {}
  layout(node, bounds, ctx) {}
  update(node, dt, ctx) {}
  render(node, ctx) {}

  // Generic event hook
  onEvent(node, event) {}

  onEventCapture(node, event) {}

  onEventBubble(node, event) {}
}