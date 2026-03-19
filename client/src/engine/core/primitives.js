import { SceneNode } from "../nodes/sceneNode.js";
import { behaviorRegistry } from "../registries/behaviourReg.js";

export function createBoxNode(options = {}) {
  return new SceneNode({
    visible: true,
    ...options,
    behavior: options.behavior ?? createBehaviorFromRegistry("box"),
    style: {
      background: "#334155",
      ...options.style
    }
  });
}

export function createTextNode(options = {}) {
  return new SceneNode({
    visible: true,
    ...options,
    behavior: options.behavior ?? createBehaviorFromRegistry("text"),
    style: {
      color: "#FFFFFF",
      font: "14px sans-serif",
      textAlign: "left",
      textBaseline: "middle",
      ...options.style
    }
  });
}

function createBehaviorFromRegistry(type) {
  const BehaviorClass = behaviorRegistry.get(type);
  return new BehaviorClass(null);
}
