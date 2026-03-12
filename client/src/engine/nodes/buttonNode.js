import { ButtonBehavior } from "./behaviours/buttonBehaviour.js";
import { SceneNode } from "./sceneNode.js";

export class ButtonNode extends SceneNode {
  constructor({
    id,
    label,
    command = null,
    commandArgs = null,
    visible = true,
    hitTestable = true,
    style = {}
  }) {
    super({
      id,
      visible,
      style,
      behavior: null
    });

    this.label = label;
    this.command = command;
    this.commandArgs = commandArgs;
    this.hitTestable = hitTestable;

    this.state = {
      hovered: false,
      pressed: false,
      disabled: false
    };

    this.behavior = new ButtonBehavior(this);
  }

  onPointerUp() {
    if (this.state.disabled) return;

    if (this.state.pressed && this.command) {
      this.context.engine.commands.execute(this.command, this.commandArgs);
    }

    this.state.pressed = false;
    this.requestRender();
  }
}
