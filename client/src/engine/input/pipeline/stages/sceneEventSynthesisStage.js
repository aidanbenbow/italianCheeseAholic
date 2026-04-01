
import { SceneEvent } from "../../sceneEvent.js";
import { InputPipelineStage } from "../inputPipelineStage.js";

export class SceneEventSynthesisStage extends InputPipelineStage {
  constructor(options = {}) {
    super(options);

    this.touchScrollMultiplier = 1.6;
    this.touchScrollFriction = 0.96;
    this.touchScrollMinVelocity = 0.01;

    this.touchState = new Map();
    this.momentumFrame = null;
  }

  process(event) {
    if (event.stage !== "pointer-state") return event;

    if (event.pointerType === "touch" && event.type === "pointerdown") {
      this._cancelMomentum();
      this.touchState.set(event.pointerId, {
        lastTime: performance.now(),
        velocityY: 0,
        scrollTarget: this._findScrollableTarget(event.target),
        x: event.x,
        y: event.y,
      });
    }

    if (event.pointerType === "touch" && event.type === "pointermove") {
      const pointerState = this.touchState.get(event.pointerId) ?? {
        lastTime: performance.now(),
        velocityY: 0,
        scrollTarget: this._findScrollableTarget(event.target),
        x: event.x,
        y: event.y,
      };

      const scrollTarget = this._findScrollableTarget(event.target) ?? pointerState.scrollTarget;
      const deltaY = -event.deltaY * this.touchScrollMultiplier;
      const now = performance.now();
      const dt = Math.max(1, now - pointerState.lastTime);
      const velocity = deltaY / dt;

      pointerState.lastTime = now;
      pointerState.velocityY = pointerState.velocityY * 0.7 + velocity * 0.3;
      pointerState.scrollTarget = scrollTarget;
      pointerState.x = event.x;
      pointerState.y = event.y;
      this.touchState.set(event.pointerId, pointerState);

      if (!scrollTarget || Math.abs(deltaY) < 0.01) {
        return null;
      }

      const sceneEvent = new SceneEvent({
        type: "wheel",
        x: event.x,
        y: event.y,
        target: scrollTarget,
        originalEvent: {
          ...(event.originalEvent ?? {}),
          deltaY,
        },
      });

      return {
        stage: "scene-event",
        sceneEvent,
        pointer: event,
      };
    }

    if (event.pointerType === "touch" && event.type === "pointerup") {
      const pointerState = this.touchState.get(event.pointerId);
      if (pointerState) {
        const momentumTarget = pointerState.scrollTarget;
        const momentumVelocity = pointerState.velocityY;
        const momentumX = pointerState.x ?? event.x;
        const momentumY = pointerState.y ?? event.y;
        this.touchState.delete(event.pointerId);

        if (momentumTarget && Math.abs(momentumVelocity) > this.touchScrollMinVelocity) {
          this._startTouchMomentum({
            target: momentumTarget,
            velocityY: momentumVelocity,
            x: momentumX,
            y: momentumY,
          });
        }
      }
    }

    const sceneEvent = this._toSceneEvent(event);

    return {
      stage: "scene-event",
      sceneEvent,
      pointer: event
    };
  }

  _toSceneEvent(pointerEvent) {
    return new SceneEvent({
      type: this._mapType(pointerEvent),
      x: pointerEvent.x,
      y: pointerEvent.y,
      target: pointerEvent.target,
      originalEvent: pointerEvent.originalEvent
    });
  }

  _mapType(pointerEvent) {
    // pointerdown → "mousedown", etc, or keep pointer semantics
    return pointerEvent.type;
  }

  _findScrollableTarget(node) {
    let current = node;

    while (current) {
      if (current.scroll) {
        return current;
      }
      current = current.parent;
    }

    return null;
  }

  _dispatchSyntheticSceneEvent(sceneEvent) {
    const dispatchStage = this.pipeline?.stages?.find(stage => stage?.dispatcher?.dispatch);
    if (!dispatchStage) return;

    dispatchStage.dispatcher.dispatch(sceneEvent);
    dispatchStage.onDispatch?.(sceneEvent, {
      stage: "scene-event",
      sceneEvent,
      pointer: null,
    });
  }

  _startTouchMomentum({ target, velocityY, x, y }) {
    this._cancelMomentum();

    let velocity = velocityY;
    let lastTime = performance.now();

    const step = () => {
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      lastTime = now;

      const deltaY = velocity * dt;

      if (Math.abs(deltaY) > 0.01) {
        const sceneEvent = new SceneEvent({
          type: "wheel",
          x,
          y,
          target,
          originalEvent: { deltaY },
        });
        this._dispatchSyntheticSceneEvent(sceneEvent);
      }

      velocity *= Math.pow(this.touchScrollFriction, dt / 16);

      if (Math.abs(velocity) <= this.touchScrollMinVelocity) {
        this.momentumFrame = null;
        return;
      }

      this.momentumFrame = requestAnimationFrame(step);
    };

    this.momentumFrame = requestAnimationFrame(step);
  }

  _cancelMomentum() {
    if (this.momentumFrame) {
      cancelAnimationFrame(this.momentumFrame);
      this.momentumFrame = null;
    }
  }

  detach() {
    this._cancelMomentum();
    this.touchState.clear();
  }
}
