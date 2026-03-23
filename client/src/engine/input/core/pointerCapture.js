// /input/core/PointerCapture.js

export class PointerCapture {
  constructor() {
    // pointerId → captured node
    this.captured = new Map();
  }

  /**
   * Capture a pointer to a specific node.
   */
  capture(pointerId, node) {
    this.captured.set(pointerId, node);
  }

  /**
   * Release capture for a pointer.
   */
  release(pointerId) {
    this.captured.delete(pointerId);
  }

  /**
   * Get the captured node for a pointer, if any.
   */
  get(pointerId) {
    return this.captured.get(pointerId) || null;
  }

  /**
   * Release all captures for a node (e.g., when node is destroyed).
   */
  releaseNode(node) {
    for (const [pointerId, capturedNode] of this.captured.entries()) {
      if (capturedNode === node) {
        this.captured.delete(pointerId);
      }
    }
  }

  /**
   * Debug snapshot for overlays.
   */
  snapshot() {
    return Array.from(this.captured.entries()).map(([id, node]) => ({
      pointerId: id,
      node
    }));
  }
}