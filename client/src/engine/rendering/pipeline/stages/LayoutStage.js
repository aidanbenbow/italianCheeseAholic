// /render/pipeline/stages/LayoutStage.js
import { RenderPipelineStage } from "../RenderPipelineStage.js";

export class LayoutStage extends RenderPipelineStage {
  run(dt) {
    const { root, nodeScheduler, rendererContext, frameMetrics } = this.pipeline;
    if (!root || !nodeScheduler) return;

    const layoutQueue = nodeScheduler.getLayoutQueue();
    if (!layoutQueue.size) {
      frameMetrics.layout = 0;
      return;
    }

    const start = performance.now();
    // Here you’d:
    // - sort nodes by depth
    // - compute layout bounds
    // - call node.layout()
    // - clear DIRTY_LAYOUT flags
    frameMetrics.layout = performance.now() - start;
  }
}