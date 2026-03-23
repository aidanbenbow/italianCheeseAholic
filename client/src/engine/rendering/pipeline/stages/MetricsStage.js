// /render/pipeline/stages/MetricsStage.js
import { RenderPipelineStage } from "../RenderPipelineStage.js";

export class MetricsStage extends RenderPipelineStage {
  run(dt) {
    // If you want to aggregate or emit metrics events, do it here.
    // e.g., this.pipeline.engine.emit("render:metrics", this.pipeline.frameMetrics);
  }
}