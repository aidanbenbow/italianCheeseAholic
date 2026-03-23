// /input/pipeline/InputPipelineStage.js
export class InputPipelineStage {
  constructor({ pipeline, config } = {}) {
    this.pipeline = pipeline;
    this.config = config || {};
  }

  // event in → event out (or null to stop propagation)
  process(event) {
    return event;
  }
}