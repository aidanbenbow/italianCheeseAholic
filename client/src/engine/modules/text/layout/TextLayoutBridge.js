// /engine/modules/text/layout/TextLayoutBridge.js

/**
 * Bridge between TextModel character indices and scene-space (x, y) coordinates.
 *
 * Both conversions derive their layout data directly from the node
 * (node.layout + node.text.getLayout()), so callers never need to pass raw
 * line arrays or font strings — the node is the single source of truth.
 *
 * Two directions:
 *   indexToPosition(node, index) → { x, y, lineIndex }
 *   positionToIndex(node, sceneX, sceneY) → number
 *
 * ctx is intentionally absent: all character widths are pre-measured during
 * layout computation and stored on each line, so no live canvas state is needed.
 */
export class TextLayoutBridge {
  /**
   * Convert a TextModel character index → scene-space pixel (x, y).
   *
   * @param {object} node  - Active text node
   * @param {number} index - Character index in TextModel
   * @returns {{ x: number, y: number, lineIndex: number }}
   */
  static indexToPosition(node, index) {
    const nodeLayout = node?.layout;
    const textLayout = node?.text?.getLayout?.();

    if (!node || !nodeLayout || !textLayout) {
      return { x: 0, y: 0, lineIndex: 0 };
    }

    const { lines, lineHeight } = textLayout;

    if (!lines || lines.length === 0) {
      return { x: nodeLayout.contentX, y: nodeLayout.contentY, lineIndex: 0 };
    }

    const line = textLayout.getLineForIndex?.(index) ?? lines[lines.length - 1];
    const lineIndex = Math.max(0, lines.indexOf(line));
    const localCaret = textLayout.getCaretPosition?.(index) ?? { x: 0, y: lineIndex * lineHeight };

    return {
      x: nodeLayout.contentX + localCaret.x,
      y: nodeLayout.contentY + localCaret.y,
      lineIndex,
    };
  }

  /**
   * Convert a scene-space pointer (x, y) → nearest TextModel character index.
   *
   * @param {object} node   - Active text node
   * @param {number} sceneX
   * @param {number} sceneY
   * @returns {number} Character index in the TextModel
   */
  static positionToIndex(node, sceneX, sceneY) {
    const nodeLayout = node?.layout;
    const textLayout = node?.text?.getLayout?.();

    if (!node || !nodeLayout || !textLayout) return 0;

    const { lines } = textLayout;

    if (!lines || lines.length === 0) return 0;

    const relativeY = sceneY - nodeLayout.contentY;
    const relativeX = sceneX - nodeLayout.contentX;

    return textLayout.getIndexFromPosition?.(relativeX, relativeY) ?? 0;
  }
}
