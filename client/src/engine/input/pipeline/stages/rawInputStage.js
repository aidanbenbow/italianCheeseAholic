// /input/pipeline/stages/RawInputStage.js

import { InputPipelineStage } from "../inputPipelineStage.js";


export class RawInputStage extends InputPipelineStage {
  constructor({ canvas, pipeline, config } = {}) {
    super({ pipeline, config });
    this.canvas = canvas;
    this.listeners = [];
    this._bindDomEvents();
  }

  _bindDomEvents() {
    if (!this.canvas) return;

    const handler = (domEvent, type) => {
      const rawEvent = this._toRawEvent(domEvent, type);
      this.pipeline.handle(rawEvent);
    };

    const add = (type, listener, options) => {
      this.canvas.addEventListener(type, listener, options);
      this.listeners.push({ type, listener, options });
    };

    add("mousedown", event => handler(event, "mousedown"));
    add("mousemove", event => handler(event, "mousemove"));
    add("mouseup", event => handler(event, "mouseup"));
    add("wheel", event => handler(event, "wheel"), { passive: false });

    add("touchstart", event => handler(event, "touchstart"), { passive: false });
    add("touchmove", event => handler(event, "touchmove"), { passive: false });
    add("touchend", event => handler(event, "touchend"));
  }

  _unbindDomEvents() {
    if (!this.canvas || !this.listeners.length) return;

    for (const { type, listener, options } of this.listeners) {
      this.canvas.removeEventListener(type, listener, options);
    }

    this.listeners = [];
  }

  detach() {
    this._unbindDomEvents();
    this.canvas = null;
  }

  destroy() {
    this.detach();
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