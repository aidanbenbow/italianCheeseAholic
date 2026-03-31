import { Behavior } from "./Behaviour.js";

export class OverlayLayerBehavior extends Behavior {
  measure(node, constraints) {
    return {
      width: constraints?.maxWidth ?? 0,
      height: constraints?.maxHeight ?? 0
    };
  }

  layout(node, bounds, ctx) {
    const childConstraints = {
      maxWidth: bounds.width,
      maxHeight: bounds.height
    };

    for (const child of node.children) {
      const measured = child.measure(childConstraints, ctx);
      const width = child.style?.width ?? measured?.width ?? 0;
      const height = child.style?.height ?? measured?.height ?? 0;
      const x = bounds.x + (child.style?.x ?? 0);
      const y = bounds.y + (child.style?.y ?? 0);

      child.applyLayout(
        {
          x,
          y,
          width,
          height
        },
        ctx
      );
    }
  }
}