// SceneHitTestSystem.js
export class SceneHitTestSystem {
  hitTest(root, x, y, ctx) {
    if (!root || !root.bounds) return null;
    return this._hitNode(root, { x, y }, ctx);
  }

  _hitNode(node, point, ctx) {
    if (!node || !node.visible || !node.bounds) return null;

    // Convert global → local
    const local = node.globalToLocal(point);

    // If pointer is outside this node, skip entire subtree
    if (!node.containsLocal(local.x, local.y)) return null;

    // Adjust for scrollable nodes
    const childPoint = node.scroll
      ? {
          x: point.x,
          y: point.y + (node.scroll.offsetY || 0)
        }
      : point;

    // 1. Children first (reverse order = topmost first)
    const children = node.children;
    for (let i = children.length - 1; i >= 0; i--) {
      const hit = this._hitNode(children[i], childPoint, ctx);
      if (hit) return hit;
    }

    // 2. Self hit test
    return node.hitTest(local, ctx) ? node : null;
  }
}