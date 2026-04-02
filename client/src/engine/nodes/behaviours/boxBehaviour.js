import { Behavior } from "./Behaviour.js";
import { renderBoxBackground, renderBoxBorder } from "./boxRenderHelpers.js";

export class BoxBehavior extends Behavior {
  measure(node, constraints) {
    const style = node.style ?? {};

    const { maxWidth, maxHeight } = this.normalizeConstraints(constraints);

    const minWidth = this.resolveDimension(style.minWidth, {
      axis: "width",
      constraints,
      node,
      style,
      fallback: 0
    });
    const minHeight = this.resolveDimension(style.minHeight, {
      axis: "height",
      constraints,
      node,
      style,
      fallback: 0
    });

    const width = this.clamp(
      this.resolveDimension(style.width, {
        axis: "width",
        constraints,
        node,
        style,
        fallback: 100
      }),
      minWidth,
      maxWidth
    );
    const height = this.clamp(
      this.resolveDimension(style.height, {
        axis: "height",
        constraints,
        node,
        style,
        fallback: 100
      }),
      minHeight,
      maxHeight
    );

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
