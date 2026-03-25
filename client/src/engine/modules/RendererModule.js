import { CanvasManager } from "../utils/canvasManager.js";
import { RenderManager } from "../utils/renderManager.js";
import { RenderPipeline } from "../rendering/RenderPipeline.js";
import { BaseModule } from "./BaseModule.js";

/**
 * RendererModule manages multi-layer canvas rendering:
 * - main: Application scene
 * - system: System UI (popups, toasts, dropdowns)
 * - interaction: Interaction feedback (hover, drag, cursor)
 * - debug: Debug overlays (performance metrics)
 * - hit: Invisible hit-test feedback layer
 */
export class RendererModule extends BaseModule {
  constructor(engine) {
    super(engine);
    this.canvasManager = null;
    this.renderManager = null;
    this.pipelines = {};
  }

  contextExports() {
    return {
      renderer: this,
      canvasManager: this.canvasManager,
      renderManager: this.renderManager,
      renderPipelines: this.pipelines
    };
  }

  attach() {
   
    // 1. Initialize canvas manager with layer configuration
    this.canvasManager = new CanvasManager({
      main: {
        mainId: "#mainCanvas",
        hitId: "#hitCanvas",
        bg: "transparent"
      },
      system: {
        mainId: "#systemCanvas",
        bg: "transparent"
      },
      interaction: {
        mainId: "#interactionCanvas",
        bg: "transparent"
      },
      debug: {
        mainId: "#debugCanvas",
        bg: "transparent"
      }
    });

    // 2. Initialize render manager
    this.renderManager = new RenderManager(this.canvasManager, null);

    this.engine.context.canvasManager = this.canvasManager;
    this.engine.context.renderManager = this.renderManager;

    // 3. Create render pipelines for each layer
    this.pipelines.main = new RenderPipeline(this.renderManager);
    this.pipelines.system = new RenderPipeline(this.renderManager);
    this.pipelines.interaction = new RenderPipeline(this.renderManager);
    this.pipelines.debug = new RenderPipeline(this.renderManager);

    this.engine.context.renderPipelines = this.pipelines;

    this.pipelines.main.debugSubtreeScheduling = false;
    this.pipelines.system.debugSubtreeScheduling = false;
    this.pipelines.interaction.debugSubtreeScheduling = false;
    this.pipelines.debug.debugSubtreeScheduling = true;

    // 4. Attach pipelines to canvas manager contexts
    const mainCtx = this.canvasManager.getContext("main");
    const systemCtx = this.canvasManager.getContext("system");
    const interactionCtx = this.canvasManager.getContext("interaction");
    const debugCtx = this.canvasManager.getContext("debug");

    if (mainCtx) this.pipelines.main.setRendererContext(mainCtx);
    if (systemCtx) this.pipelines.system.setRendererContext(systemCtx);
    if (interactionCtx) this.pipelines.interaction.setRendererContext(interactionCtx);
    if (debugCtx) this.pipelines.debug.setRendererContext(debugCtx);

    // 5. Connect main pipeline to scene graph root
    if (this.engine.sceneGraph?.root) {
      this.pipelines.main.setRoot(this.engine.sceneGraph.root);
    }

    // 6. Start main pipeline
    const mainSize = this.canvasManager.getCanvasSize("main");
    this.pipelines.main.start(mainSize);

    // 7. Start system pipeline
    const systemSize = this.canvasManager.getCanvasSize("system");
    this.pipelines.system.start(systemSize);

  }

  detach() {
    // Stop all pipelines
    for (const pipeline of Object.values(this.pipelines)) {
      pipeline.stop();
    }

    this.pipelines = {};
    this.engine.context.renderPipelines = {};

    this.renderManager = null;
    this.engine.context.renderManager = null;

    this.canvasManager = null;
    this.engine.context.canvasManager = null;

    console.log("RendererModule detached");
  }

  /**
   * Get a specific layer's pipeline
   */
  getPipeline(layerName = "main") {
    return this.pipelines[layerName] || null;
  }

  /**
   * Get canvas manager for direct canvas access
   */
  getCanvasManager() {
    return this.canvasManager;
  }

  /**
   * Get render manager for custom rendering
   */
  getRenderManager() {
    return this.renderManager;
  }

  /**
   * Tick all pipelines (call once per frame)
   */
  tickAll(dt = 16.67) {
    for (const pipeline of Object.values(this.pipelines)) {
      if (pipeline.running) {
        pipeline.tick(dt);
      }
    }
  }
}
