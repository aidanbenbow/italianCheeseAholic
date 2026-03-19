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
}