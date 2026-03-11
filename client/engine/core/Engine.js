import { BaseEngine } from "./BaseEngine.js";
import { AppLoaderModule } from "../modules/AppLoaderModule.js";
import { CommandRegistryModule } from "../modules/CommandRegistryModule.js";

export class Engine extends BaseEngine {
  constructor(options = {}) {
    super(options);

    // Create modules
    this.appLoader = new AppLoaderModule(this);
    this.commands = new CommandRegistryModule(this);

    // Register modules with the engine lifecycle
    this.modules = [
      this.appLoader,
      this.commands
    ];
  }

  start() {
    this.mount();
    this.emit("engine:started");
  }
}
