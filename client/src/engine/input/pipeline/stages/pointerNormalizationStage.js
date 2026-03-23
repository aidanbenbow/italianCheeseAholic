import { InputPipelineStage } from "../inputPipelineStage.js";

export class PointerNormalizationStage extends InputPipelineStage {
  constructor({ canvas, scenePipeline, hitTest, config } = {}) {
    super({ pipeline: scenePipeline, config });
    this.canvas = canvas;
    this.hitTest = hitTest;
  }

  process(event) {
    if (event.stage !== "raw") return event;

    const domEvent = event.domEvent;
    const normalized = this._normalize(domEvent, event.type);

    return {
      stage: "pointer-normalized",
      ...normalized,
      originalEvent: domEvent
    };
  }

  _normalize(domEvent, rawType) {
    // map mouse/touch → pointer
    // compute clientX/clientY
    // convert to canvas coords
    // convert to scene coords
    // perform hit-test once
    return {
      pointerId: 1,
      pointerType: "mouse",
      type: "pointermove", // etc
      x: 0,
      y: 0,
      deltaX: 0,
      deltaY: 0,
      target: null
    };
  }
}
