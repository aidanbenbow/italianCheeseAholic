// /engine/modules/text/TextEditingSystem.js

import { TextModel } from "./TextModel.js";
import { CaretController } from "./CaretController.js";
import { SelectionController } from "./SelectionController.js";
import { KeyboardInputController } from "./KeyboardInputController.js";
import { PointerSelectionController } from "./PointerSelectionController.js";
import { ClipboardController } from "./ClipboardController.js";
import { OverlayRenderer } from "./OverlayRender.js";
import { SelectionMenu } from "./SelectionMenu.js";
import { PastePrompt } from "./PastePrompt.js";

export class TextEditingSystem {
  constructor(engine) {
    this.engine = engine;
    this._offFocusChanged = null;

    // Active editing state
    this.activeNode = null;

    // Subsystems
    this.model = new TextModel();
    this.caret = new CaretController(this);
    this.selection = new SelectionController(this);
    this.keyboard = new KeyboardInputController(this);
    this.pointer = new PointerSelectionController(this);
    this.clipboard = new ClipboardController(this);
    this.overlay = new OverlayRenderer(this);
    //this.menu = new SelectionMenu(this);
    this.pastePrompt = new PastePrompt(this);
  }

  mount() {
    // Register overlay renderer with interaction layer
    const interactionModule = this.engine.context.interaction;
    if (interactionModule) {
      interactionModule.registerOverlayRenderer((ctx) => {
        this.overlay.render(ctx);
      });
    }

    // Enable global listeners
    this.keyboard.mount();
    this.pointer.mount();
    this.clipboard.mount();
   // this.menu.mount();
    this.pastePrompt.mount();

    this._offFocusChanged = this.engine.on("focus:changed", () => {
      this.syncWithFocus();
    });

    this.syncWithFocus();
  }

  destroy() {
    this._offFocusChanged?.();
    this._offFocusChanged = null;

    this.keyboard.destroy();
    this.pointer.destroy();
    this.clipboard.destroy();
    this.menu.destroy();
    this.pastePrompt.destroy();
  }

  // -------------------------------------------------------
  // Editing lifecycle
  // -------------------------------------------------------

  syncWithFocus() {
    const focusedNode = this.engine.context.focus ?? null;
    const shouldEdit = Boolean(
      focusedNode &&
      focusedNode.type === "input" &&
      focusedNode.editable !== false
    );

    if (shouldEdit) {
      this.startEditing(focusedNode);
      return;
    }

    if (this.activeNode) {
      this.stopEditing();
    }
  }

  startEditing(node) {
    if (!node) return;
    if (this.activeNode === node) {
      this.syncFromNode();
      this.keyboard.enable();
     // this.menu.showForInputNode(node);
      return;
    }

    this.activeNode = node;

    // Sync node text into model (handles external updates / store reloads)
    this.syncFromNode();

    // Reset caret + selection
    this.caret.moveToEnd();
    this.selection.clear();

    // If a pointerdown arrived before activeNode was ready (first-click race),
    // replay it now so the caret lands at the click position rather than end.
    this.pointer.flushPendingDown();

    // Enable keyboard
    this.keyboard.enable();
    //this.menu.showForInputNode(node);

    // Invalidate render
    this.invalidate();
  }

  stopEditing() {
    this.activeNode = null;

    this.keyboard.disable();
    this.menu.hide();
    this.pastePrompt.hide();

    this.invalidate();
  }

  // -------------------------------------------------------
  // Node → model sync
  // -------------------------------------------------------

  syncFromNode() {
    if (!this.activeNode) return;

    const nodeText = this.activeNode.getValue?.() ?? "";
    if (nodeText !== this.model.getText()) {
      this.model.setText(nodeText);
    }
  }

  // -------------------------------------------------------
  // Text updates
  // -------------------------------------------------------

  applyTextChange(newText) {
    if (!this.activeNode) return;

    // Update model
    this.model.setText(newText);

    // Push text into node
    this.activeNode.setValue?.(newText);

    // Re-layout + re-render
    this.activeNode.requestLayout?.();
    this.invalidate();
  }

  replaceSelection(replacement) {
    const { start, end } = this.selection.getRange();
    const { newText, newCaret } = this.model.replaceRange(start, end, replacement);

    this.applyTextChange(newText);

    this.caret.setIndex(newCaret);
    this.selection.collapseTo(newCaret);
  }

  insertText(text) {
    const index = this.caret.index;
    const { newText, newCaret } = this.model.insertAt(index, text);

    this.applyTextChange(newText);

    this.caret.setIndex(newCaret);
    this.selection.collapseTo(newCaret);
  }

  backspace() {
    const index = this.caret.index;

    // If selection exists → delete selection
    if (this.selection.hasRange()) {
      this.replaceSelection("");
      return;
    }

    // Otherwise delete backward
    const { newText, newCaret } = this.model.deleteBackwardAt(index);

    this.applyTextChange(newText);

    this.caret.setIndex(newCaret);
    this.selection.collapseTo(newCaret);
  }

  // -------------------------------------------------------
  // Utility
  // -------------------------------------------------------

  invalidate() {
    // Overlay renders continuously on requestAnimationFrame, no need to invalidate
  }
}