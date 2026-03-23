// /engine/modules/text/OverlayRenderer.js

import {
  getTextAreaTop,
  getLineStartX
} from "./layout/TextLayoutUtils.js";

export class OverlayRenderer {
  constructor(system) {
    this.system = system;
  }

  render(ctx) {
    const node = this.system.activeNode;
    if (!node || !node._layout) return;

    this.drawSelection(ctx, node);
    this.drawCaret(ctx, node);
  }

  // -------------------------------------------------------
  // Selection highlight
  // -------------------------------------------------------

  drawSelection(ctx, node) {
    const selection = this.system.selection;
    if (!selection.hasRange()) return;

    const { start, end } = selection.getRange();
    const { lines, lineHeight } = node._layout;

    ctx.save();
    ctx.font = node.style.font;
    ctx.fillStyle = "rgba(0, 120, 215, 0.3)";

    const textTop = getTextAreaTop(node);
    const paddingY = node.style.paddingY || 0;

    let lineIndex = 0;

    for (const line of lines) {
      const lineSelStart = Math.max(line.startIndex, start);
      const lineSelEnd = Math.min(line.endIndex, end);

      if (lineSelStart < lineSelEnd) {
        const relStart = lineSelStart - line.startIndex;
        const relEnd = lineSelEnd - line.startIndex;

        const before = line.text.slice(0, relStart);
        const selected = line.text.slice(relStart, relEnd);

        const lineStartX = getLineStartX(node, line, ctx);
        const selX = lineStartX + ctx.measureText(before).width;
        const selY = textTop + paddingY + lineIndex * lineHeight;
        const selWidth = ctx.measureText(selected).width;

        ctx.fillRect(selX, selY, selWidth, lineHeight);
      }

      lineIndex++;
    }

    ctx.restore();
  }

  // -------------------------------------------------------
  // Caret
  // -------------------------------------------------------

  drawCaret(ctx, node) {
    const caret = this.system.caret;
    const blink = this.system.keyboard.blinkState; // or system.blinkState if you prefer

    if (!blink) return;

    const { lines, lineHeight } = node._layout;

    ctx.save();
    ctx.font = node.style.font;
    ctx.strokeStyle = node.style.caretColor || "#000";

    const caretPos = caret.index;
    const textTop = getTextAreaTop(node);
    const paddingY = node.style.paddingY || 0;

    // Find caret line + offset
    let lineIndex = 0;
    let offsetInLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (caretPos >= line.startIndex && caretPos <= line.endIndex) {
        lineIndex = i;
        offsetInLine = caretPos - line.startIndex;
        break;
      }
    }

    const line = lines[lineIndex];
    const beforeText = line.text.slice(0, offsetInLine);

    const caretX =
      getLineStartX(node, line, ctx) + ctx.measureText(beforeText).width;

    const caretY = textTop + paddingY + lineIndex * lineHeight;

    ctx.beginPath();
    ctx.moveTo(caretX, caretY);
    ctx.lineTo(caretX, caretY + lineHeight);
    ctx.stroke();

    ctx.restore();
  }
}