export class BaseModule {
  constructor(engine, { id } = {}) {
    this.engine = engine;
    this.id = id ?? this.constructor.moduleName ?? this.constructor.name;
  }

  contextExports() {
    return {};
  }

  attach() {}

  detach() {}

  emit(eventName, payload) {
    this.engine?.emit?.(eventName, payload);
  }

  get context() {
    return this.engine?.context;
  }
}