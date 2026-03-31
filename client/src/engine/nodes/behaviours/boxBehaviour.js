import { Behavior } from "./Behaviour.js";
import { renderBoxBackground, renderBoxBorder } from "./boxRenderHelpers.js";

export class BoxBehavior extends Behavior {
  measure(node, constraints) {
    const style = node.style ?? {};

    const { maxWidth, maxHeight } = this.normalizeConstraints(constraints);

    const width = this.clamp(this.toFinite(style.width, 100), this.toFinite(style.minWidth, 0), maxWidth);
    const height = this.clamp(this.toFinite(style.height, 100), this.toFinite(style.minHeight, 0), maxHeight);

    return {
      width: Number.isFinite(width) ? width : 0,
      height: Number.isFinite(height) ? height : 0
    };
  }

  update(node, dt, ctx) {
    // Box leaf has no autonomous update loop by default.
  }

  render(node, ctx) {
    const style = node.style ?? {};

    renderBoxBackground(ctx, node.bounds, style, {
      defaultBackground: "#334155",
      alwaysFill: true
    });
    renderBoxBorder(ctx, node.bounds, style, { borderColor: style.borderColor });
  }
}
