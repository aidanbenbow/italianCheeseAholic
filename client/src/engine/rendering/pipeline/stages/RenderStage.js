// /render/pipeline/stages/RenderStage.js
import { RenderPipelineStage } from "../RenderPipelineStage.js";

export class RenderStage extends RenderPipelineStage {
  run(dt) {
    const {
      dirty,
      renderQueue,
      rendererContext,
      renderManager,
      root,
      editor,
      currentDirtyRects,
      frameMetrics
    } = this.pipeline;

    const start = performance.now();

    if (!dirty || !renderQueue.size || !rendererContext || !renderManager) {
      frameMetrics.render = 0;
      return;
    }

    const dirtyRects = currentDirtyRects || [];
    if (!dirtyRects.length) {
      this.pipeline.dirty = false;
      frameMetrics.render = performance.now() - start;
      return;
    }

    for (const rect of dirtyRects) {
      renderManager.clearRect(rendererContext, rect);
      renderManager.renderClipped(rendererContext, rect, () => {
        root?.render(rendererContext);
        editor?.renderOverlay?.(rendererContext);
      });
    }

    for (const node of renderQueue) {
      // clear DIRTY_RENDER flags here
    }

    this.pipeline.dirty = false;
    frameMetrics.render = performance.now() - start;
  }
}