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

  // Pointer events
  onPointerEnter(node) {}
  onPointerLeave(node) {}
  onPointerDown(node, x, y) {}
  onPointerUp(node, x, y) {}
  onPointerDoubleClick(node, x, y) {}

  // Generic event hook
  onEvent(node, event) {}
}