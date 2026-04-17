// /input/pipeline/stages/RawInputStage.js

import { InputPipelineStage } from "../inputPipelineStage.js";


// How long (ms) to suppress synthetic mouse events after a real touch event.
const TOUCH_MOUSE_SUPPRESS_MS = 350;

export class RawInputStage extends InputPipelineStage {
  constructor({ canvas, pipeline, config } = {}) {
    super({ pipeline, config });
    this.canvas = canvas;
    this.listeners = [];
    this._lastTouchTime = 0;
    this._bindDomEvents();
  }

  /** Returns true if this mouse event is a browser-synthesized duplicate of a touch. */
  _isSyntheticMouseEvent(domEvent) {
    return (
      domEvent instanceof MouseEvent &&
      Date.now() - this._lastTouchTime < TOUCH_MOUSE_SUPPRESS_MS
    );
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

    // Mouse events — skip if they are synthesized from a preceding touch.
    add("mousedown", event => {
      if (this._isSyntheticMouseEvent(event)) return;
      handler(event, "mousedown");
    });
    add("mousemove", event => {
      if (this._isSyntheticMouseEvent(event)) return;
      handler(event, "mousemove");
    });
    add("mouseup", event => {
      if (this._isSyntheticMouseEvent(event)) return;
      handler(event, "mouseup");
    });
    add("wheel", event => handler(event, "wheel"), { passive: false });

    // Touch events — stamp the timestamp so mouse suppression kicks in.
    add("touchstart", event => {
      this._lastTouchTime = Date.now();
      handler(event, "touchstart");
    }, { passive: false });
    add("touchmove", event => {
      this._lastTouchTime = Date.now();
      handler(event, "touchmove");
    }, { passive: false });
    add("touchend", event => {
      this._lastTouchTime = Date.now();
      handler(event, "touchend");
    });
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