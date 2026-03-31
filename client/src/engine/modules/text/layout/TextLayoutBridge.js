// /engine/modules/text/layout/TextLayoutBridge.js

/**
 * Bridge between TextModel character indices and scene-space (x, y) coordinates.
 *
 * Both conversions derive their layout data directly from the node
 * (node.layout + node.text.getLayout()), so callers never need to pass raw
 * line arrays or font strings — the node is the single source of truth.
 *
 * Two directions:
 *   indexToPosition(node, index, ctx)          → { x, y, lineIndex }
 *   positionToIndex(node, sceneX, sceneY, ctx) → number
 */
export class TextLayoutBridge {
  /**
   * Convert a TextModel character index → scene-space pixel (x, y).
   *
   * The returned y is the top of the line (suitable for drawing a caret from
   * y to y + lineHeight, or for hit-testing).
   *
   * @param {object}                     node   - Active text node
   * @param {number}                     index  - Character index in TextModel
   * @param {CanvasRenderingContext2D}    ctx
   * @returns {{ x: number, y: number, lineIndex: number }}
   */
  static indexToPosition(node, index, ctx) {
    const nodeLayout = node?.layout;
    const textLayout = node?.text?.getLayout?.();

    if (!node || !nodeLayout || !textLayout) {
      return { x: 0, y: 0, lineIndex: 0 };
    }

    const { lines, lineHeight, font } = textLayout;

    if (!lines || lines.length === 0) {
      return { x: nodeLayout.contentX, y: nodeLayout.contentY, lineIndex: 0 };
    }

    ctx.font = font;

    // Find the line that owns this index (fall back to the last line for
    // an index that sits exactly at EOF).
    let lineIndex = lines.length - 1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (index >= line.startIndex && index <= line.endIndex) {
        lineIndex = i;
        break;
      }
    }

    const line      = lines[lineIndex];
    const beforeText = line.text.slice(0, index - line.startIndex);

    return {
      x:         nodeLayout.contentX + ctx.measureText(beforeText).width,
      y:         nodeLayout.contentY + lineIndex * lineHeight,
      lineIndex,
    };
  }

  /**
   * Convert a scene-space pointer (x, y) → nearest TextModel character index.
   *
   * Uses the midpoint heuristic: the caret is placed before a character if
   * the click falls left of the character's horizontal midpoint.
   *
   * @param {object}                     node   - Active text node
   * @param {number}                     sceneX
   * @param {number}                     sceneY
   * @param {CanvasRenderingContext2D}    ctx
   * @returns {number}  Character index in the TextModel
   */
  static positionToIndex(node, sceneX, sceneY, ctx) {
    const nodeLayout = node?.layout;
    const textLayout = node?.text?.getLayout?.();

    if (!node || !nodeLayout || !textLayout) return 0;

    const { lines, lineHeight, font } = textLayout;

    if (!lines || lines.length === 0) return 0;

    ctx.font = font;

    // 1. Which line was clicked?
    const relativeY    = sceneY - nodeLayout.contentY;
    const rawLineIndex = Math.floor(relativeY / lineHeight);
    const lineIndex    = Math.max(0, Math.min(rawLineIndex, lines.length - 1));
    const line         = lines[lineIndex];

    if (!line) return 0;

    // 2. Walk characters left-to-right; stop at the first whose left-edge
    //    midpoint is to the right of clickX.
    const clickX = sceneX - nodeLayout.contentX;
    let caretIndex       = line.startIndex;
    let accumulatedWidth = 0;

    for (let i = 0; i < line.text.length; i++) {
      const charWidth = ctx.measureText(line.text[i]).width;

      if (accumulatedWidth + charWidth / 2 >= clickX) break;

      accumulatedWidth += charWidth;
      caretIndex++;
    }

    return caretIndex;
  }
}
