// /engine/modules/text/layout/CaretHitTestUtils.js

import { TextLayoutBridge } from "./TextLayoutBridge.js";

/**
 * Convert a scene-space (x, y) pointer position into a caret index.
 *
 * Thin wrapper around TextLayoutBridge.positionToIndex kept for backward
 * compatibility with PointerSelectionController's import path.
 */
export function getCaretIndexFromMousePosition(node, sceneX, sceneY) {
  return TextLayoutBridge.positionToIndex(node, sceneX, sceneY);
}