// engine/registries/behaviorRegistry.js

import { DefaultBehavior } from "../nodes/behaviours/defaultBehaviour.js";
import { ButtonBehavior } from "../nodes/behaviours/buttonBehaviour.js";
import { VerticalBehavior } from "../nodes/behaviours/verticalBehaviour.js";
import { TextBehavior } from "../nodes/behaviours/textBehaviour.js";
import { BoxBehavior } from "../nodes/behaviours/boxBehaviour.js";
import { InputBehavior } from "../nodes/behaviours/inputBehaviour.js";
import { OverlayLayerBehavior } from "../nodes/behaviours/overlayLayerBehaviour.js";


class BehaviorRegistry {
  constructor() {
    this.map = new Map();
  }

  register(type, BehaviorClass) {
    this.map.set(type, BehaviorClass);
  }

  get(type) {
    return this.map.get(type) ?? DefaultBehavior;
  }

  has(type) {
    return this.map.has(type);
  }

  list() {
    return Array.from(this.map.keys());
  }
}

export const behaviorRegistry = new BehaviorRegistry();

let coreBehaviorsRegistered = false;

export function registerCoreBehaviours() {
  if (coreBehaviorsRegistered) return;

  behaviorRegistry.register("button", ButtonBehavior);
  behaviorRegistry.register("vertical", VerticalBehavior);
  behaviorRegistry.register("text", TextBehavior);
  behaviorRegistry.register("box", BoxBehavior);
  behaviorRegistry.register("input", InputBehavior);
  behaviorRegistry.register("overlay", OverlayLayerBehavior);

  coreBehaviorsRegistered = true;
}