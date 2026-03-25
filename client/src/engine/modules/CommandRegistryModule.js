import { BaseModule } from "./BaseModule.js";

export class CommandRegistryModule extends BaseModule {
  constructor(engine) {
    super(engine);
    this.commands = new Map();
    this.devCommandNames = new Set();
  }

  contextExports() {
    return {
      commands: this
    };
  }

  register(name, handler) {
    if (!name || typeof handler !== "function") {
      console.warn("Invalid command registration:", name);
      return;
    }

    this.commands.set(name, handler);
    this.engine.emit("command:registered", { name });
  }

  attach() {
    if (!this._isDevMode()) return;

    this.register("debug:inputPipeline", () => {
      const snapshot = this.engine.context.input?.pipeline?.debugSnapshot?.() ?? [];
      console.table(snapshot);
      return snapshot;
    });

    this.devCommandNames.add("debug:inputPipeline");
  }

  unregister(name) {
    this.commands.delete(name);
    this.engine.emit("command:unregistered", { name });
  }

  execute(name, payload) {
    const handler = this.commands.get(name);

    if (!handler) {
      console.warn(`Command not found: ${name}`);
      this.engine.emit("command:missing", { name });
      return;
    }

    try {
      handler(payload);
      const eventPayload = (payload === undefined)
        ? { name }
        : { name, payload };
      this.engine.emit("command:executed", eventPayload);
    } catch (err) {
      console.error(`Command failed: ${name}`, err);
      this.engine.emit("command:error", { name, error: err });
    }
  }

  detach() {
    for (const name of this.devCommandNames) {
      this.unregister(name);
    }
    this.devCommandNames.clear();
  }

  _isDevMode() {
    if (this.engine.context.debugFlags?.devCommands === true) {
      return true;
    }

    const host = globalThis?.location?.hostname;
    return host === "localhost" || host === "127.0.0.1";
  }

  destroy() {
    this.detach();
    this.commands.clear();
  }
}
