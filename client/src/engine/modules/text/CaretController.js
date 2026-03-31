// /engine/modules/text/CaretController.js

import { TextLayoutBridge } from "./layout/TextLayoutBridge.js";

export class CaretController {
  constructor(system) {
    this.system = system;

    this.index = 0; // caret index
  }

  setIndex(pos) {
    const text = this.system.model.getText();
    this.index = Math.max(0, Math.min(pos, text.length));
    
  }

  move(offset) {
    this.setIndex(this.index + offset);
  }

  moveToStart() {
    this.setIndex(0);
  }

  moveToEnd() {
    const text = this.system.model.getText();
    this.setIndex(text.length);
  }

  // -------------------------------------------------------
  // Caret → scene coordinates
  // -------------------------------------------------------

  getScenePosition(ctx) {
    return TextLayoutBridge.indexToPosition(
      this.system.activeNode,
      this.index,
      ctx
    );
  }
}