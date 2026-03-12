export class TinyEmitter {
  constructor() {
    this.listeners = {};
  }

  on(event, handler) {
    (this.listeners[event] ??= new Set()).add(handler);
  }

  off(event, handler) {
    this.listeners[event]?.delete(handler);
  }

  emit(event, payload) {
    const handlers = this.listeners[event];
    if (!handlers) return;
    for (const fn of handlers) fn(payload);
  }
}
