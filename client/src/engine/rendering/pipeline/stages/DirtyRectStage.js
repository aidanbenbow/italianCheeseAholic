// /render/pipeline/stages/DirtyRectStage.js
import { RenderPipelineStage } from "../RenderPipelineStage.js";

export class DirtyRectStage extends RenderPipelineStage {
  run(dt) {
    const { dirty, renderQueue, dirtyRectManager, rendererContext } = this.pipeline;
    if (!dirty || !renderQueue.size || !dirtyRectManager || !rendererContext) {
      this.pipeline.currentDirtyRects = [];
      return;
    }

    const fullRect = dirtyRectManager.getFullCanvasRect(rendererContext);
    const dirtyRects = this.pipeline.forceFullFrame
      ? (fullRect ? [fullRect] : [])
      : dirtyRectManager.compute(renderQueue, rendererContext);

    this.pipeline.currentDirtyRects = dirtyRects;
  }
}