// /engine/modules/text/layout/CaretHitTestUtils.js

import {
  getTextAreaTop,
  getLineStartX
} from "./TextLayoutUtils.js";

/**
 * Convert a scene-space (x, y) pointer position into a caret index.
 * Pure function: no system, no pipeline, no DOM.
 */
export function getCaretIndexFromMousePosition(node, sceneX, sceneY, ctx) {
  if (!node || !node._layout) return 0;

  const { lines, lineHeight } = node._layout;
  if (!lines || lines.length === 0) return 0;

  ctx.font = node.style.font;

  // -------------------------------------------------------
  // 1. Determine which line was clicked
  // -------------------------------------------------------
  const textTop = getTextAreaTop(node);
  const paddingY = node.style.paddingY || 0;

  const relativeY = sceneY - textTop - paddingY;
  const rawLineIndex = Math.floor(relativeY / lineHeight);

  const lineIndex = Math.max(0, Math.min(rawLineIndex, lines.length - 1));
  const line = lines[lineIndex];

  if (!line) return 0;

  // -------------------------------------------------------
  // 2. Determine X offset within the line
  // -------------------------------------------------------
  const lineStartX = getLineStartX(node, line, ctx);
  const clickX = sceneX - lineStartX;

  // -------------------------------------------------------
  // 3. Determine which character is closest to clickX
  // -------------------------------------------------------
  let caretIndex = line.startIndex;
  let accumulatedWidth = 0;

  for (let i = 0; i < line.text.length; i++) {
    const char = line.text[i];
    const charWidth = ctx.measureText(char).width;

    // If the click is closer to the left half of this char → stop here
    if (accumulatedWidth + charWidth / 2 >= clickX) {
      break;
    }

    accumulatedWidth += charWidth;
    caretIndex++;
  }

  return caretIndex;
}