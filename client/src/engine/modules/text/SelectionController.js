// /engine/modules/text/SelectionController.js

export class SelectionController {
  constructor(system) {
    this.system = system;

    this.start = 0;
    this.end = 0;
    this.anchor = 0;
  }

  clear() {
    this.start = this.end = this.anchor = this.system.caret.index;
  }

  hasRange() {
    return this.start !== this.end;
  }

  getRange() {
    return {
      start: Math.min(this.start, this.end),
      end: Math.max(this.start, this.end)
    };
  }

  collapseTo(pos) {
    this.start = this.end = this.anchor = pos;
  }

  // -------------------------------------------------------
  // Selection modification
  // -------------------------------------------------------

  begin(pos) {
    this.start = this.end = this.anchor = pos;
  }

  extendTo(pos) {
    this.end = pos;
  }

  extendWithShift(pos) {
    if (!this.hasRange()) {
      this.anchor = this.start;
    }
    this.end = pos;
  }

  // -------------------------------------------------------
  // Word selection
  // -------------------------------------------------------

  selectWordAt(pos) {
    const text = this.system.model.getText();
    if (!text) return;

    let start = pos;
    let end = pos;

    const isWS = (c) => /\s/.test(c);

    while (start > 0 && !isWS(text[start - 1])) start--;
    while (end < text.length && !isWS(text[end])) end++;

    this.start = start;
    this.end = end;
    this.anchor = start;
  }
}