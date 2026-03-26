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

  onEvent(event) {
    if (!event) return false;

    if (event.type === "pointerenter") {
      this.state.hovered = true;
      this.requestRender();
      return false;
    }

    if (event.type === "pointerleave") {
      this.state.hovered = false;
      this.state.pressed = false;
      this.requestRender();
      return false;
    }

    if (event.type === "pointerdown") {
      if (this.state.disabled) return false;
      this.state.pressed = true;
      this.requestRender();
      return false;
    }

    if (event.type === "pointerup") {
      if (this.state.disabled) return false;

      if (this.state.pressed && this.command) {
        this.context.engine.commands.execute(this.command, this.commandArgs);
      }

      this.state.pressed = false;
      this.requestRender();
      return false;
    }

    return false;
  }
}
