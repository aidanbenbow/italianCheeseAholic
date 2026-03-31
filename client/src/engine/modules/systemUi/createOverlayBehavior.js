import { behaviorRegistry } from "../../registries/behaviourReg.js";

export function createOverlayBehavior() {
  const OverlayBehaviorClass = behaviorRegistry.get("overlay");
  return new OverlayBehaviorClass(null);
}