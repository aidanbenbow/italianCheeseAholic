// SceneEvent.js
export class SceneEvent {
  constructor({ type, x, y, target, originalEvent }) {
    this.type = type;
    this.x = x;
    this.y = y;

    // Node that was hit by hit-testing
    this.target = target;

    // DOM event or synthetic event
    this.originalEvent = originalEvent;

    // Event propagation state
    this.currentTarget = null;
    this.phase = null; // 'capture' | 'target' | 'bubble'
    this.propagationStopped = false;
  }

  stopPropagation() {
    this.propagationStopped = true;
  }
}

// -------------------------------------------------------
// Build the propagation path from root → target
// -------------------------------------------------------
export function buildScenePath(target) {
  const path = [];
  let node = target;

  while (node) {
    path.unshift(node); // root at index 0, target at end
    node = node.parent;
  }

  return path;
}