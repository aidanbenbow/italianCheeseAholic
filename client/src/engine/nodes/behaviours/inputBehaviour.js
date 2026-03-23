// /scene/behaviours/InputBehavior.js

import { Behavior } from "./Behaviour.js";

export class InputBehavior extends Behavior {
  measure(node, constraints, ctx) {
    const style = node.style ?? {};
    const font = node.text?.font ?? style.font ?? "14px sans-serif";
    const text = node.text?.getDisplayValue() ?? "";

    const maxWidth = Number.isFinite(constraints?.maxWidth) ? constraints.maxWidth : Infinity;
    const maxHeight = Number.isFinite(constraints?.maxHeight) ? constraints.maxHeight : Infinity;

    const intrinsic = measureText(text, font, ctx);

    const paddingX =
      toFinite(style.paddingLeft, 0) +
      toFinite(style.paddingRight, 0) +
      toFinite(style.paddingX, 0) * 2;

    const paddingY =
      toFinite(style.paddingTop, 0) +
      toFinite(style.paddingBottom, 0) +
      toFinite(style.paddingY, 0) * 2;

    const width = clamp(
      toFinite(style.width, intrinsic.width + paddingX),
      toFinite(style.minWidth, 120),
      maxWidth
    );

    const height = clamp(
      toFinite(style.height, intrinsic.height + paddingY),
      toFinite(style.minHeight, 34),
      maxHeight
    );

    return { width, height };
  }

  render(node, ctx) {
    const { x, y, width, height } = node.bounds;
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

    const paddingX =
      toFinite(style.paddingLeft, 10) + toFinite(style.paddingX, 0);

    const paddingY =
      toFinite(style.paddingTop, 0) + toFinite(style.paddingY, 0);

    const contentY = y + paddingY + (height - paddingY * 2) / 2;

    ctx.fillText(text, x + paddingX, contentY);
  }
}

// -------------------------------------------------------
// Utilities
// -------------------------------------------------------

function measureText(text, font, ctx) {
  if (!ctx) {
    const size = parseFontSize(font);
    return { width: text.length * Math.max(6, size * 0.55), height: size * 1.2 };
  }

  ctx.save();
  ctx.font = font;
  const metrics = ctx.measureText(text);
  ctx.restore();

  const size = parseFontSize(font);
  const height =
    (metrics.actualBoundingBoxAscent ?? size * 0.8) +
    (metrics.actualBoundingBoxDescent ?? size * 0.2);

  return { width: metrics.width, height };
}

function parseFontSize(font) {
  const match = String(font).match(/(\d+(?:\.\d+)?)px/);
  return match ? Number(match[1]) : 14;
}

function toFinite(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}