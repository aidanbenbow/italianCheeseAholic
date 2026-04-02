import { InputPipelineStage } from "../inputPipelineStage.js";

export class PointerNormalizationStage extends InputPipelineStage {
  constructor({ canvas, scenePipeline, overlayPipeline, hitTest, config } = {}) {
    super({ config });
    this.canvas = canvas;
    this.scenePipeline = scenePipeline;
    this.overlayPipeline = overlayPipeline;
    this.hitTest = hitTest;
    this.lastPointerPositions = new Map();
  }

  process(event) {
    if (event.stage !== "raw") return event;

    const domEvent = event.domEvent;
    const normalized = this._normalize(domEvent, event.type);
    if (!normalized) return null;

    return {
      stage: "pointer-normalized",
      ...normalized,
      originalEvent: domEvent
    };
  }

  _normalize(domEvent, rawType) {
    const sample = this._extractPointerSample(domEvent, rawType);
    if (!sample) return null;

    const canvasPoint = this._toCanvasCoords(sample);
    const scenePoint = this._toSceneCoords(canvasPoint.x, canvasPoint.y);
    const delta = this._computeDelta(sample.pointerId, scenePoint.x, scenePoint.y, sample.deltaX, sample.deltaY);
    const target = this._resolveTarget(scenePoint.x, scenePoint.y);

    this.lastPointerPositions.set(sample.pointerId, { x: scenePoint.x, y: scenePoint.y });

    if (sample.type === "pointerup" || sample.type === "pointercancel") {
      this.lastPointerPositions.delete(sample.pointerId);
    }

    return {
      pointerId: sample.pointerId,
      pointerType: sample.pointerType,
      type: sample.type,
      x: scenePoint.x,
      y: scenePoint.y,
      canvasX: canvasPoint.x,
      canvasY: canvasPoint.y,
      clientX: sample.clientX,
      clientY: sample.clientY,
      deltaX: delta.x,
      deltaY: delta.y,
      target,
      button: sample.button,
      buttons: sample.buttons,
      pressure: sample.pressure,
      rawType
    };
  }

  _extractPointerSample(domEvent, rawType) {
    if (!domEvent) return null;

    if (rawType.startsWith("touch")) {
      const touch = domEvent.changedTouches?.[0] ?? domEvent.touches?.[0];
      if (!touch) return null;

      return {
        pointerId: touch.identifier ?? 0,
        pointerType: "touch",
        type: this._mapRawType(rawType),
        clientX: touch.clientX,
        clientY: touch.clientY,
        deltaX: 0,
        deltaY: 0,
        button: 0,
        buttons: rawType === "touchend" ? 0 : 1,
        pressure: rawType === "touchend" ? 0 : 0.5
      };
    }

    return {
      pointerId: 1,
      pointerType: "mouse",
      type: this._mapRawType(rawType),
      clientX: domEvent.clientX ?? 0,
      clientY: domEvent.clientY ?? 0,
      deltaX: domEvent.deltaX ?? domEvent.movementX ?? 0,
      deltaY: domEvent.deltaY ?? domEvent.movementY ?? 0,
      button: domEvent.button ?? 0,
      buttons: domEvent.buttons ?? 0,
      pressure: domEvent.buttons ? 0.5 : 0
    };
  }

  _mapRawType(rawType) {
    switch (rawType) {
      case "mousedown":
      case "touchstart":
        return "pointerdown";
      case "mousemove":
      case "touchmove":
        return "pointermove";
      case "mouseup":
      case "touchend":
        return "pointerup";
      case "wheel":
        return "wheel";
      default:
        return rawType;
    }
  }

  _toCanvasCoords(sample) {
    const rect = this.canvas?.getBoundingClientRect?.();
    if (!rect || rect.width === 0 || rect.height === 0) {
      return { x: 0, y: 0 };
    }

    const logicalWidth = this.canvas?._logicalWidth ?? this.canvas?.width ?? rect.width;
    const logicalHeight = this.canvas?._logicalHeight ?? this.canvas?.height ?? rect.height;
    const scaleX = logicalWidth / rect.width;
    const scaleY = logicalHeight / rect.height;

    return {
      x: ((sample?.clientX ?? 0) - rect.left) * scaleX,
      y: ((sample?.clientY ?? 0) - rect.top) * scaleY
    };
  }

  _toSceneCoords(canvasX, canvasY) {
    return { x: canvasX, y: canvasY };
  }

  _computeDelta(pointerId, x, y, fallbackDeltaX = 0, fallbackDeltaY = 0) {
    const previous = this.lastPointerPositions.get(pointerId);
    if (!previous) {
      return {
        x: fallbackDeltaX,
        y: fallbackDeltaY
      };
    }

    return {
      x: x - previous.x,
      y: y - previous.y
    };
  }

  _resolveTarget(sceneX, sceneY) {
    if (!this.hitTest?.hitTest) return null;

    const overlayRoot = this.overlayPipeline?.root;
    if (overlayRoot) {
      const overlayTarget = this.hitTest.hitTest(
        overlayRoot,
        sceneX,
        sceneY,
        this.overlayPipeline?.rendererContext
      );

      if (overlayTarget && overlayTarget !== overlayRoot) {
        return overlayTarget;
      }
    }

    const root = this.scenePipeline?.root;
    if (!root) return null;

    return this.hitTest.hitTest(
      root,
      sceneX,
      sceneY,
      this.scenePipeline?.rendererContext
    );
  }
}
