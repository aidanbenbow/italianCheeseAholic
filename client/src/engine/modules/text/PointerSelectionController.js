// /engine/modules/text/PointerSelectionController.js

import {
  getCaretIndexFromMousePosition
} from "./layout/CaretHitTestUtils.js";

export class PointerSelectionController {
  constructor(system) {
    this.system = system;

    this.dragging = false;
  }

  mount() {
    const canvas = this.system.engine.renderer?.canvas;
    if (!canvas) return;

    this._down = (e) => this.onPointerDown(e);
    this._move = (e) => this.onPointerMove(e);
    this._up = (e) => this.onPointerUp(e);

    canvas.addEventListener("pointerdown", this._down);
    window.addEventListener("pointermove", this._move);
    window.addEventListener("pointerup", this._up);
  }

  destroy() {
    const canvas = this.system.engine.renderer?.canvas;
    if (!canvas) return;

    canvas.removeEventListener("pointerdown", this._down);
    window.removeEventListener("pointermove", this._move);
    window.removeEventListener("pointerup", this._up);
  }

  // -------------------------------------------------------
  // Pointer → caret/selection logic
  // -------------------------------------------------------

  onPointerDown(e) {
    const node = this.system.activeNode;
    if (!node) return;

    const ctx = this.system.engine.renderer?.context;
    if (!ctx) return;

    const { x, y } = this.getSceneCoords(e);

    const index = getCaretIndexFromMousePosition(node, x, y, ctx);

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

    const ctx = this.system.engine.renderer?.context;
    if (!ctx) return;

    const { x, y } = this.getSceneCoords(e);

    const index = getCaretIndexFromMousePosition(node, x, y, ctx);

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
      this.system.menu.hide();
    }

    this.system.invalidate();
  }

  // -------------------------------------------------------
  // Utility: convert pointer event → scene coordinates
  // -------------------------------------------------------

  getSceneCoords(e) {
    const canvas = this.system.engine.renderer?.canvas;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }
}