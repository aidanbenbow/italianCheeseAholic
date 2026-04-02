import { roundRect } from "../../utils/roundRect.js";
import { Behavior } from "./Behaviour.js";
import { parseFontSize } from "./textBoxHelpers.js";

export class ButtonBehavior extends Behavior {
  measure(node, constraints, ctx) {
    const label = node.label ?? "";
    const paddingX = node.style.paddingX ?? 12;
    const paddingY = node.style.paddingY ?? 6;

    ctx.save();
    ctx.font = node.style.font || "12px sans-serif";
    const textWidth = ctx.measureText(label).width;
    ctx.restore();

    const { maxWidth, maxHeight } = this.normalizeConstraints(constraints);
    const intrinsicWidth = textWidth + paddingX * 2;
    const intrinsicHeight = paddingY * 2 + parseFontSize(node.style.font || "12px");

    const minWidth = this.resolveDimension(node.style.minWidth, {
      axis: "width",
      constraints,
      node,
      style: node.style,
      fallback: 0
    });
    const minHeight = this.resolveDimension(node.style.minHeight, {
      axis: "height",
      constraints,
      node,
      style: node.style,
      fallback: 30
    });
    const maxStyleWidth = this.resolveRawDimension(node.style.maxWidth, {
      axis: "width",
      constraints,
      node,
      style: node.style
    });
    const maxStyleHeight = this.resolveRawDimension(node.style.maxHeight, {
      axis: "height",
      constraints,
      node,
      style: node.style
    });

    const widthCap = Number.isFinite(maxStyleWidth) ? Math.min(maxWidth, maxStyleWidth) : maxWidth;
    const heightCap = Number.isFinite(maxStyleHeight) ? Math.min(maxHeight, maxStyleHeight) : maxHeight;

    const baseWidth = this.resolveDimension(node.style.width, {
      axis: "width",
      constraints,
      node,
      style: node.style,
      fallback: intrinsicWidth
    });
    const baseHeight = this.resolveDimension(node.style.height, {
      axis: "height",
      constraints,
      node,
      style: node.style,
      fallback: Math.max(minHeight, intrinsicHeight)
    });

    const width = this.clamp(baseWidth, minWidth, widthCap);
    const height = this.clamp(baseHeight, minHeight, heightCap);

    return { width, height };
  }

  layout(node, bounds) {
    node.bounds = bounds;
  }

  render(node, ctx) {
    const { x, y, width, height } = node.bounds;
    const { label, state, style } = node;

    ctx.save();

    let bg = style.background ?? "#f5f5f5";
    if (state.pressed) bg = style.pressedBackground ?? "#dcdcdc";
    else if (state.hovered) bg = style.hoverBackground ?? "#eaeaea";

    ctx.fillStyle = bg;
    roundRect(ctx, x, y, width, height, style.radius);
    ctx.fill();

    ctx.strokeStyle = style.borderColor ?? "#bbb";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = style.font;
    ctx.fillStyle = style.textColor ?? "#222";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + width / 2, y + height / 2);

    ctx.restore();
  }

  hitTest(node, point) {
    return node.containsLocal(point.x, point.y) ? node : null;
  }
}
