// /render/pipeline/RenderPipeline.js

import { LayoutStage } from "./stages/LayoutStage.js";
import { UpdateStage } from "./stages/UpdateStage.js";
import { DirtyRectStage } from "./stages/DirtyRectStage.js";
import { RenderStage } from "./stages/RenderStage.js";
import { EditorOverlayStage } from "./stages/EditorOverlayStage.js";
import { MetricsStage } from "./stages/MetricsStage.js";
import { SubtreeSchedule } from "./SubtreeSchedule.js";
import { NodeScheduler } from "../core/NodeScheduler.js";

import { DirtyRectManager } from "../core/DirtyRectManager.js";
import { SubtreeWorkStage } from "./stages/subtreeWorkStage.js";
import { MeasureStage } from "./stages/measureStage.js";

export class RenderPipeline {
  constructor({ renderManager, rendererContext, editor } = {}) {
    this.renderManager = renderManager;
    this.rendererContext = rendererContext;
    this.editor = editor;

    this.root = null;
    this.dirty = true;
    this.forceFullFrame = false;
    this.currentFrame = 0;

    this.constraints = { maxWidth: Infinity, maxHeight: Infinity };
    this.currentConstraints = this.constraints;

    this.frameMetrics = {
      measure: 0,
      layout: 0,
      update: 0,
      render: 0,
      subtreeWork: 0
    };

    this.lastSubtreeStats = null;
    this.debugSubtreeScheduling = true;

    this.nodeScheduler = new NodeScheduler();
    this.subtreeScheduler = new SubtreeSchedule();
    this.dirtyRectManager = new DirtyRectManager();

    this.currentDirtyRects = [];

    this.stages = [
      new SubtreeWorkStage(this),
      new MeasureStage(this),
      new LayoutStage(this),
      new UpdateStage(this),
      new DirtyRectStage(this),
      new RenderStage(this),
      new EditorOverlayStage(this),
      new MetricsStage(this)
    ];
  }

  setRoot(rootNode) {
    this.root = rootNode;
    this.nodeScheduler.attachRoot(rootNode);
    this.forceFullFrame = true;
    this.dirty = true;
  }

  setRendererContext(ctx) {
    this.rendererContext = ctx;
  }

  setEditor(editor) {
    this.editor = editor;
  }

  setConstraints(constraints) {
    this.constraints = constraints;
    this.currentConstraints = constraints;
  }

  tick(dt) {
    if (!this.root) return;

    this.currentFrame += 1;

    for (const stage of this.stages) {
      stage.run(dt);
    }
  }
}