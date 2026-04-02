// /engine/modules/text/PointerSelectionController.js

import {
  getCaretIndexFromMousePosition
} from "./layout/CaretHitTestUtil.js";

export class PointerSelectionController {
  constructor(system) {
    this.system = system;

    this.dragging = false;

    // Stash a pointerdown that arrived before activeNode was set (first-click
    // race: InputModule's listener fires first and triggers startEditing, but
    // if ordering ever reverses we replay the event once the node is ready).
    this._pendingDown = null;
  }

  // -------------------------------------------------------
  // Canvas / context helpers
  // -------------------------------------------------------

  _getCanvas() {
    return this.system.engine.context.canvasManager?.getCanvas?.("main") ?? null;
  }

  mount() {
    const canvas = this._getCanvas();
    if (!canvas) return;

    this._down = (e) => this.onPointerDown(e);
    this._move = (e) => this.onPointerMove(e);
    this._up   = (e) => this.onPointerUp(e);

    canvas.addEventListener("pointerdown", this._down);
    window.addEventListener("pointermove", this._move);
    window.addEventListener("pointerup",   this._up);
  }

  destroy() {
    const canvas = this._getCanvas();
    if (canvas) {
      canvas.removeEventListener("pointerdown", this._down);
    }
    window.removeEventListener("pointermove", this._move);
    window.removeEventListener("pointerup",   this._up);
  }

  // Called by TextEditingSystem.startEditing() after activeNode is set.
  // Replays a queued first-click so the caret lands where the user clicked.
  flushPendingDown() {
    if (!this._pendingDown) return;
    const e = this._pendingDown;
    this._pendingDown = null;
    this.onPointerDown(e);
  }

  // -------------------------------------------------------
  // Pointer → caret/selection logic
  // -------------------------------------------------------

  onPointerDown(e) {
    const node = this.system.activeNode;
    if (!node) {
      // activeNode not set yet — stash and wait for startEditing() to flush.
      this._pendingDown = e;
      return;
    }

    const { x, y } = this.getSceneCoords(e);

    const index = getCaretIndexFromMousePosition(node, x, y);

    // Begin selection
    this.system.caret.setIndex(index);
    this.system.selection.begin(index);

    this.dragging = true;
    this.system.invalidate();
  }

  onPointerMove(e) {
    if (!this.dragging) return;

    const node = this.system.activeNode;
    if (!node) return;

    const { x, y } = this.getSceneCoords(e);

    const index = getCaretIndexFromMousePosition(node, x, y);

    // Extend selection
    this.system.selection.extendTo(index);
    this.system.caret.setIndex(index);

    this.system.invalidate();
  }

  onPointerUp() {
    if (!this.dragging) return;

    this.dragging = false;

    // If selection exists, let SelectionMenu decide what to do
    if (this.system.selection.hasRange()) {
      this.system.menu.showForSelection();
    } else {
      const activeNode = this.system.activeNode;
      if (activeNode?.type === "input") {
        this.system.menu.showForInputNode(activeNode);
      } else {
        this.system.menu.hide();
      }
    }

    this.system.invalidate();
  }

  // -------------------------------------------------------
  // Utility: convert pointer event → scene coordinates
  // -------------------------------------------------------

  getSceneCoords(e) {
    const canvas = this._getCanvas();
    if (!canvas) return { x: e.clientX, y: e.clientY };

    const rect = canvas.getBoundingClientRect();
    const logicalWidth = canvas._logicalWidth ?? canvas.width;
    const logicalHeight = canvas._logicalHeight ?? canvas.height;

    const scaleX = logicalWidth / rect.width;
    const scaleY = logicalHeight / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY
    };
  }
}