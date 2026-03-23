// /input/core/PointerState.js

import { PointerCapture } from "./pointerCapture.js";


export class PointerState {
  constructor() {
    this.pointers = new Map(); // pointerId → state
    this.lastHoverTarget = null;
    this.capture = new PointerCapture();
  }

  update(event) {
    const { pointerId, type } = event;

    // Ensure pointer entry exists
    if (!this.pointers.has(pointerId)) {
      this.pointers.set(pointerId, {
        id: pointerId,
        isDown: false,
        target: null,
        lastX: event.x,
        lastY: event.y
      });
    }

    const state = this.pointers.get(pointerId);

    // --- Pointer capture overrides hit-testing ---
    const captured = this.capture.get(pointerId);
    if (captured) {
      event.target = captured;
      state.capturedTarget = captured;
    } else {
      state.capturedTarget = null;
    }

    // --- Hover transitions (only when not captured) ---
    if (!captured) {
      this._updateHover(event);
    }

    // --- Pointer down/up state ---
    if (type === "pointerdown") {
      state.isDown = true;
      state.target = event.target;
    }

    if (type === "pointerup") {
      state.isDown = false;
      state.target = null;
      this.capture.release(pointerId);
    }

    // --- Track last position ---
    state.lastX = event.x;
    state.lastY = event.y;

    return state;
  }

  _updateHover(event) {
    const newTarget = event.target;
    const oldTarget = this.lastHoverTarget;

    if (newTarget !== oldTarget) {
      oldTarget?.onPointerLeave?.();
      newTarget?.onPointerEnter?.();
      this.lastHoverTarget = newTarget;
    }
  }

  remove(pointerId) {
    this.pointers.delete(pointerId);
    this.capture.release(pointerId);
  }

  snapshot() {
    return {
      pointers: Array.from(this.pointers.values()),
      captured: this.capture.snapshot(),
      lastHoverTarget: this.lastHoverTarget
    };
  }
}