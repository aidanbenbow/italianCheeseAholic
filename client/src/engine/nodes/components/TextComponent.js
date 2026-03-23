import { Component } from "./component.js";

export class TextComponent extends Component {
  constructor(node, { value = "", placeholder = "", font = "14px sans-serif" } = {}) {
    super();

    this.value = String(value ?? "");
    this.placeholder = String(placeholder ?? "");
    this.font = String(font ?? "14px sans-serif");

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
    this.node?.requestLayout?.();
  }

  // -------------------------------------------------------
  // Placeholder
  // -------------------------------------------------------

  setPlaceholder(nextPlaceholder) {
    const normalized = String(nextPlaceholder ?? "");
    if (normalized === this.placeholder) return;

    this.placeholder = normalized;
    this.node?.requestLayout?.();
  }

  // -------------------------------------------------------
  // Font
  // -------------------------------------------------------

  setFont(nextFont) {
    const normalized = String(nextFont ?? "14px sans-serif");
    if (normalized === this.font) return;

    this.font = normalized;
    this.node?.requestLayout?.();
  }

  // -------------------------------------------------------
  // Display value (used by renderer + editor)
  // -------------------------------------------------------

  getDisplayValue() {
    return this.value.length > 0 ? this.value : this.placeholder;
  }
}