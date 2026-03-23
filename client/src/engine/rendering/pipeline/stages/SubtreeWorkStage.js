// /render/pipeline/stages/SubtreeWorkStage.js
import { RenderPipelineStage } from "../RenderPipelineStage.js";

export class SubtreeWorkStage extends RenderPipelineStage {
  run(dt) {
    const { root, subtreeScheduler, currentFrame, frameMetrics } = this.pipeline;
    if (!root || !subtreeScheduler) return;

    const stats = subtreeScheduler.process(root, currentFrame);
    this.pipeline.lastSubtreeStats = stats;
    frameMetrics.subtreeWork = stats.durationMs || 0;
  }
}