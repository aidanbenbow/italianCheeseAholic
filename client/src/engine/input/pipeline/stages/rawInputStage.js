// /input/pipeline/stages/RawInputStage.js

import { InputPipelineStage } from "../inputPipelineStage.js";


export class RawInputStage extends InputPipelineStage {
  constructor({ canvas, pipeline, config } = {}) {
    super({ pipeline, config });
    this.canvas = canvas;
    this._bindDomEvents();
  }

  _bindDomEvents() {
    const handler = (domEvent, type) => {
      const rawEvent = this._toRawEvent(domEvent, type);
      this.pipeline.handle(rawEvent);
    };

    this.canvas.addEventListener("mousedown", e => handler(e, "mousedown"));
    this.canvas.addEventListener("mousemove", e => handler(e, "mousemove"));
    this.canvas.addEventListener("mouseup",   e => handler(e, "mouseup"));
    this.canvas.addEventListener("wheel",     e => handler(e, "wheel"), { passive: false });

    this.canvas.addEventListener("touchstart", e => handler(e, "touchstart"), { passive: false });
    this.canvas.addEventListener("touchmove",  e => handler(e, "touchmove"),  { passive: false });
    this.canvas.addEventListener("touchend",   e => handler(e, "touchend"));
  }

  _toRawEvent(domEvent, type) {
    return {
      stage: "raw",
      type,
      domEvent,
      // clientX/clientY may be filled here or in normalization
    };
  }

  // RawInputStage is source-only; process is usually unused
  process(event) {
    return event;
  }
}