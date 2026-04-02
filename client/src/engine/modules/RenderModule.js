// /modules/RendererModule.js
import { CanvasManager } from "../utils/canvasManager.js";
import { RenderManager } from "../utils/renderManager.js";
import { RenderPipeline } from "../render/pipeline/RenderPipeline.js";

export class RendererModule {
  constructor(engine) {
    this.engine = engine;

    this.canvasManager = null;
    this.renderManager = null;

    this.contexts = {};
    this.pipelines = {};
  }

  attach() {
    // 1. Create layered canvas manager
    this.canvasManager = new CanvasManager({
      main:       { mainId: "#mainCanvas",       bg: "transparent" },
      system:     { mainId: "#systemCanvas",     bg: "transparent" },
      interaction:{ mainId: "#interactionCanvas",bg: "transparent" },
      debug:      { mainId: "#debugCanvas",      bg: "transparent" },
      hit:        { mainId: "#hitCanvas",        bg: "transparent" }
    });

    // 2. Create render manager
    this.renderManager = new RenderManager(this.canvasManager);

    // 3. Create RenderContexts for each layer
    this._createContexts();

    // 4. Create pipelines for each layer
    this._createPipelines();

    // 5. Attach renderer contexts to pipelines
    this._attachContextsToPipelines();

    // 6. Connect main pipeline to scene graph
    if (this.engine.sceneGraph?.root) {
      this.pipelines.main.setRoot(this.engine.sceneGraph.root);
    }

    console.log("RendererModule attached with multi-layer rendering");
  }

  _createContexts() {
    const layers = ["main", "system", "interaction", "debug", "hit"];

    for (const layer of layers) {
      const ctx = this.canvasManager.getContext(layer);
      const hitCtx = this.canvasManager.getHitContext(layer);

      this.contexts[layer] = {
        layer,
        ctx,
        hitCtx,

        // Scene helpers
        toSceneCoords: (x, y) =>
          this.canvasManager.toSceneCoords(layer, x, y),

        getSize: () => this.canvasManager.getCanvasSize(layer),

        // Pipeline reference (set later)
        pipeline: null
      };
    }
  }

  _createPipelines() {
    const layers = ["main", "system", "interaction", "debug", "hit"];

    for (const layer of layers) {
      const pipeline = new RenderPipeline({
        renderManager: this.renderManager,
        rendererContext: null, // set later
        editor: this.engine.editor || null
      });

      // Debug overlay only on debug layer
      pipeline.debugSubtreeScheduling = layer === "debug";

      this.pipelines[layer] = pipeline;
    }
  }

  _attachContextsToPipelines() {
    for (const layer of Object.keys(this.contexts)) {
      const ctx = this.contexts[layer];
      const pipeline = this.pipelines[layer];

      ctx.pipeline = pipeline;
      pipeline.setRendererContext(ctx.ctx);
    }
  }

  // -------------------------------------------------------
  // Tick all pipelines (called by Engine each frame)
  // -------------------------------------------------------
  tickAll(dt = 16.67) {
    for (const layer of Object.keys(this.pipelines)) {
      const pipeline = this.pipelines[layer];
      const ctx = this.contexts[layer];

      if (!pipeline || !ctx) continue;

      const constraints = ctx.getSize();
      pipeline.tick(dt, constraints);
    }
  }

  detach() {
    this.canvasManager?.destroy?.();

    this.pipelines = {};
    this.contexts = {};
    this.canvasManager = null;
    this.renderManager = null;

    console.log("RendererModule detached");
  }
}