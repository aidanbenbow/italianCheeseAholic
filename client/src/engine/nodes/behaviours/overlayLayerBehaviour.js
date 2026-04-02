import { Behavior } from "./Behaviour.js";

export class OverlayLayerBehavior extends Behavior {
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

    const maxStyleWidth = this.resolveRawDimension(style.maxWidth, {
      axis: "width",
      constraints,
      node,
      style
    });
    const maxStyleHeight = this.resolveRawDimension(style.maxHeight, {
      axis: "height",
      constraints,
      node,
      style
    });

    const widthCap = Number.isFinite(maxStyleWidth) ? Math.min(maxWidth, maxStyleWidth) : maxWidth;
    const heightCap = Number.isFinite(maxStyleHeight) ? Math.min(maxHeight, maxStyleHeight) : maxHeight;

    const preferredWidth = this.resolveDimension(style.width, {
      axis: "width",
      constraints,
      node,
      style,
      fallback: maxWidth
    });
    const preferredHeight = this.resolveDimension(style.height, {
      axis: "height",
      constraints,
      node,
      style,
      fallback: maxHeight
    });

    return {
      width: this.clamp(preferredWidth, minWidth, widthCap),
      height: this.clamp(preferredHeight, minHeight, heightCap)
    };
  }

  layout(node, bounds, ctx) {
    this.layoutAbsoluteChildren(node, bounds, ctx);
  }
}