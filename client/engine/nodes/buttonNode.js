import { ButtonBehavior } from "./behaviours/buttonBehaviour.js";
import { SceneNode } from "./sceneNode.js";

export class ButtonNode extends SceneNode {
  constructor({ id, label, onClick, onPressStart, onPressEnd, style = {} }) {
    super({
      id,
      style,
      behavior: null
    });

    this.label = label;
    this.state = { hovered: false, pressed: false, disabled: false };
    this.onClick = onClick;
    this.onPressStart = onPressStart;
    this.onPressEnd = onPressEnd;

    this.behavior = new ButtonBehavior(this);
  }

  onPointerEnter() {
    if (this.state.disabled) return;
    this.state.hovered = true;
    this.requestRender();
  }

  onPointerDown() {
    if (this.state.disabled) return;
    this.state.pressed = true;
    this.onPressStart?.();
    this.requestRender();
  }

  onPointerUp() {
    if (this.state.disabled) return;
    if (this.state.pressed) this.onClick?.();
    this.state.pressed = false;
    this.onPressEnd?.();
    this.requestRender();
  }

  onPointerLeave() {
    this.state.hovered = false;
    this.state.pressed = false;
    this.onPressEnd?.();
    this.requestRender();
  }
}
