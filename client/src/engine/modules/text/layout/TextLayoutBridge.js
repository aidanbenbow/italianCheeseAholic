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
  static _resolveLineOffsetX(lineWidth, contentWidth, align = "left") {
    if (align === "right" || align === "end") {
      return Math.max(0, contentWidth - lineWidth);
    }

    if (align === "center") {
      return Math.max(0, (contentWidth - lineWidth) / 2);
    }

    return 0;
  }

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
    const textOffsetY = Number(nodeLayout?.textOffsetY) || 0;
    const alignMode = nodeLayout?.textAlignMode ?? "left";

    if (!node || !nodeLayout || !textLayout) {
      return { x: 0, y: 0, lineIndex: 0 };
    }

    const { lines, lineHeight } = textLayout;

    if (!lines || lines.length === 0) {
      return {
        x: nodeLayout.contentX,
        y: nodeLayout.contentY + textOffsetY,
        lineIndex: 0
      };
    }

    const line = textLayout.getLineForIndex?.(index) ?? lines[lines.length - 1];
    const lineIndex = Math.max(0, lines.indexOf(line));
    const lineOffsetX = this._resolveLineOffsetX(
      line?.width ?? 0,
      nodeLayout.contentWidth ?? 0,
      alignMode
    );
    const localCaret = textLayout.getCaretPosition?.(index) ?? { x: 0, y: lineIndex * lineHeight };

    return {
      x: nodeLayout.contentX + lineOffsetX + localCaret.x,
      y: nodeLayout.contentY + textOffsetY + localCaret.y,
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

    const { lines, lineHeight } = textLayout;

    if (!lines || lines.length === 0) return 0;

    const textOffsetY = Number(nodeLayout?.textOffsetY) || 0;
    const alignMode = nodeLayout?.textAlignMode ?? "left";

    const relativeY = sceneY - (nodeLayout.contentY + textOffsetY);
    const rawLineIndex = Math.floor(relativeY / Math.max(1, lineHeight || 0));
    const lineIndex = Math.max(0, Math.min(rawLineIndex, lines.length - 1));
    const line = lines[lineIndex];

    if (!line) {
      return lines[lines.length - 1]?.endIndex ?? 0;
    }

    const lineOffsetX = this._resolveLineOffsetX(
      line.width ?? 0,
      nodeLayout.contentWidth ?? 0,
      alignMode
    );
    const relativeX = sceneX - (nodeLayout.contentX + lineOffsetX);

    const charWidths = line.charWidths ?? [];
    let currentX = 0;
    for (let i = 0; i < line.text.length; i++) {
      const width = charWidths[i] ?? 0;
      if (relativeX < currentX + (width / 2)) {
        return line.startIndex + i;
      }
      currentX += width;
    }

    return line.endIndex;
  }
}
