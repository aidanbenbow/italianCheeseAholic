import { PointerState } from "../input/core/pointerState.js";
import { InputPipeline } from "../input/pipeline/inputPipeline.js";
import { PointerNormalizationStage } from "../input/pipeline/stages/pointerNormalizationStage.js";
import { PointerStateStage } from "../input/pipeline/stages/pointerStateStage.js";
import { RawInputStage } from "../input/pipeline/stages/rawInputStage.js";
import { SceneEventDispatchStage } from "../input/pipeline/stages/sceneEventDispatchStage.js";
import { SceneEventSynthesisStage } from "../input/pipeline/stages/sceneEventSynthesisStage.js";
import { SceneHitTestSystem } from "../input/sceneHitTestSystem.js";

export class InputModule {
  constructor(engine) {
   this.engine = engine;

    this.canvas = engine.context.canvas;
    this.scenePipeline = engine.renderer.pipeline; // or wherever toSceneCoords lives

    this.hitTest = new SceneHitTestSystem();
    this.dispatcher = new SceneEventDispatchStage();
    this.pointerState = new PointerState();

    this.pipeline = new InputPipeline();

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

  mount() {
    // If needed, attach overlays or editor tools here
  }

  update(dt) {
    // If scroll momentum or gesture plugins need ticking, do it here
  }

  destroy() {
    // Unbind DOM listeners, cleanup
  }
}
