// /engine/modules/text/OverlayRenderer.js

import { TextLayoutBridge } from "./layout/TextLayoutBridge.js";

export class OverlayRenderer {
  constructor(system) {
    this.system = system;
  }

  resolveLineOffsetX(lineWidth, contentWidth, align = "left") {
    if (align === "right" || align === "end") {
      return Math.max(0, contentWidth - lineWidth);
    }

    if (align === "center") {
      return Math.max(0, (contentWidth - lineWidth) / 2);
    }

    return 0;
  }

  render(ctx) {
    const node = this.system.activeNode;
    const nodeLayout = node?.layout;
    const textLayout = node?.text?.getLayout?.();
    if (!node || !nodeLayout || !textLayout) return;

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
    const nodeLayout = node.layout;
    const textLayout = node.text?.getLayout?.();
    if (!nodeLayout || !textLayout) return;

    const { lines, lineHeight, font } = textLayout;

    ctx.save();
    ctx.font = font;
    ctx.fillStyle = "rgba(0, 120, 215, 0.3)";

    const alignMode = nodeLayout.textAlignMode ?? "left";
    const textOriginY = nodeLayout.contentY + (Number(nodeLayout.textOffsetY) || 0);

    let lineIndex = 0;

    for (const line of lines) {
      const lineSelStart = Math.max(line.startIndex, start);
      const lineSelEnd = Math.min(line.endIndex, end);

      if (lineSelStart < lineSelEnd) {
        const relStart = lineSelStart - line.startIndex;
        const relEnd = lineSelEnd - line.startIndex;

        const before = line.text.slice(0, relStart);
        const selected = line.text.slice(relStart, relEnd);

        const lineStartX = nodeLayout.contentX + this.resolveLineOffsetX(
          line.width ?? 0,
          nodeLayout.contentWidth ?? 0,
          alignMode
        );
        const selX = lineStartX + ctx.measureText(before).width;
        const selY = textOriginY + lineIndex * lineHeight;
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
    const blink = this.system.keyboard.blinkState;

    if (!blink) return;

    const nodeLayout = node.layout;
    const textLayout = node.text?.getLayout?.();
    if (!nodeLayout || !textLayout) return;

    const { lineHeight, font } = textLayout;

    ctx.save();
    ctx.font = font;
    ctx.strokeStyle = node.style?.caretColor || "#000";
    ctx.lineWidth = 2;

    const caretPos = caret.index;

    const { x: caretX, y: caretY } = TextLayoutBridge.indexToPosition(node, caretPos);

    ctx.beginPath();
    ctx.moveTo(caretX, caretY);
    ctx.lineTo(caretX, caretY + lineHeight);
    ctx.stroke();

    ctx.restore();
  }
}
