import { attachModules, detachModules } from "../modules/moduleLifecycle.js";


export class BaseEngine {
  constructor({ id, context, onEngineEvent } = {}) {
    this.id = id;
    this.context = (context && typeof context === "object") ? context : {};
    this.context.engine ??= this;
    this.onEngineEvent = onEngineEvent;
    console.log(this.onEngineEvent);
    this.modules = [];
    this.lifecycleModules = [];
    this.eventListeners = new Map();
    this.isMounted = false;
  }

  resolveContextExports(module) {
    if (!module) return {};

    const declaration =
      module.contextExports ??
      module.constructor?.contextExports;

    if (!declaration) return {};

    if (typeof declaration === "function") {
      const resolved = declaration.call(module, this.context);
      return (resolved && typeof resolved === "object") ? resolved : {};
    }

    return (typeof declaration === "object") ? declaration : {};
  }

  registerModule(module) {
    if (!module) return;

    this.context.modules ??= {};

    const moduleId =
      module.id ??
      module.name ??
      module.constructor?.moduleName ??
      module.constructor?.name;

    if (moduleId) {
      this.context.modules[moduleId] = module;
    }

    const contextExports = this.resolveContextExports(module);
    for (const [key, value] of Object.entries(contextExports)) {
      this.context[key] = value;
    }
  }

  registerModules(modules = []) {
    for (const module of modules) {
      this.registerModule(module);
    }
  }

  mount() {
    console.log(`[${this.id}] Mounting engine...`);
    this.attachModules(this.lifecycleModules);
    this.isMounted = true;
  }

  attachModules(modules = this.modules) {
    attachModules(modules);
  }

  detachModules(modules = this.modules) {
    detachModules(modules);
  }

  on(eventName, handler) {
    if (!eventName || typeof handler !== 'function') return () => {};
    const listeners = this.eventListeners.get(eventName) || new Set();
    listeners.add(handler);
    this.eventListeners.set(eventName, listeners);
    return () => this.off(eventName, handler);
  }

  off(eventName, handler) {
    const listeners = this.eventListeners.get(eventName);
    if (!listeners) return;
    listeners.delete(handler);
    if (!listeners.size) this.eventListeners.delete(eventName);
  }

  emit(eventName, payload) {
    const listeners = this.eventListeners.get(eventName);
    const hasInternalListeners = Boolean(listeners?.size);
console.log(listeners);
    if (hasInternalListeners) {
      for (const handler of listeners) {
        handler(payload);
      }
    }

    const hasExternalGateway = typeof this.onEngineEvent === 'function';
    if (!hasInternalListeners && !hasExternalGateway) {
      console.warn(`[${this.id}] No handlers for event: ${eventName}`);
    }

    this.onEngineEvent?.({ type: eventName, payload });
  }

  destroy() {
    this.detachModules(this.modules);
    this.eventListeners.clear();
    this.isMounted = false;
  }

  addModule(module, lifecycle = true) {
    if (!module) return;
    this.modules.push(module);

    if (lifecycle) {
      this.lifecycleModules.push(module);
    }

    if (this.isMounted && lifecycle) {
      this.attachModules([module]);
    }

    this.registerModule(module);

  }
}