import {
  KEYBOARD_MARGIN,
  KEYBOARD_MAX_WIDTH,
  KEYBOARD_MIN_WIDTH,
  KEYBOARD_PANEL_HEIGHT
} from "./keyboardConstants.js";

// Key specs for each row.
// kind: "char" | "shift" | "backspace" | "space" | "enter" | "done"
// units: relative width (default 1)
export const KEYBOARD_LAYOUT = [
  [
    { kind: "char", key: "1" },
    { kind: "char", key: "2" },
    { kind: "char", key: "3" },
    { kind: "char", key: "4" },
    { kind: "char", key: "5" },
    { kind: "char", key: "6" },
    { kind: "char", key: "7" },
    { kind: "char", key: "8" },
    { kind: "char", key: "9" },
    { kind: "char", key: "0" }
  ],
  [
    { kind: "char", key: "q" },
    { kind: "char", key: "w" },
    { kind: "char", key: "e" },
    { kind: "char", key: "r" },
    { kind: "char", key: "t" },
    { kind: "char", key: "y" },
    { kind: "char", key: "u" },
    { kind: "char", key: "i" },
    { kind: "char", key: "o" },
    { kind: "char", key: "p" }
  ],
  [
    { kind: "char", key: "a" },
    { kind: "char", key: "s" },
    { kind: "char", key: "d" },
    { kind: "char", key: "f" },
    { kind: "char", key: "g" },
    { kind: "char", key: "h" },
    { kind: "char", key: "j" },
    { kind: "char", key: "k" },
    { kind: "char", key: "l" }
  ],
  [
    { kind: "shift",     label: "Shift",     units: 1.5  },
    { kind: "char",      key: "z" },
    { kind: "char",      key: "x" },
    { kind: "char",      key: "c" },
    { kind: "char",      key: "v" },
    { kind: "char",      key: "b" },
    { kind: "char",      key: "n" },
    { kind: "char",      key: "m" },
    { kind: "backspace", label: "⌫", units: 1.75 }
  ],
  [
    { kind: "space", label: "Space", units: 5 },
    { kind: "enter", label: "Enter", units: 2 },
    { kind: "done",  label: "Done",  units: 2 }
  ]
];

/**
 * Compute the absolute bounds of the keyboard panel inside the given
 * container bounds.
 */
export function getKeyboardPanelBounds(bounds) {
  const availableWidth = Math.max(0, (bounds?.width ?? 0) - (KEYBOARD_MARGIN * 2));
  const minWidth = Math.min(KEYBOARD_MIN_WIDTH, availableWidth);
  const width = Math.max(minWidth, Math.min(KEYBOARD_MAX_WIDTH, availableWidth));
  const maxHeight = Math.max(0, (bounds?.height ?? 0) - (KEYBOARD_MARGIN * 2));
  const height = Math.min(KEYBOARD_PANEL_HEIGHT, maxHeight);
  const x = (bounds?.x ?? 0) + Math.max(0, ((bounds?.width ?? 0) - width) / 2);
  const y =
    (bounds?.y ?? 0) +
    Math.max(KEYBOARD_MARGIN, (bounds?.height ?? 0) - height - KEYBOARD_MARGIN);

  return { x, y, width, height };
}
