// /engine/modules/text/CaretController.js

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
    const node = this.system.activeNode;
    if (!node || !node._layout) return { x: 0, y: 0 };

    const { lines, lineHeight } = node._layout;
    const caretIndex = this.index;

    ctx.font = node.style.font;

    // Find line containing caret
    let lineIndex = 0;
    let offsetInLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (caretIndex >= line.startIndex && caretIndex <= line.endIndex) {
        lineIndex = i;
        offsetInLine = caretIndex - line.startIndex;
        break;
      }
    }

    const line = lines[lineIndex];
    const beforeText = line.text.slice(0, offsetInLine);

    const x = node._layout.getLineStartX(line, ctx) + ctx.measureText(beforeText).width;
    const y = node._layout.getTextAreaTop() + lineIndex * lineHeight;

    return { x, y };
  }
}