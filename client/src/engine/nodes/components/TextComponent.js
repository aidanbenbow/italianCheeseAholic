import { Component } from "./component.js";
import { TextLayoutEngine } from "../../modules/text/layout/TextLayoutEngine.js";

export class TextComponent extends Component {
  constructor(node, { value = "", placeholder = "", font = "14px sans-serif" } = {}) {
    super();

    this.value = String(value ?? "");
    this.placeholder = String(placeholder ?? "");
    this.font = String(font ?? "14px sans-serif");
    this.layout = null;

    if (node) {
      this.attach(node);
    }
  }

  // -------------------------------------------------------
  // Value
  // -------------------------------------------------------

  setValue(nextValue) {
    const normalized = String(nextValue ?? "");
    if (normalized === this.value) return;

    this.value = normalized;
    TextLayoutEngine.invalidate(this);
    this.node?.requestLayout?.();
  }

  // -------------------------------------------------------
  // Placeholder
  // -------------------------------------------------------

  setPlaceholder(nextPlaceholder) {
    const normalized = String(nextPlaceholder ?? "");
    if (normalized === this.placeholder) return;

    this.placeholder = normalized;
    TextLayoutEngine.invalidate(this);
    this.node?.requestLayout?.();
  }

  // -------------------------------------------------------
  // Font
  // -------------------------------------------------------

  setFont(nextFont) {
    const normalized = String(nextFont ?? "14px sans-serif");
    if (normalized === this.font) return;

    this.font = normalized;
    TextLayoutEngine.invalidate(this);
    this.node?.requestLayout?.();
  }

  // -------------------------------------------------------
  // Display value (used by renderer + editor)
  // -------------------------------------------------------

  getDisplayValue() {
    return this.value.length > 0 ? this.value : this.placeholder;
  }

  setLayout(layout) {
    this.layout = layout ?? null;
  }

  getLayout() {
    return this.layout;
  }

  clearLayout() {
    this.layout = null;
  }
}