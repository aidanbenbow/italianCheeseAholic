// export class RendererModule {
//   constructor(engine) {
//     this.engine = engine;
//     this.canvas = engine.context.canvas;
//     this.ctx = this.canvas.getContext("2d");
//   }

//   render() {
//     const ctx = this.ctx;
//     ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

//     const scene = this.engine.sceneGraph;
//     scene?.render(ctx);
//   }

//   destroy() {
//     this.ctx = null;
//     this.canvas = null;
//   }
// }

// rendererModule.js
export class RendererModule {
  constructor(canvasManager, renderManager) {
    this.canvasManager = canvasManager;
    this.renderManager = renderManager;

    this.contexts = {
      main: this._createRendererContext("main"),
      system: this._createRendererContext("system"),
      interaction: this._createRendererContext("interaction"),
      debug: this._createRendererContext("debug"),
      hit: this._createRendererContext("hit")
    };
  }

  // -------------------------------------------------------
  // Create a RendererContext for a layer
  // -------------------------------------------------------
  _createRendererContext(layerName) {
    const ctx = this.canvasManager.getContext(layerName);
    const hitCtx = this.canvasManager.getHitContext(layerName);

    return {
      layer: layerName,
      ctx,
      hitCtx,

      // Engine state
      selection: null,
      focus: null,
      dragState: null,
      hoverNode: null,

      // Pipeline reference (set externally)
      pipeline: null,

      // Scene coordinate helpers
      toSceneCoords: (x, y) =>
        this.canvasManager.toSceneCoords(layerName, x, y),

      // Canvas size
      getSize: () => this.canvasManager.getCanvasSize(layerName)
    };
  }

  // -------------------------------------------------------
  // Attach a pipeline to a layer
  // -------------------------------------------------------
  attachPipeline(layerName, pipeline) {
    const ctx = this.contexts[layerName];
    if (!ctx) return;

    ctx.pipeline = pipeline;
    pipeline.setRendererContext(ctx.ctx);
  }

  // -------------------------------------------------------
  // Render a layer
  // -------------------------------------------------------
  renderLayer(layerName) {
    const ctx = this.contexts[layerName];
    if (!ctx?.pipeline) return;

    ctx.pipeline.tick(16.67, ctx.getSize());
  }

  // -------------------------------------------------------
  // Render all layers in correct order
  // -------------------------------------------------------
  renderAll() {
    this.renderLayer("main");
    this.renderLayer("system");
    this.renderLayer("interaction");
    this.renderLayer("debug");
    this.renderLayer("hit");
  }

  destroy() {
    this.contexts = null;
  }
}