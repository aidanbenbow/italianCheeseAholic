import { BaseEngine } from "./BaseEngine.js";
import { AppLoaderModule } from "../modules/AppLoaderModule.js";
import { CommandRegistryModule } from "../modules/CommandRegistryModule.js";
import { UIModule } from "../modules/UIModule.js";
import { SceneGraphModule } from "../modules/SceneGraphModule.js";
import { RendererModule } from "../modules/RendererModule.js";
import { SystemUIModule } from "../modules/SystemUIModule.js";
import { behaviorRegistry, registerCoreBehaviours } from "../registries/behaviourReg.js";
import { InputModule } from "../modules/inputModule.js";


export class Engine extends BaseEngine {
  constructor(options = {}) {
    super({ id: "engine", ...options });
    registerCoreBehaviours();
    this.context.behaviours = behaviorRegistry;
    this.context.behaviors = behaviorRegistry;

    // Create modules
    this.appLoader = new AppLoaderModule(this);
    this.commands = new CommandRegistryModule(this);
    this.sceneGraph = new SceneGraphModule(this);
    this.renderer = new RendererModule(this);
    this.ui = new UIModule(this);
    this.systemUI = new SystemUIModule(this);
    this.input = new InputModule(this);

    // Register modules with the engine lifecycle
    this.modules = [
      this.appLoader,
      this.commands,
      this.sceneGraph,
      this.renderer,
      this.ui,
      this.systemUI,
      this.input
    ];

    this.lifecycleModules = [
      this.commands,
      this.sceneGraph,
      this.renderer,
      this.ui,
      this.systemUI,
      this.input
    ]
  }

  start() {
    this.mount();
    this.emit("engine:started");
  }
 
}


// /engine/Engine.js (excerpt)

// start() {
//   if (this.running) return;
//   this.running = true;

//   let lastTime = performance.now();

//   const loop = (time) => {
//     const dt = time - lastTime;
//     lastTime = time;

//     // 1. Input pipeline tick (gestures, pointer state, etc.)
//     if (this.input?.pipeline) {
//       this.input.pipeline.tick(dt);
//     }

//     // 2. Render all layers
//     if (this.renderer) {
//       this.renderer.tickAll(dt);
//     }

//     // 3. System UI / Editor updates (optional)
//     this.emit("engine:frame", { dt });

//     if (this.running) {
//       requestAnimationFrame(loop);
//     }
//   };

//   requestAnimationFrame(loop);
// }

// stop() {
//   this.running = false;
// }