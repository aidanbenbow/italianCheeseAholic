// /render/pipeline/stages/EditorOverlayStage.js
import { RenderPipelineStage } from "../RenderPipelineStage.js";

export class EditorOverlayStage extends RenderPipelineStage {
  run(dt) {
    const {
      debugSubtreeScheduling,
      rendererContext,
      lastSubtreeStats,
      frameMetrics,
      dirtyRectManager
    } = this.pipeline;

    if (!debugSubtreeScheduling || !rendererContext) return;

    const ctx = rendererContext;
    const stats = lastSubtreeStats || {};
    const lines = [
      `subtree work frame: ${stats.frame ?? 0}`,
      `render frame: ${stats.renderFrame ?? 0}`,
      `processed: ${stats.processed ?? 0}`,
      `remaining: ${stats.hasRemaining ? "yes" : "no"}`,
      `measure: ${Number(frameMetrics.measure || 0).toFixed(2)}ms`,
      `layout: ${Number(frameMetrics.layout || 0).toFixed(2)}ms`,
      `update: ${Number(frameMetrics.update || 0).toFixed(2)}ms`,
      `render: ${Number(frameMetrics.render || 0).toFixed(2)}ms`,
      `subtree: ${Number(frameMetrics.subtreeWork || 0).toFixed(2)}ms`
    ];

    const rect = dirtyRectManager?.getDebugOverlayRect?.(ctx);
    if (!rect) return;

    ctx.save();
    ctx.font = "12px monospace";
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.fillStyle = "#93c5fd";
    lines.forEach((line, i) => {
      ctx.fillText(line, rect.x + 6, rect.y + 16 + i * 14);
    });
    ctx.restore();
  }
}