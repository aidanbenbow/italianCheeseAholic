// /scene/nodes/InputNode.js

import { SceneNode } from "./sceneNode.js";
import { InputBehavior } from "./behaviours/inputBehaviour.js";
import { TextComponent } from "./components/TextComponent.js";

export class InputNode extends SceneNode {
  constructor({
    id,
    context,
    style = {},
    visible = true,
    children = [],
    value = "",
    placeholder = "",
    focusable = true,
    editable = true,
    promptLabel,
    onRequestInput
  } = {}) {
    super({
      id,
      context,
      behavior: new InputBehavior(),
      style,
      visible,
      children
    });

    this.type = "input";
    this.focusable = focusable;
    this.editable = editable;
    this.focused = false;
    this.promptLabel = promptLabel ?? placeholder ?? "Enter text";
    this.onRequestInput = onRequestInput ?? null;

    // Pure text component
    this.text = new TextComponent(this, {
      value,
      placeholder,
      font: this.style.font ?? "14px sans-serif"
    });

    // Expose value/placeholder as properties
    Object.defineProperty(this, "value", {
      get: () => this.text.value,
      set: (v) => this.setValue(v)
    });

    Object.defineProperty(this, "placeholder", {
      get: () => this.text.placeholder,
      set: (p) => this.text.setPlaceholder(p)
    });
  }

  // -------------------------------------------------------
  // Focus
  // -------------------------------------------------------

  requestFocus() {
    const ctx = this.context;

    if (ctx.focus && ctx.focus !== this) {
      ctx.focus.focused = false;
      ctx.focus.requestRender?.();
    }

    ctx.focus = this;
    this.focused = true;
    this.requestRender();
  }

  blur() {
    this.focused = false;

    const editor = this.context.textEditor;
    if (editor?.activeNode === this) {
      editor.stopEditing();
    }

    this.requestRender();
  }

  // -------------------------------------------------------
  // Editing
  // -------------------------------------------------------

  requestEdit() {
    if (!this.editable) return;
    const editor = this.context.textEditor;
    if (editor) {
      editor.startEditing(this);
    } else if (typeof this.onRequestInput === "function") {
      this.onRequestInput({
        currentValue: this.getValue(),
        promptLabel: this.promptLabel,
        node: this
      });
    }
  }

  // -------------------------------------------------------
  // Text API (used by TextEditingSystem)
  // -------------------------------------------------------

  setValue(v) {
    this.text.setValue(v);
    this.requestLayout();
  }

  getValue() {
    return this.text.value;
  }

  getDisplayValue() {
    return this.text.getDisplayValue();
  }

  // -------------------------------------------------------
  // Pointer → editing
  // -------------------------------------------------------

  onPointerDown(evt) {
    this.requestFocus();
    this.requestEdit();
  }
}