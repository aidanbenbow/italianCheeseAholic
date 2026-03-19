import { Behavior } from "./Behaviour.js";

export class BoxBehavior extends Behavior {
  measure(node, constraints) {
    const style = node.style ?? {};

    const maxWidth = Number.isFinite(constraints?.maxWidth) ? constraints.maxWidth : Infinity;
    const maxHeight = Number.isFinite(constraints?.maxHeight) ? constraints.maxHeight : Infinity;

    const width = clamp(toFinite(style.width, 100), toFinite(style.minWidth, 0), maxWidth);
    const height = clamp(toFinite(style.height, 100), toFinite(style.minHeight, 0), maxHeight);

    return {
      width: Number.isFinite(width) ? width : 0,
      height: Number.isFinite(height) ? height : 0
    };
  }

  update(node, dt, ctx) {
    // Box leaf has no autonomous update loop by default.
  }

  render(node, ctx) {
    const { x, y, width, height } = node.bounds;
    const style = node.style ?? {};

    ctx.fillStyle = style.background ?? "#334155";
    ctx.fillRect(x, y, width, height);

    if (style.borderColor && (style.borderWidth ?? 0) > 0) {
      ctx.lineWidth = style.borderWidth ?? 1;
      ctx.strokeStyle = style.borderColor;
      ctx.strokeRect(x, y, width, height);
    }
  }
}

function toFinite(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
