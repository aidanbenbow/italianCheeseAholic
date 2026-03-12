// engine/registries/behaviorRegistry.js

import { DefaultBehavior } from "../nodes/behaviours/defaultBehaviour.js";


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