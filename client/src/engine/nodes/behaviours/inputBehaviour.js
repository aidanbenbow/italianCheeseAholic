import { Behavior } from "./Behaviour.js";

export class InputBehavior extends Behavior {
  measure(node, constraints, ctx) {
    const style = node.style ?? {};
    const font = style.font ?? "14px sans-serif";
    const text = String(node.value ?? node.placeholder ?? "");

    const maxWidth = Number.isFinite(constraints?.maxWidth) ? constraints.maxWidth : Infinity;
    const maxHeight = Number.isFinite(constraints?.maxHeight) ? constraints.maxHeight : Infinity;

    const intrinsic = measureText(text, font, ctx);
    const horizontalPadding = toFinite(style.paddingLeft, 0) + toFinite(style.paddingRight, 0) + toFinite(style.paddingX, 0) * 2;
    const verticalPadding = toFinite(style.paddingTop, 0) + toFinite(style.paddingBottom, 0) + toFinite(style.paddingY, 0) * 2;

    const width = clamp(toFinite(style.width, intrinsic.width + horizontalPadding + 24), toFinite(style.minWidth, 120), maxWidth);
    const height = clamp(toFinite(style.height, Math.max(34, intrinsic.height + verticalPadding)), toFinite(style.minHeight, 34), maxHeight);

    return { width, height };
  }

  render(node, ctx) {
    const { x, y, width, height } = node.bounds;
    const style = node.style ?? {};
    const focused = Boolean(node.focused);

    ctx.fillStyle = style.background ?? "#111827";
    ctx.fillRect(x, y, width, height);

    ctx.lineWidth = style.borderWidth ?? 1;
    ctx.strokeStyle = focused
      ? (style.focusBorderColor ?? "#60A5FA")
      : (style.borderColor ?? "#374151");
    ctx.strokeRect(x, y, width, height);

    const contentX = x + toFinite(style.paddingLeft, 10) + toFinite(style.paddingX, 0);
    const contentY = y + toFinite(style.paddingTop, 0) + toFinite(style.paddingY, 0);
    const contentHeight = height - (toFinite(style.paddingTop, 0) + toFinite(style.paddingBottom, 0) + toFinite(style.paddingY, 0) * 2);

    const text = String(node.value ?? "");
    const isEmpty = text.length === 0;

    ctx.font = style.font ?? "14px sans-serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillStyle = isEmpty ? (style.placeholderColor ?? "#6B7280") : (style.color ?? "#F9FAFB");
    ctx.fillText(isEmpty ? String(node.placeholder ?? "") : text, contentX, contentY + contentHeight / 2);
  }

  onPointerDown(node) {
    node.focused = true;
    node.requestRender();
  }

  onPointerLeave(node) {
    if (!node.pressed) return;
    node.pressed = false;
    node.requestRender();
  }

  onPointerUp(node) {
    node.focused = true;

    const promptLabel = node.promptLabel ?? node.placeholder ?? "Enter value";
    const currentValue = String(node.value ?? "");

    if (typeof node.onRequestInput === "function") {
      node.onRequestInput({ node, promptLabel, currentValue });
      return;
    }

    if (typeof window !== "undefined" && typeof window.prompt === "function") {
      const nextValue = window.prompt(promptLabel, currentValue);
      if (nextValue !== null) {
        node.value = nextValue;
        node.requestLayout();
      }
    }

    node.requestRender();
  }
}

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
  const height = (metrics.actualBoundingBoxAscent ?? size * 0.8) + (metrics.actualBoundingBoxDescent ?? size * 0.2);

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
