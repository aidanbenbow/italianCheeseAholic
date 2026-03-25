// /input/pipeline/InputPipeline.js
export class InputPipeline {
  constructor({ stages = [] } = {}) {
    this.stages = [];
    this.setStages(stages);
  }

  setStages(stages) {
    const nextStages = Array.isArray(stages) ? stages : [];

    for (const stage of this.stages) {
      if (!stage || nextStages.includes(stage)) continue;
      stage.detach?.();
      stage.destroy?.();
    }

    this.stages = nextStages;

    for (const stage of this.stages) {
      if (!stage) continue;
      stage.pipeline = this;
    }
  }

  handle(event) {
    let current = event;
    for (const stage of this.stages) {
      if (!current) break;
      current = stage.process(current);
    }
    return current;
  }

  debugSnapshot() {
    return this.stages.map((stage, index) => {
      const stageName = stage?.constructor?.name ?? "UnknownStage";
      const configKeys = Object.keys(stage?.config || {});

      return {
        index,
        stage: stageName,
        wiredToInputPipeline: stage?.pipeline === this,
        configKeys,
        dependencies: this._describeStageDependencies(stage)
      };
    });
  }

  _describeStageDependencies(stage) {
    if (!stage) return {};

    const dependencies = {};

    if ("canvas" in stage) {
      dependencies.canvas = stage.canvas
        ? `${stage.canvas.tagName?.toLowerCase() || "unknown"}#${stage.canvas.id || "(no-id)"}`
        : null;
    }

    if ("scenePipeline" in stage) {
      dependencies.scenePipeline = stage.scenePipeline
        ? stage.scenePipeline.constructor?.name || "UnknownPipeline"
        : null;
    }

    if ("hitTest" in stage) {
      dependencies.hitTest = stage.hitTest
        ? stage.hitTest.constructor?.name || "UnknownHitTest"
        : null;
    }

    if ("pointerState" in stage) {
      dependencies.pointerState = stage.pointerState
        ? stage.pointerState.constructor?.name || "UnknownPointerState"
        : null;
    }

    if ("dispatcher" in stage) {
      dependencies.dispatcher = stage.dispatcher
        ? stage.dispatcher.constructor?.name || "UnknownDispatcher"
        : null;
    }

    return dependencies;
  }
}