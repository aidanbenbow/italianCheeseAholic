import { Component } from "../nodes/components/component.js";

export class ButtonComponent extends Component {
  constructor({ command, args }) {
    super();
    this.command = command;
    this.args = args;
  }

  onEvent(node, event) {
    if (event?.type !== "pointerup") return false;
    node.context.engine.commands.execute(this.command, this.args);
    return false;
  }
}