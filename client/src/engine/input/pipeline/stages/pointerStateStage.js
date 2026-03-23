import { InputPipelineStage } from "../inputPipelineStage.js";

// /input/pipeline/stages/PointerStateStage.js

export class PointerStateStage extends InputPipelineStage {
  constructor({ pointerState }) {
    super();
    this.pointerState = pointerState;
  }

  process(event) {
    if (event.stage !== "pointer-normalized") return event;

    // Update pointer state (hover, capture, down/up)
    this.pointerState.update(event);

    return {
      stage: "pointer-state",
      ...event
    };
  }
}
