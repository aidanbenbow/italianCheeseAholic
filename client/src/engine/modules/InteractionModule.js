// /engine/modules/InteractionModule.js

import { BaseModule } from "./BaseModule.js";

export class InteractionModule extends BaseModule {
  constructor(engine) {
    super(engine, { id: "interaction" });
    this.canvas = null;
    this.ctx = null;
    this.overlayRenderers = [];
    this.isRunning = false;
    this.animationFrameId = null;
  }

  contextExports() {
    return {
      interaction: this
    };
  }

  attach() {
    // Get the interaction canvas from the canvas manager
    const canvasManager = this.engine.context.canvasManager;
    this.canvas = canvasManager?.getCanvas?.("interaction");
    this.ctx = canvasManager?.getContext?.("interaction");

    if (!this.canvas || !this.ctx) {
      console.warn("InteractionModule: interaction canvas or context unavailable");
      return;
    }

    this.start();
  }

  detach() {
    this.stop();
    this.overlayRenderers = [];
  }

  // -------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this._render();
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isRunning = false;
  }

  // -------------------------------------------------------
  // Rendering
  // -------------------------------------------------------

  registerOverlayRenderer(renderer) {
    this.overlayRenderers.push(renderer);
  }

  unregisterOverlayRenderer(renderer) {
    const index = this.overlayRenderers.indexOf(renderer);
    if (index !== -1) {
      this.overlayRenderers.splice(index, 1);
    }
  }

  _render() {
    if (!this.isRunning || !this.ctx) return;

    // Clear canvas
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    // Render all registered overlays
    for (const renderer of this.overlayRenderers) {
      if (typeof renderer === "function") {
        renderer(this.ctx);
      } else if (typeof renderer.render === "function") {
        renderer.render(this.ctx);
      }
    }

    // Request next frame
    this.animationFrameId = requestAnimationFrame(() => this._render());
  }
}
