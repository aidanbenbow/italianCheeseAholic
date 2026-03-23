import { PointerState } from "../input/core/pointerState.js";
import { InputPipeline } from "../input/pipeline/inputPipeline.js";
import { PointerNormalizationStage } from "../input/pipeline/stages/pointerNormalizationStage.js";
import { PointerStateStage } from "../input/pipeline/stages/pointerStateStage.js";
import { RawInputStage } from "../input/pipeline/stages/rawInputStage.js";
import { SceneEventDispatchStage } from "../input/pipeline/stages/sceneEventDispatchStage.js";
import { SceneEventSynthesisStage } from "../input/pipeline/stages/sceneEventSynthesisStage.js";
import { SceneHitTestSystem } from "../input/sceneHitTestSystem.js";
import { SceneEventDispatcher } from "../input/sceneEventDispatcher.js";
import { BaseModule } from "./BaseModule.js";

export class InputModule extends BaseModule {
  constructor(engine) {
    super(engine);
    this.canvas = null;
    this.scenePipeline = null;

    this.hitTest = new SceneHitTestSystem();
    this.dispatcher = new SceneEventDispatcher();
    this.pointerState = new PointerState();

    this.pipeline = new InputPipeline();
  }

  contextExports() {
    return {
      input: this,
      pointerState: this.pointerState,
      hitTest: this.hitTest,
      eventDispatcher: this.dispatcher
    };
  }

  attach() {
    this.canvas = this.engine.context.canvasManager?.getCanvas?.("main") ?? null;
    this.scenePipeline = this.engine.context.renderPipelines?.main ?? null;

    if (!this.canvas) {
      console.warn("InputModule: main canvas is unavailable; input pipeline was not attached");
      return;
    }

    this._setupStages();
  }

  _setupStages() {
    const raw = new RawInputStage({
      canvas: this.canvas,
      pipeline: this.pipeline
    });

    const normalize = new PointerNormalizationStage({
      canvas: this.canvas,
      scenePipeline: this.scenePipeline,
      hitTest: this.hitTest
    });

    const pointerState = new PointerStateStage({
      pointerState: this.pointerState
    });

    const synth = new SceneEventSynthesisStage();

    const dispatch = new SceneEventDispatchStage({
      dispatcher: this.dispatcher
    });

    this.pipeline.setStages([
      raw,
      normalize,
      pointerState,
      synth,
      dispatch
    ]);
  }

  detach() {
    this.pipeline.setStages([]);
    this.canvas = null;
    this.scenePipeline = null;
  }
}
