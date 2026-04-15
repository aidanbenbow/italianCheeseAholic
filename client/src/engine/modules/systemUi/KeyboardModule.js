import { KeyboardController } from "./keyboard/KeyboardController.js";
import { KeyboardView }       from "./keyboard/KeyboardView.js";

/**
 * KeyboardModule — thin engine-module wrapper for the on-screen keyboard.
 *
 * Responsibilities:
 *  - Instantiate KeyboardController and KeyboardView
 *  - Wire their callbacks together
 *  - Expose the public API used by SystemUIModule: root, show(), hide(), destroy()
 */
export class KeyboardModule {
  static create(engine) {
    return new KeyboardModule(engine);
  }

  constructor(engine) {
    this.engine    = engine;
    this.isVisible = false;

    // Controller owns shift state + key-press logic + hardware keyboard bridge
    this.controller = new KeyboardController(engine, {
      onShiftChanged: (isShifted) => {
        this.view.refreshLabels(
          (key) => this.controller.resolveCharKey(key),
          isShifted
        );
      }
    });

    // View owns SceneNode tree + rendering
    this.view = new KeyboardView(engine, {
      onKeyPress:     (keySpec) => this.controller.onKeyPress(keySpec),
      onBackdropDown: () => engine.context.focusManager?.clearFocus?.({
        source: "KeyboardModule.backdrop"
      }),
      getTitle: () => {
        const activeNode = engine.context.textEditor?.activeNode ?? null;
        return activeNode?.placeholder
          ? `Keyboard · ${String(activeNode.placeholder)}`
          : "Keyboard";
      }
    });

    // Expose the root SceneNode so SystemUIModule can add it to the scene graph
    this.root = this.view.root;

    this.controller.mount();

    // Apply initial label state
    this.view.refreshLabels(
      (key) => this.controller.resolveCharKey(key),
      this.controller.isShifted
    );
  }

  // -------------------------------------------------------
  // Public API
  // -------------------------------------------------------

  show() {
    if (this.isVisible) return;

    // Reset shift on every open
    this.controller.isShifted = false;
    this.view.refreshLabels(
      (key) => this.controller.resolveCharKey(key),
      false
    );

    this.isVisible = true;
    this.view.show();
    this.engine.emit("keyboard:shown");
  }

  hide() {
    if (!this.isVisible) return;

    this.controller.isShifted = false;
    this.view.refreshLabels(
      (key) => this.controller.resolveCharKey(key),
      false
    );

    this.isVisible = false;
    this.view.hide();
    this.engine.emit("keyboard:hidden");
  }

  destroy() {
    this.controller.destroy();
    this.view.destroy();
  }
}
