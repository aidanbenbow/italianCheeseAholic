import { InputPipelineStage } from "../inputPipelineStage.js";

export class SceneEventDispatchStage extends InputPipelineStage {
  constructor({ dispatcher, onDispatch, config } = {}) {
    super({ config });
    this.dispatcher = dispatcher;
    this.onDispatch = onDispatch;
  }

  process(event) {
    if (event.stage !== "scene-event") return event;

    const { sceneEvent } = event;
    this.dispatcher.dispatch(sceneEvent);
    this.onDispatch?.(sceneEvent, event);

    return event;
  }
}
