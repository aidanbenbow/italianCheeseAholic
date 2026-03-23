// /engine/modules/text/TextModel.js
export class TextModel {
  constructor() {
    this.text = "";
  }

  setText(newText) {
    this.text = String(newText ?? "");
  }

  getText() {
    return this.text;
  }

  replaceRange(start, end, replacement) {
    const before = this.text.slice(0, start);
    const after = this.text.slice(end);
    this.text = before + replacement + after;

    return {
      newText: this.text,
      newCaret: before.length + replacement.length
    };
  }

  insertAt(index, text) {
    return this.replaceRange(index, index, text);
  }

  deleteBackwardAt(index) {
    if (index === 0) return { newText: this.text, newCaret: 0 };
    return this.replaceRange(index - 1, index, "");
  }
}