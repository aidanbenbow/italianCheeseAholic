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
    this.systemPipeline = this.engine.context.renderPipelines?.system ?? null;

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
      overlayPipeline: this.systemPipeline,
      hitTest: this.hitTest
    });

    const pointerState = new PointerStateStage({
      pointerState: this.pointerState
    });

    const synth = new SceneEventSynthesisStage();

    const dispatch = new SceneEventDispatchStage({
      dispatcher: this.dispatcher,
      onDispatch: sceneEvent => {
        const shouldTraceMove = this.engine.context.debugFlags?.traceInputMoves === true;
        const isMove = sceneEvent?.type === "pointermove";
        if (isMove && !shouldTraceMove) return;

        this.engine.emit("input:scene-event", {
          type: sceneEvent?.type,
          phase: sceneEvent?.phase,
          x: sceneEvent?.x,
          y: sceneEvent?.y,
          targetId: sceneEvent?.target?.id ?? null,
          currentTargetId: sceneEvent?.currentTarget?.id ?? null,
          propagationStopped: Boolean(sceneEvent?.propagationStopped)
        });
      }
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
    this.textEditor?.stopEditing?.();
    this.engine.context.textEditor = null;
    this.engine.context.editor = null;
    this.canvas = null;
    this.scenePipeline = null;
    this.systemPipeline = null;
  }
}
