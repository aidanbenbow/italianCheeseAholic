import { Behavior } from "./Behaviour.js";

export class OverlayLayerBehavior extends Behavior {
  measure(node, constraints) {
    return this.measureFillConstraints(constraints);
  }

  layout(node, bounds, ctx) {
    this.layoutAbsoluteChildren(node, bounds, ctx);
  }
}