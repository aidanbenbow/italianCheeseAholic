import { roundRect } from "../../utils/roundRect.js";
import { Behavior } from "./Behaviour.js";

export class ButtonBehavior extends Behavior {
  measure(node, constraints, ctx) {
    const label = node.label ?? "";
    const paddingX = node.style.paddingX ?? 12;
    const paddingY = node.style.paddingY ?? 6;
    const minHeight = node.style.minHeight ?? 30;

    ctx.save();
    ctx.font = node.style.font || "12px sans-serif";
    const textWidth = ctx.measureText(label).width;
    ctx.restore();

    const width = Math.min(textWidth + paddingX * 2, constraints.maxWidth);
    const height = Math.min(
      Math.max(minHeight, paddingY * 2 + parseInt(node.style.font || "12px", 10)),
      constraints.maxHeight
    );

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
