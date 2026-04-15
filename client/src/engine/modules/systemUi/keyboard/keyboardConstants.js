// Sizing constants shared across KeyboardView and layout helpers

export const KEYBOARD_MARGIN = 12;
export const KEYBOARD_MAX_WIDTH = 760;
export const KEYBOARD_MIN_WIDTH = 320;
export const KEYBOARD_PADDING = 12;
export const KEYBOARD_HEADER_HEIGHT = 26;
export const KEYBOARD_ROW_HEIGHT = 44;
export const KEYBOARD_ROW_GAP = 8;
export const KEYBOARD_KEY_GAP = 8;
export const KEYBOARD_PANEL_HEIGHT =
  (KEYBOARD_PADDING * 2) +
  KEYBOARD_HEADER_HEIGHT +
  (KEYBOARD_ROW_HEIGHT * 5) +
  (KEYBOARD_ROW_GAP * 4);
