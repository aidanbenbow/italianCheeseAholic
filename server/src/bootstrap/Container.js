export class Container {
  constructor() {
    this.factories = new Map();
    this.instances = new Map();
    this.disposers = new Map();
     this._resolving = [];
  }

  register(name, factory) {
    this.factories.set(name, factory);
    return this;
  }

  singleton(name, factory, disposer) {
    this.factories.set(name, (c) => {
      if (!this.instances.has(name)) {
        const value = factory(c);
        this.instances.set(name, value);
        if (typeof disposer === "function") this.disposers.set(name, disposer);
      }
      return this.instances.get(name);
    });
    return this;
  }

  instance(name, value, disposer) {
    this.instances.set(name, value);
    this.factories.set(name, () => value);
    if (typeof disposer === "function") this.disposers.set(name, disposer);
    return this;
  }

  has(name) {
    return this.factories.has(name);
  }

  resolve(name) {
    const cycleStart = this._resolving.indexOf(name);
    if (cycleStart !== -1) {
      const cycle = [...this._resolving.slice(cycleStart), name];
      throw new Error(`Circular dependency detected: ${cycle.join(" -> ")}`);
    }

    const factory = this.factories.get(name);
    if (!factory) throw new Error(`Service not found: ${name}`);

    this._resolving.push(name);
    try {
      return factory(this);
    } finally {
      this._resolving.pop();
    }
  }

  tryResolve(name) {
    return this.has(name) ? this.resolve(name) : null;
  }

  dispose(name) {
    if (name) {
      const value = this.instances.get(name);
      const d = this.disposers.get(name);
      if (d && value) d(value);
      this.instances.delete(name);
      this.disposers.delete(name);
      return;
    }

    const keys = Array.from(this.instances.keys()).reverse();
    for (const key of keys) {
      const value = this.instances.get(key);
      const d = this.disposers.get(key);
      if (d && value) d(value);
    }

    this.instances.clear();
    this.disposers.clear();
  }

  // Optional: does not fail fast; returns disposer errors
  disposeAllSafe() {
    const errors = [];
    const keys = Array.from(this.instances.keys()).reverse();

    for (const key of keys) {
      const value = this.instances.get(key);
      const d = this.disposers.get(key);
      if (!d || !value) continue;
      try {
        d(value);
      } catch (err) {
        errors.push({ key, error: err });
      }
    }

    this.instances.clear();
    this.disposers.clear();
    return errors;
  }
}