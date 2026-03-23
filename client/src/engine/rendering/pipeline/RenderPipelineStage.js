// /render/pipeline/RenderPipelineStage.js
export class RenderPipelineStage {
  constructor(pipeline) {
    this.pipeline = pipeline;
  }

  run(dt) {
    // override in subclasses
  }
}