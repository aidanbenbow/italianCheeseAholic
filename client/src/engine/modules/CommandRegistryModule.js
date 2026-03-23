import { BaseModule } from "./BaseModule.js";

export class CommandRegistryModule extends BaseModule {
  constructor(engine) {
    super(engine);
    this.commands = new Map();
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
      this.engine.emit("command:executed", { name, payload });
    } catch (err) {
      console.error(`Command failed: ${name}`, err);
      this.engine.emit("command:error", { name, error: err });
    }
  }

  destroy() {
    this.commands.clear();
  }
}
