// /render/utils/depthUtils.js

export function getDepth(node) {
  let depth = 0;
  let current = node?.parent;

  while (current) {
    depth++;
    current = current.parent;
  }

  return depth;
}