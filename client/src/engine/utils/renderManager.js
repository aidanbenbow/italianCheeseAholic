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
    const logicalWidth = ctx.canvas._logicalWidth ?? ctx.canvas.width;
    const logicalHeight = ctx.canvas._logicalHeight ?? ctx.canvas.height;
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);
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

// /render/core/RenderManager.js

// export class RenderManager {
//   constructor(canvasManager) {
//     this.canvasManager = canvasManager;
//   }

//   // -------------------------------------------------------
//   // Clear a specific rect on a given 2D context
//   // -------------------------------------------------------
//   clearRect(ctx, rect) {
//     if (!ctx || !rect) return;
//     ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
//   }

//   // -------------------------------------------------------
//   // Clear the entire canvas
//   // -------------------------------------------------------
//   clearAll(ctx) {
//     if (!ctx || !ctx.canvas) return;
//     ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
//   }

//   // -------------------------------------------------------
//   // Render clipped to a rect
//   // -------------------------------------------------------
//   renderClipped(ctx, rect, renderFn) {
//     if (!ctx || !rect || typeof renderFn !== "function") return;

//     ctx.save();
//     ctx.beginPath();
//     ctx.rect(rect.x, rect.y, rect.width, rect.height);
//     ctx.clip();

//     renderFn();

//     ctx.restore();
//   }

//   // -------------------------------------------------------
//   // Draw a node subtree (optional convenience)
//   // -------------------------------------------------------
//   renderNodeTree(node, ctx) {
//     if (!node) return;
//     node.render?.(ctx);

//     if (Array.isArray(node.children)) {
//       for (const child of node.children) {
//         this.renderNodeTree(child, ctx);
//       }
//     }
//   }

//   // -------------------------------------------------------
//   // Hit‑layer rendering (optional)
//   // -------------------------------------------------------
//   renderHitNode(node, hitCtx) {
//     if (!node || !hitCtx) return;
//     node.renderHit?.(hitCtx);
//   }

//   renderHitTree(node, hitCtx) {
//     if (!node) return;
//     this.renderHitNode(node, hitCtx);

//     if (Array.isArray(node.children)) {
//       for (const child of node.children) {
//         this.renderHitTree(child, hitCtx);
//       }
//     }
//   }

//   // -------------------------------------------------------
//   // Utility: get canvas size for a layer
//   // -------------------------------------------------------
//   getCanvasSize(layerName) {
//     return this.canvasManager.getCanvasSize(layerName);
//   }

//   // -------------------------------------------------------
//   // Utility: convert canvas coords → scene coords
//   // -------------------------------------------------------
//   toSceneCoords(layerName, x, y) {
//     return this.canvasManager.toSceneCoords(layerName, x, y);
//   }
// }