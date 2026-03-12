import { Component } from "../nodes/components/component.js";

export class ButtonComponent extends Component {
  constructor({ command, args }) {
    super();
    this.command = command;
    this.args = args;
  }

  onPointerUp(node) {
    node.context.engine.commands.execute(this.command, this.args);
  }
}