// /scene/behaviours/InputBehavior.js

import { Behavior } from "./Behaviour.js";
import { TextLayoutCalculator } from "../../utils/textLayoutCalculator.js";
import { resolveContentRect, resolvePadding } from "./textBoxHelpers.js";
import { renderBoxBackground, renderBoxBorder } from "./boxRenderHelpers.js";
export class InputBehavior extends Behavior {
  measure(node, constraints, ctx) {
    const style = node.style ?? {};
    const font = node.text?.font ?? style.font ?? "14px sans-serif";
    const text = node.text?.value ?? "";
    const autoGrow = node.autoGrow !== false;
    const lineGap = this.toFinite(style.lineGap, 2);

    const { maxWidth, maxHeight } = this.normalizeConstraints(constraints);

    const paddingX =
      this.toFinite(style.paddingLeft, 0) +
      this.toFinite(style.paddingRight, 0) +
      this.toFinite(style.paddingX, 0) * 2;

    const paddingY =
      this.toFinite(style.paddingTop, 0) +
      this.toFinite(style.paddingBottom, 0) +
      this.toFinite(style.paddingY, 0) * 2;

    const minWidth = this.toFinite(style.minWidth, 120);
    const baseWidth = this.toFinite(style.width, minWidth);

    const width = this.clamp(
      baseWidth,
      minWidth,
      maxWidth
    );

    const contentWidth = Math.max(0, width - paddingX);
    const intrinsicLayout = TextLayoutCalculator.calculateLayout(text, ctx, contentWidth, font);
    const totalTextHeight = calculateTotalTextHeight(intrinsicLayout, lineGap);

    const minHeight = this.toFinite(style.minHeight, 34);
    const baseHeight = this.toFinite(style.height, minHeight);
    const contentHeight = Math.max(baseHeight - paddingY, intrinsicLayout.lineHeight);
    const dynamicHeight = totalTextHeight + paddingY;

    const height = this.clamp(
      autoGrow ? Math.max(contentHeight + paddingY, dynamicHeight) : baseHeight,
      minHeight,
      maxHeight
    );

    return { width, height };
  }

  render(node, ctx) {
    const layout = node.layout ?? node.bounds;
    const style = node.style ?? {};
    const focused = Boolean(node.focused);
    const lineGap = this.toFinite(style.lineGap, 2);

    renderBoxBackground(ctx, layout, style, {
      defaultBackground: "#111827",
      alwaysFill: true
    });
    renderBoxBorder(ctx, layout, style, {
      borderColor: focused
        ? (style.focusBorderColor ?? "#60A5FA")
        : (style.borderColor ?? "#374151")
    });

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

    const padding = resolvePadding(style, this.toFinite.bind(this), { left: 10 });
    const content = resolveContentRect(layout, node.layout, padding);

    const renderLayout = TextLayoutCalculator.calculateLayout(
      renderText,
      ctx,
      content.contentWidth,
      ctx.font
    );

    ctx.save();
    ctx.beginPath();
    ctx.rect(content.contentX, content.contentY, content.contentWidth, content.contentHeight);
    ctx.clip();

    for (let index = 0; index < renderLayout.lines.length; index++) {
      const line = renderLayout.lines[index];
      const lineY = content.contentY + index * (renderLayout.lineHeight + lineGap);
      ctx.fillText(line.text, content.contentX, lineY);
    }

    ctx.restore();

    // -------------------------------------------------------
    // Calculate and store detailed text layout for overlay renderer
    // -------------------------------------------------------
    const font = node.text?.font ?? style.font ?? "14px sans-serif";
    const textContentWidth = content.contentWidth;

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

function calculateTotalTextHeight(layout, lineGap) {
  const lineCount = layout?.lines?.length ?? 0;
  if (lineCount <= 0) {
    return 0;
  }

  return (layout.lineHeight * lineCount) + (lineGap * Math.max(0, lineCount - 1));
}