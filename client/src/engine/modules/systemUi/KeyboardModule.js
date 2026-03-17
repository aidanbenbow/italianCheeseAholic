import { SceneNode } from "../../nodes/sceneNode.js";

const fullLayerBehavior = {
  measure(node, constraints) {
    return {
      width: constraints?.maxWidth ?? 0,
      height: constraints?.maxHeight ?? 0
    };
  }
};

export class KeyboardModule {
  static create(engine) {
    return new KeyboardModule(engine);
  }

  constructor(engine) {
    this.engine = engine;
    this.root = new SceneNode({
      id: "keyboard-layer",
      context: engine.context,
      behavior: fullLayerBehavior,
      style: {
        x: 0,
        y: 0
      }
    });

    this.isVisible = false;
    this._bindKeyboardEvents();
  }

  _bindKeyboardEvents() {
    window.addEventListener("keydown", (e) => {
      this.engine.emit("keyboard:keydown", { key: e.key, code: e.code, event: e });
    });

    window.addEventListener("keyup", (e) => {
      this.engine.emit("keyboard:keyup", { key: e.key, code: e.code, event: e });
    });
  }

  show() {
    this.isVisible = true;
    this.root.visible = true;
    this.engine.emit("keyboard:shown");
  }

  hide() {
    this.isVisible = false;
    this.root.visible = false;
    this.engine.emit("keyboard:hidden");
  }

  destroy() {
    // Cleanup keyboard listeners if needed
  }
}
