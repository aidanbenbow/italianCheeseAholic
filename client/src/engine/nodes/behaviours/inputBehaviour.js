// /scene/behaviours/InputBehavior.js

import { Behavior } from "./Behaviour.js";
import { TextLayoutCalculator } from "../../utils/textLayoutCalculator.js";
export class InputBehavior extends Behavior {
  measure(node, constraints, ctx) {
    const style = node.style ?? {};
    const font = node.text?.font ?? style.font ?? "14px sans-serif";
    const text = node.text?.value ?? "";
    const autoGrow = node.autoGrow !== false;
    const lineGap = toFinite(style.lineGap, 2);

    const maxWidth = Number.isFinite(constraints?.maxWidth) ? constraints.maxWidth : Infinity;
    const maxHeight = Number.isFinite(constraints?.maxHeight) ? constraints.maxHeight : Infinity;

    const paddingX =
      toFinite(style.paddingLeft, 0) +
      toFinite(style.paddingRight, 0) +
      toFinite(style.paddingX, 0) * 2;

    const paddingY =
      toFinite(style.paddingTop, 0) +
      toFinite(style.paddingBottom, 0) +
      toFinite(style.paddingY, 0) * 2;

    const minWidth = toFinite(style.minWidth, 120);
    const baseWidth = toFinite(style.width, minWidth);

    const width = clamp(
      baseWidth,
      minWidth,
      maxWidth
    );

    const contentWidth = Math.max(0, width - paddingX);
    const intrinsicLayout = TextLayoutCalculator.calculateLayout(text, ctx, contentWidth, font);
    const totalTextHeight = calculateTotalTextHeight(intrinsicLayout, lineGap);

    const minHeight = toFinite(style.minHeight, 34);
    const baseHeight = toFinite(style.height, minHeight);
    const contentHeight = Math.max(baseHeight - paddingY, intrinsicLayout.lineHeight);
    const dynamicHeight = totalTextHeight + paddingY;

    const height = clamp(
      autoGrow ? Math.max(contentHeight + paddingY, dynamicHeight) : baseHeight,
      minHeight,
      maxHeight
    );

    return { width, height };
  }

  render(node, ctx) {
    const layout = node.layout ?? node.bounds;
    const { x, y, width, height } = layout;
    const style = node.style ?? {};
    const focused = Boolean(node.focused);
    const lineGap = toFinite(style.lineGap, 2);

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
    const valueText = String(node.text?.value ?? "");
    const placeholderText = String(node.text?.placeholder ?? "");
    const isPlaceholder = valueText.length === 0;
    const renderText = isPlaceholder ? placeholderText : valueText;

    ctx.font = node.text?.font ?? style.font ?? "14px sans-serif";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillStyle = isPlaceholder
      ? (style.placeholderColor ?? "#6B7280")
      : (style.color ?? "#F9FAFB");

    const paddingLeft = layout?.padding?.left ?? (toFinite(style.paddingLeft, 10) + toFinite(style.paddingX, 0));
    const paddingRight = layout?.padding?.right ?? (toFinite(style.paddingRight, 0) + toFinite(style.paddingX, 0));
    const paddingTop = layout?.padding?.top ?? (toFinite(style.paddingTop, 0) + toFinite(style.paddingY, 0));
    const paddingBottom = layout?.padding?.bottom ?? (toFinite(style.paddingBottom, 0) + toFinite(style.paddingY, 0));

    const contentX = layout?.contentX ?? (x + paddingLeft);
    const contentWidth = Math.max(0, layout?.contentWidth ?? (width - paddingLeft - paddingRight));
    const contentHeight = Math.max(0, layout?.contentHeight ?? (height - paddingTop - paddingBottom));

    const contentY = y + paddingTop;

    const renderLayout = TextLayoutCalculator.calculateLayout(
      renderText,
      ctx,
      contentWidth,
      ctx.font
    );

    ctx.save();
    ctx.beginPath();
    ctx.rect(contentX, y + paddingTop, contentWidth, contentHeight);
    ctx.clip();

    for (let index = 0; index < renderLayout.lines.length; index++) {
      const line = renderLayout.lines[index];
      const lineY = contentY + index * (renderLayout.lineHeight + lineGap);
      ctx.fillText(line.text, contentX, lineY);
    }

    ctx.restore();

    // -------------------------------------------------------
    // Calculate and store detailed text layout for overlay renderer
    // -------------------------------------------------------
    const font = node.text?.font ?? style.font ?? "14px sans-serif";
    const textContentWidth = Math.max(0, (layout?.contentWidth ?? (width - paddingLeft - paddingRight)));

    const textLayout = TextLayoutCalculator.calculateLayout(
      node.text?.value ?? "",
      ctx,
      textContentWidth,
      font
    );

    const adjustedTextLayout = {
      ...textLayout,
      lineHeight: textLayout.lineHeight + lineGap,
      totalHeight: calculateTotalTextHeight(textLayout, lineGap)
    };

    node.text?.setLayout?.(adjustedTextLayout);
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

function calculateTotalTextHeight(layout, lineGap) {
  const lineCount = layout?.lines?.length ?? 0;
  if (lineCount <= 0) {
    return 0;
  }

  return (layout.lineHeight * lineCount) + (lineGap * Math.max(0, lineCount - 1));
}