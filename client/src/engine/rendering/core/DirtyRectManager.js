// /render/core/DirtyRectManager.js
import {
  normalizeRect,
  mergeOverlappingRects,
  getFullCanvasRect,
  rectMatchesCanvas
} from "../utils/rectUtils.js";

export class DirtyRectManager {
  compute(renderQueue, rendererContext) {
    const dirtyRects = [];

    for (const node of renderQueue) {
      const currentRect = normalizeRect(node.bounds);
      const previousRect = normalizeRect(node.lastRenderedBounds);

      if (currentRect) dirtyRects.push(currentRect);
      if (previousRect) dirtyRects.push(previousRect);
    }

    const overlayRect = this.getDebugOverlayRect(rendererContext);
    if (overlayRect) dirtyRects.push(overlayRect);

    return mergeOverlappingRects(dirtyRects);
  }

  clearRect(renderManager, rendererContext, rect) {
    if (!rect || !rendererContext) return;

    if (typeof renderManager?.clearRect === "function") {
      renderManager.clearRect(rendererContext, rect);
      return;
    }

    if (
      typeof renderManager?.clearAll === "function" &&
      rectMatchesCanvas(rect, rendererContext)
    ) {
      renderManager.clearAll(rendererContext);
      return;
    }

    rendererContext.clearRect(rect.x, rect.y, rect.width, rect.height);
  }

  renderClipped(rendererContext, rect, renderFn) {
    if (!rect || !rendererContext || typeof renderFn !== "function") return;

    const ctx = rendererContext;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.clip();
    renderFn();
    ctx.restore();
  }

  getFullCanvasRect(rendererContext) {
    return getFullCanvasRect(rendererContext);
  }

  getDebugOverlayRect(rendererContext) {
    if (!rendererContext?.canvas) return null;

    const panelWidth = 190;
    const panelHeight = 186;
    const margin = 8;
    const logicalWidth =
      rendererContext.canvas._logicalWidth ?? rendererContext.canvas.width;
    const x = Math.max(
      margin,
      logicalWidth - panelWidth - margin
    );
    const y = margin;

    return { x, y, width: panelWidth, height: panelHeight };
  }
}