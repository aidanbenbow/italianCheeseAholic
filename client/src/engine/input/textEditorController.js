export class TextEditorController {
  constructor(engine) {
    this.engine = engine;
    this.activeNode = null;
  }

  startEditing(node) {
    if (!node) return;

    this.activeNode = node;

    const promptLabel = node.promptLabel ?? node.getPlaceholder?.() ?? node.placeholder ?? "Enter value";
    const currentValue = String(node.getValue?.() ?? node.value ?? "");

    if (typeof node.onRequestInput === "function") {
      node.onRequestInput({ node, promptLabel, currentValue });
      return;
    }

    if (typeof window !== "undefined" && typeof window.prompt === "function") {
      const nextValue = window.prompt(promptLabel, currentValue);
      if (nextValue !== null) {
        node.setValue?.(nextValue);
        if (!node.setValue) {
          node.value = nextValue;
          node.requestLayout?.();
        }
      }
      node.requestRender?.();
    }
  }

  stopEditing() {
    this.activeNode = null;
  }
}