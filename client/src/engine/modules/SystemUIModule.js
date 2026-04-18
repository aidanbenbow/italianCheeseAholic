import { SceneNode } from "../nodes/sceneNode.js";
import { PopupModule } from "./systemUi/PopupModule.js";
import { KeyboardModule } from "./systemUi/KeyboardModule.js";
import { ToastModule } from "./systemUi/ToastModule.js";
import { DropdownModule } from "./systemUi/DropdownModule.js";
import { createOverlayBehavior } from "./systemUi/createOverlayBehavior.js";
import { BaseModule } from "./BaseModule.js";

const debugMarkerBehavior = {
  render(node, ctx) {
    const { x, y, width, height } = node.bounds;
    ctx.save();
    ctx.fillStyle = "rgba(255, 0, 128, 0.9)";
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText("SYSTEM LAYER ACTIVE", x + 12, y + height / 2);
    ctx.restore();
  }
};

function childOnlyHitTest(point) {
  if (!this.visible) return null;

  for (let index = this.children.length - 1; index >= 0; index -= 1) {
    const child = this.children[index];
    const local = child.globalToLocal(point);
    const hit = child.hitTest(local);
    if (hit) return hit;
  }

  return null;
}

export class SystemUIModule extends BaseModule {
  constructor(engine) {
    super(engine);
    this.root = null;
    this._offFocusChanged = null;
    
    // System UI sub-modules
    this.popupLayer = null;
    this.keyboardLayer = null;
    this.toastLayer = null;
    this.dropDownLayer = null;
  }

  contextExports() {
    return {
      systemUI: this
    };
  }

  attach() {
    // Create system UI root node (transparent overlay)
    this.root = new SceneNode({
      id: "system-ui-root",
      context: this.engine.context,
      behavior: createOverlayBehavior(),
      style: {
        x: 0,
        y: 0,
        background: "transparent"
      }
    });
    this.root.hitTestable = true;
    this.root.hitTest = childOnlyHitTest;

    // Initialize sub-modules
    this.popupLayer = PopupModule.create(this.engine);
    this.keyboardLayer = KeyboardModule.create(this.engine);
    this.toastLayer = ToastModule.create(this.engine);
    this.dropDownLayer = DropdownModule.create(this.engine);
    this.popupLayer.root.hitTestable = false;
    this.keyboardLayer.root.hitTestable = false;
    this.toastLayer.root.hitTestable = false;

    // Attach pipeline FIRST so it is listening before children are added
    const systemPipeline = this.engine.renderer?.getPipeline("system");
    if (systemPipeline) {
      systemPipeline.setRoot(this.root);
   

      // Add layers AFTER setRoot so pipeline listeners are active when scheduleLayout fires
      // Order = bottom-to-top: keyboard < dropdown < popup < toast
      // Keep dropdown above keyboard so the full-screen keyboard backdrop
      // does not swallow dropdown hover/click interactions.
      this.root.add(this.keyboardLayer.root);
      this.root.add(this.dropDownLayer.root);
      this.root.add(this.popupLayer.root);
      this.root.add(this.toastLayer.root);

      const debugMarker = new SceneNode({
        id: "system-layer-debug-marker",
        context: this.engine.context,
        behavior: debugMarkerBehavior,
        style: {
          x: 20,
          y: 80,
          width: 260,
          height: 44
        }
      });
      debugMarker.hitTestable = false;
      this.root.add(debugMarker);
      setTimeout(() => {
        this.root?.remove(debugMarker);
      }, 4000);
    } else {
      console.warn("SystemUIModule: Could not get system pipeline from renderer");
    }

    console.log("SystemUIModule attached", this.root);

    this._offFocusChanged = this.engine.on("focus:changed", () => {
      this._syncKeyboardVisibility();
    });

    this._syncKeyboardVisibility();
  }

  detach() {
    this._offFocusChanged?.();
    this._offFocusChanged = null;

    // Stop system pipeline
    const systemPipeline = this.engine.renderer?.getPipeline("system");
    if (systemPipeline) {
      systemPipeline.stop();
    }

    // Clean up sub-modules
    this.popupLayer?.destroy?.();
    this.keyboardLayer?.destroy?.();
    this.toastLayer?.destroy?.();
    this.dropDownLayer?.destroy?.();

    this.root = null;
    console.log("SystemUIModule detached");
  }

  // Public API for system UI services
  getServices() {
    return {
      popups: this.popupLayer,
      keyboard: this.keyboardLayer,
      toasts: this.toastLayer,
      dropdowns: this.dropDownLayer
    };
  }

  _syncKeyboardVisibility() {
    const focusedNode = this.engine.context.focus ?? null;
    const shouldShowKeyboard = Boolean(
      focusedNode &&
      focusedNode.type === "input" &&
      focusedNode.editable !== false
    );

    if (shouldShowKeyboard) {
      this.keyboardLayer?.show?.();
      return;
    }

    this.keyboardLayer?.hide?.();
  }
}
