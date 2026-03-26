// /scene/behaviours/InputBehavior.js

import { Behavior } from "./Behaviour.js";
import { TextLayoutCalculator } from "../../utils/textLayoutCalculator.js";
export class InputBehavior extends Behavior {
  measure(node, constraints, ctx) {
    const style = node.style ?? {};
    const font = node.text?.font ?? style.font ?? "14px sans-serif";
    const text = node.text?.value ?? "";

    const maxWidth = Number.isFinite(constraints?.maxWidth) ? constraints.maxWidth : Infinity;
    const maxHeight = Number.isFinite(constraints?.maxHeight) ? constraints.maxHeight : Infinity;

    const intrinsicLayout = TextLayoutCalculator.calculateLayout(text, ctx, Infinity, font);

    const paddingX =
      toFinite(style.paddingLeft, 0) +
      toFinite(style.paddingRight, 0) +
      toFinite(style.paddingX, 0) * 2;

    const paddingY =
      toFinite(style.paddingTop, 0) +
      toFinite(style.paddingBottom, 0) +
      toFinite(style.paddingY, 0) * 2;

    const width = clamp(
      toFinite(style.width, intrinsicLayout.maxLineWidth + paddingX),
      toFinite(style.minWidth, 120),
      maxWidth
    );

    const height = clamp(
      toFinite(style.height, intrinsicLayout.totalHeight + paddingY),
      toFinite(style.minHeight, 34),
      maxHeight
    );

    return { width, height };
  }

  render(node, ctx) {
    const layout = node.layout ?? node.bounds;
    const { x, y, width, height } = layout;
    const style = node.style ?? {};
    const focused = Boolean(node.focused);

    // Background
    ctx.fillStyle = style.background ?? "#111827";
    ctx.fillRect(x, y, width, height);

    // Border
    ctx.lineWidth = style.borderWidth ?? 1;
    ctx.strokeStyle = focused
      ? (style.focusBorderColor ?? "#60A5FA")
      : (style.borderColor ?? "#374151");
    ctx.strokeRect(x, y, width, height);

    // Text
    const text = node.text?.getDisplayValue() ?? "";
    const isPlaceholder = text === node.text.placeholder;

    ctx.font = node.text?.font ?? style.font ?? "14px sans-serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillStyle = isPlaceholder
      ? (style.placeholderColor ?? "#6B7280")
      : (style.color ?? "#F9FAFB");

    const paddingX = layout?.padding?.left ?? (toFinite(style.paddingLeft, 10) + toFinite(style.paddingX, 0));
    const paddingY = layout?.padding?.top ?? (toFinite(style.paddingTop, 0) + toFinite(style.paddingY, 0));

    const contentY = y + paddingY + (height - paddingY * 2) / 2;

    ctx.fillText(text, x + paddingX, contentY);

    // -------------------------------------------------------
    // Calculate and store detailed text layout for overlay renderer
    // -------------------------------------------------------
    const font = node.text?.font ?? style.font ?? "14px sans-serif";
    const contentWidth = Math.max(0, (layout?.contentWidth ?? (width - paddingX * 2)));

    const textLayout = TextLayoutCalculator.calculateLayout(
      node.text?.value ?? "",
      ctx,
      contentWidth,
      font
    );

    node.text?.setLayout?.(textLayout);
  }

  onEvent(node, event) {
    if (!event) return false;

    if (event.type === "pointerdown" || event.type === "mousedown") {
      node.requestFocus?.();
      return false;
    }

    return false;
  }
}

// -------------------------------------------------------
// Utilities
// -------------------------------------------------------

function toFinite(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}