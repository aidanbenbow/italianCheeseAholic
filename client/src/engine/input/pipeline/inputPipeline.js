// /input/pipeline/InputPipeline.js
export class InputPipeline {
  constructor({ stages = [] } = {}) {
    this.stages = stages;
  }

  setStages(stages) {
    this.stages = stages;
  }

  handle(event) {
    let current = event;
    for (const stage of this.stages) {
      if (!current) break;
      current = stage.process(current);
    }
    return current;
  }
}