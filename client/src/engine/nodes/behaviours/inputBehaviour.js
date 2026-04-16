// /scene/behaviours/InputBehavior.js

import { Behavior } from "./Behaviour.js";
import { resolveContentRect, resolvePadding } from "./textBoxHelpers.js";
import { renderBoxBackground, renderBoxBorder } from "./boxRenderHelpers.js";
import { TextLayoutEngine } from "../../modules/text/layout/TextLayoutEngine.js";
export class InputBehavior extends Behavior {
  resolveLineOffsetX(lineWidth, contentWidth, align = "left") {
    if (align === "right" || align === "end") {
      return Math.max(0, contentWidth - lineWidth);
    }

    if (align === "center") {
      return Math.max(0, (contentWidth - lineWidth) / 2);
    }

    return 0;
  }

  measure(node, constraints, ctx) {
    const style = node.style ?? {};
    const font = node.text?.font ?? style.font ?? "14px sans-serif";
    const text = node.text?.value ?? "";
    const autoGrow = node.autoGrow !== false;
    const lineGap = this.toFinite(style.lineGap, 3);
    const padding = resolvePadding(style, this.toFinite.bind(this), {
      left: 10,
      right: 10,
      top: 8,
      bottom: 8
    });

    const { maxWidth, maxHeight } = this.normalizeConstraints(constraints);
    const paddingX = padding.totalX;
    const paddingY = padding.totalY;

    const minWidthResolved = this.resolveDimension(style.minWidth, {
      axis: "width",
      constraints,
      node,
      style,
      fallback: 120
    });
    const maxWidthStyle = this.resolveRawDimension(style.maxWidth, {
      axis: "width",
      constraints,
      node,
      style
    });
    const baseWidth = this.resolveDimension(style.width, {
      axis: "width",
      constraints,
      node,
      style,
      fallback: minWidthResolved
    });
    const widthMax = Number.isFinite(maxWidthStyle) ? Math.min(maxWidth, maxWidthStyle) : maxWidth;

    const width = this.clamp(
      baseWidth,
      minWidthResolved,
      widthMax
    );

    const contentWidth = Math.max(0, width - paddingX);
    const intrinsicLayout = TextLayoutEngine.getLayout({
      cacheTarget: node.text,
      text,
      ctx,
      maxWidth: contentWidth,
      font,
      lineGap,
      lineHeightMode: "advance"
    });
    const totalTextHeight = intrinsicLayout.totalHeight;

    const minHeight = this.resolveDimension(style.minHeight, {
      axis: "height",
      constraints,
      node,
      style,
      fallback: 34
    });
    const maxHeightStyle = this.resolveRawDimension(style.maxHeight, {
      axis: "height",
      constraints,
      node,
      style
    });
    const baseHeight = this.resolveDimension(style.height, {
      axis: "height",
      constraints,
      node,
      style,
      fallback: minHeight
    });
    const contentHeight = Math.max(baseHeight - paddingY, intrinsicLayout.rawLineHeight);
    const dynamicHeight = totalTextHeight + paddingY;
    const heightMax = Number.isFinite(maxHeightStyle) ? Math.min(maxHeight, maxHeightStyle) : maxHeight;

    const height = this.clamp(
      autoGrow ? Math.max(contentHeight + paddingY, dynamicHeight) : baseHeight,
      minHeight,
      heightMax
    );

    return { width, height };
  }

  layout(node, bounds, ctx) {
    const style = node.style ?? {};
    const padding = resolvePadding(style, this.toFinite.bind(this), {
      left: 10,
      right: 10,
      top: 8,
      bottom: 8
    });

    const x = bounds?.x ?? 0;
    const y = bounds?.y ?? 0;
    const width = bounds?.width ?? 0;
    const height = bounds?.height ?? 0;

    if (node.layout) {
      node.layout.contentX = x + padding.left;
      node.layout.contentY = y + padding.top;
      node.layout.contentWidth = Math.max(0, width - padding.totalX);
      node.layout.contentHeight = Math.max(0, height - padding.totalY);
      node.layout.padding = {
        left: padding.left,
        right: padding.right,
        top: padding.top,
        bottom: padding.bottom
      };
    }
  }

  render(node, ctx) {
    const layout = node.layout ?? node.bounds;
    const style = node.style ?? {};
    const focused = Boolean(node.focused);
    const lineGap = this.toFinite(style.lineGap, 3);

    renderBoxBackground(ctx, layout, style, {
      defaultBackground: "#111827",
      alwaysFill: true
    });
    const resolvedBorderWidth = focused
      ? this.toFinite(style.focusBorderWidth, this.toFinite(style.borderWidth, 1))
      : this.toFinite(style.borderWidth, 1);

    renderBoxBorder(ctx, layout, style, {
      borderWidth: resolvedBorderWidth,
      borderColor: focused
        ? (style.focusBorderColor ?? "#60A5FA")
        : (style.borderColor ?? "#374151")
    });

    // Text
    const valueText = String(node.text?.value ?? "");
    const placeholderText = String(node.text?.placeholder ?? "");
    const isPlaceholder = valueText.length === 0;

    ctx.font = node.text?.font ?? style.font ?? "14px sans-serif";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillStyle = isPlaceholder
      ? (style.placeholderColor ?? "#6B7280")
      : (style.color ?? "#F9FAFB");

    const padding = resolvePadding(style, this.toFinite.bind(this), {
      left: 10,
      right: 10,
      top: 8,
      bottom: 8
    });
    const content = resolveContentRect(layout, node.layout, padding);

    const textLayout = TextLayoutEngine.getLayout({
      cacheTarget: node.text,
      text: node.text?.value ?? "",
      ctx,
      maxWidth: content.contentWidth,
      font: ctx.font,
      lineGap,
      lineHeightMode: "advance"
    });

    const renderLayout = isPlaceholder
      ? TextLayoutEngine.getLayout({
        cacheTarget: node.text,
        text: placeholderText,
        ctx,
        maxWidth: content.contentWidth,
        font: ctx.font,
        lineGap,
        lineHeightMode: "advance"
      })
      : textLayout;

    const horizontalAlign = style.textAlign ?? "left";
    const activeTextHeight = textLayout.totalHeight ?? textLayout.lineHeight ?? 0;
    const activeTextOffsetY = Math.max(0, (content.contentHeight - activeTextHeight) / 2);

    if (node.layout) {
      node.layout.textOffsetX = 0;
      node.layout.textOffsetY = activeTextOffsetY;
      node.layout.textAlignMode = horizontalAlign;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(content.contentX, content.contentY, content.contentWidth, content.contentHeight + 2);
    ctx.clip();

    for (let index = 0; index < renderLayout.lines.length; index++) {
      const line = renderLayout.lines[index];
      const lineWidth = line.width ?? 0;
      const lineOffsetX = this.resolveLineOffsetX(lineWidth, content.contentWidth, horizontalAlign);
      const lineX = content.contentX + lineOffsetX;
      const lineY = content.contentY + activeTextOffsetY + index * renderLayout.lineAdvance;
      ctx.fillText(line.text, lineX, lineY);
    }

    ctx.restore();

    // -------------------------------------------------------
    // Calculate and store detailed text layout for overlay renderer
    // -------------------------------------------------------
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
