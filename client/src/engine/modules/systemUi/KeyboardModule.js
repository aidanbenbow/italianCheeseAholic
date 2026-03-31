import { SceneNode } from "../../nodes/sceneNode.js";
import { createOverlayBehavior } from "./createOverlayBehavior.js";

export class KeyboardModule {
  static create(engine) {
    return new KeyboardModule(engine);
  }

  constructor(engine) {
    this.engine = engine;
    this._keydownHandler = null;
    this._keyupHandler = null;
    this.root = new SceneNode({
      id: "keyboard-layer",
      context: engine.context,
      behavior: createOverlayBehavior(),
      style: {
        x: 0,
        y: 0
      }
    });

    this.isVisible = false;
    this._bindKeyboardEvents();
  }

  _bindKeyboardEvents() {
    this._keydownHandler = (e) => {
      this.engine.emit("keyboard:keydown", { key: e.key, code: e.code, event: e });
    };

    this._keyupHandler = (e) => {
      this.engine.emit("keyboard:keyup", { key: e.key, code: e.code, event: e });
    };

    window.addEventListener("keydown", this._keydownHandler);
    window.addEventListener("keyup", this._keyupHandler);
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
    if (this._keydownHandler) {
      window.removeEventListener("keydown", this._keydownHandler);
      this._keydownHandler = null;
    }

    if (this._keyupHandler) {
      window.removeEventListener("keyup", this._keyupHandler);
      this._keyupHandler = null;
    }
  }
}
