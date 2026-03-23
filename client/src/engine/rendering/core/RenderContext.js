// /render/core/RenderContext.js

export class RenderContext {
  constructor({ layer, canvasManager, pipeline }) {
    this.layer = layer;
    this.canvasManager = canvasManager;
    this.pipeline = pipeline;

    this.ctx = canvasManager.getContext(layer);

    // Optional hit layer support
    this.hitCtx = null;

    // Scene helpers
    this.toSceneCoords = (x, y) =>
      canvasManager.toSceneCoords(layer, x, y);

    this.getSize = () =>
      canvasManager.getCanvasSize(layer);

    // Editor/UI state
    this.selection = null;
    this.focus = null;
    this.dragState = null;
    this.hoverNode = null;
  }

  setPipeline(pipeline) {
    this.pipeline = pipeline;
  }
}