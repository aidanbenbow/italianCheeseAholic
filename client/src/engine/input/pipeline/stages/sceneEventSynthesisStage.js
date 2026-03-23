import { SceneEvent } from "../../sceneEvent.js";
import { InputPipelineStage } from "../inputPipelineStage.js";

export class SceneEventSynthesisStage extends InputPipelineStage {
  process(event) {
    if (event.stage !== "pointer-state") return event;

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
}
