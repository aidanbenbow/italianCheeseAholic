// /render/pipeline/stages/MeasureStage.js
import { RenderPipelineStage } from "../RenderPipelineStage.js";

export class MeasureStage extends RenderPipelineStage {
  run(dt) {
    const { root, nodeScheduler, rendererContext, frameMetrics } = this.pipeline;
    if (!root || !nodeScheduler) return;

    const layoutQueue = nodeScheduler.getLayoutQueue();
    if (!layoutQueue.size) {
      frameMetrics.measure = 0;
      return;
    }

    const start = performance.now();
    // Here you’d:
    // - sort nodes by depth
    // - compute measure constraints
    // - call node.measure()
    // - track measure time
    frameMetrics.measure = performance.now() - start;
  }
}