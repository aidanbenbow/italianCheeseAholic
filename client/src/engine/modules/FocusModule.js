import { BaseModule } from "./BaseModule.js";

export class FocusModule extends BaseModule {
  contextExports() {
    return {
      focusManager: this
    };
  }

  setFocus(nextNode, { source = "unknown" } = {}) {
    const context = this.engine.context;
    const previousNode = context.focus ?? null;

    if (previousNode === nextNode) {
      return previousNode;
    }

    if (previousNode) {
      previousNode.focused = false;
      previousNode.requestRender?.();
    }

    context.focus = nextNode ?? null;

    if (nextNode) {
      context.selection = nextNode;
      nextNode.focused = true;
      nextNode.requestRender?.();
    }

    this.engine.emit("focus:changed", {
      source,
      previousId: previousNode?.id ?? null,
      nextId: nextNode?.id ?? null
    });

    return context.focus;
  }

  clearFocus({ source = "unknown" } = {}) {
    this.setFocus(null, { source });
  }

  detach() {
    this.clearFocus({ source: "FocusModule.detach" });
  }
}
