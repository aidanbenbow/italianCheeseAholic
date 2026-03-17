// renderManager.js
export class RenderManager {
  constructor(canvasManager, rendererRegistry) {
    this.canvasManager = canvasManager;      // CanvasManager instance
    this.registry = rendererRegistry;        // RendererRegistry instance
    this.fallbackRenderer = null;
  }

  // -------------------------------------------------------
  // Renderer selection
  // -------------------------------------------------------
  setFallbackRenderer(renderer) {
    this.fallbackRenderer = renderer;
  }

  getRendererFor(node, context) {
    // First-screen special case (your Forms engine logic)
    if (context.firstScreen) {
      return this.registry.get("formIcon") || this.fallbackRenderer;
    }

    // Normal case: lookup by node.type
    return (
      this.registry.get(node.type) ||
      this.fallbackRenderer ||
      null
    );
  }

  // -------------------------------------------------------
  // Rendering a node
  // -------------------------------------------------------
  renderNode(node, ctx, context) {
    const renderer = this.getRendererFor(node, context);

    if (renderer?.render) {
      renderer.render(node, ctx, context);
      return;
    }

    // Fallback: node has its own render method
    if (typeof node.render === "function") {
      node.render(ctx, context);
    }
  }

  // -------------------------------------------------------
  // Canvas clearing
  // -------------------------------------------------------
  clearAll(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  clearRect(ctx, rect) {
    if (!rect) return;
    ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
  }

  // -------------------------------------------------------
  // Clipped rendering
  // -------------------------------------------------------
  renderClipped(ctx, rect, renderFn) {
    if (!rect || !renderFn) return;

    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.clip();

    renderFn();

    ctx.restore();
  }

  // -------------------------------------------------------
  // Layer access
  // -------------------------------------------------------
  getContext(layer = "main") {
    return this.canvasManager.getContext(layer);
  }

  getHitContext(layer = "main") {
    return this.canvasManager.getHitContext(layer);
  }

  getCanvasSize(layer = "main") {
    return this.canvasManager.getCanvasSize(layer);
  }
}