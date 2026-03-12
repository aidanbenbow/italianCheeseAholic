import { Behavior } from "./Behaviour.js";

export class DefaultBehavior extends Behavior {
  render(node, ctx) {
    const { x, y, width, height } = node.bounds;
    ctx.fillStyle = "magenta";
    ctx.fillRect(x, y, width, height);
  }
}