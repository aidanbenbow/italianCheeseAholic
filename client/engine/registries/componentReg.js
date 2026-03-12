// engine/registries/componentRegistry.js
class ComponentRegistry {
  constructor() {
    this.map = new Map();
  }

  register(name, ComponentClass) {
    this.map.set(name, ComponentClass);
  }

  create(name, props = {}) {
    const CompClass = this.map.get(name);
    if (!CompClass) {
      console.warn(`Unknown component: ${name}`);
      return null;
    }
    return new CompClass(props);
  }

  has(name) {
    return this.map.has(name);
  }

  list() {
    return Array.from(this.map.keys());
  }
}

export const componentRegistry = new ComponentRegistry();