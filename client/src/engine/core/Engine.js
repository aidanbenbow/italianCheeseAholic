import { BaseEngine } from "./BaseEngine.js";
import { AppLoaderModule } from "../modules/AppLoaderModule.js";
import { CommandRegistryModule } from "../modules/CommandRegistryModule.js";
import { UIModule } from "../modules/UIModule.js";
import { SceneGraphModule } from "../modules/SceneGraphModule.js";
import { RendererModule } from "../modules/RendererModule.js";
import { SystemUIModule } from "../modules/SystemUIModule.js";


export class Engine extends BaseEngine {
  constructor(options = {}) {
    super({ id: "engine", ...options });

    // Create modules
    this.appLoader = new AppLoaderModule(this);
    this.commands = new CommandRegistryModule(this);
    this.sceneGraph = new SceneGraphModule(this);
    this.renderer = new RendererModule(this);
    this.ui = new UIModule(this);
    this.systemUI = new SystemUIModule(this);

    // Register modules with the engine lifecycle
    this.modules = [
      this.appLoader,
      this.commands,
      this.sceneGraph,
      this.renderer,
      this.ui,
      this.systemUI
    ];

    this.lifecycleModules = [
      this.commands,
      this.sceneGraph,
      this.renderer,
      this.ui,
      this.systemUI
    ]
  }

  start() {
    this.mount();
    this.emit("engine:started");
  }
 
}
