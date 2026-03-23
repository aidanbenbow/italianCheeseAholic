import { InputPipelineStage } from "../inputPipelineStage.js";

export class SceneEventDispatchStage extends InputPipelineStage {
  constructor({ dispatcher, config } = {}) {
    super({ config });
    this.dispatcher = dispatcher;
  }

  process(event) {
    if (event.stage !== "scene-event") return event;

    const { sceneEvent } = event;
    this.dispatcher.dispatch(sceneEvent);

    return event;
  }
}
