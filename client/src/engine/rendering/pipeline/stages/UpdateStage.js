// /render/pipeline/stages/UpdateStage.js
import { RenderPipelineStage } from "../RenderPipelineStage.js";

export class UpdateStage extends RenderPipelineStage {
  run(dt) {
    const { root, nodeScheduler, rendererContext, frameMetrics } = this.pipeline;
    if (!root || !nodeScheduler) return;

    const updateQueue = nodeScheduler.getUpdateQueue();
    if (!updateQueue.size) {
      frameMetrics.update = 0;
      return;
    }

    const start = performance.now();
    // Here you’d:
    // - sort nodes by depth
    // - call node.update(dt, rendererContext)
    // - update scrollable nodes
    // - clear DIRTY_UPDATE flags
    frameMetrics.update = performance.now() - start;
  }
}