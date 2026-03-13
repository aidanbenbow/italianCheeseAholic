import { BaseEngine } from "./BaseEngine.js";
import { AppLoaderModule } from "../modules/AppLoaderModule.js";
import { CommandRegistryModule } from "../modules/CommandRegistryModule.js";
import { UIModule } from "../modules/UIModule.js";
import { SceneGraphModule } from "../modules/SceneGraphModule.js";


export class Engine extends BaseEngine {
  constructor(options = {}) {
    super(options);

    // Create modules
    this.appLoader = new AppLoaderModule(this);
    this.commands = new CommandRegistryModule(this);
    this.sceneGraph = new SceneGraphModule(this);
    this.ui = new UIModule(this);

    // Register modules with the engine lifecycle
    this.modules = [
      this.appLoader,
      this.commands,
      this.sceneGraph,
      this.ui
    ];

    this.lifecycleModules = [
      this.commands,
      this.sceneGraph,
      this.ui
    ]
  }

  start() {
    this.mount();
    this.emit("engine:started");
  }
 
}
