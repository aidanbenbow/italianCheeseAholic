import { VNode } from "./vnode.js";

export function h(type, props = {}, ...children) {
  const flat = children.flat(Infinity).filter(c => c != null && c !== false);

  return new VNode(type, props, flat);
}