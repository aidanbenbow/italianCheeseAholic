import { SceneNode } from "../nodes/sceneNode.js";
import { InputNode } from "../nodes/inputNode.js";
import { behaviorRegistry } from "../registries/behaviourReg.js";

export function createBoxNode(options = {}) {
  return new SceneNode({
    visible: true,
    ...options,
    behavior: options.behavior ?? createBehaviorFromRegistry("box"),
    style: {
      background: "#334155",
      ...options.style
    }
  });
}

export function createTextNode(options = {}) {
  return new SceneNode({
    visible: true,
    ...options,
    behavior: options.behavior ?? createBehaviorFromRegistry("text"),
    style: {
      color: "#eee4e4",
      font: "14px sans-serif",
      textAlign: "left",
      textBaseline: "middle",
      ...options.style
    }
  });
}

export function createInputNode(options = {}) {
  const node = new InputNode({
    visible: true,
    ...options,
    style: {
      width: 320,
      height: 40,
      background: "#111827",
      borderColor: "#374151",
      focusBorderColor: "#60A5FA",
      color: "#F9FAFB",
      placeholderColor: "#6B7280",
      font: "14px sans-serif",
      paddingLeft: 10,
      ...options.style
    },
    behavior: options.behavior ?? createBehaviorFromRegistry("input"),
    value: options.value ?? "",
    placeholder: options.placeholder ?? "Enter text",
    promptLabel: options.promptLabel ?? options.placeholder ?? "Enter text",
    onRequestInput: options.onRequestInput
  });

  return node;
}

export function createButtonNode(options = {}) {
  const node = new SceneNode({
    visible: true,
    ...options,
    behavior: options.behavior ?? createBehaviorFromRegistry("button"),
    style: {
      minHeight: 34,
      paddingX: 14,
      paddingY: 8,
      radius: 8,
      font: "13px sans-serif",
      textColor: "#111827",
      background: "#E5E7EB",
      hoverBackground: "#D1D5DB",
      pressedBackground: "#9CA3AF",
      borderColor: "#9CA3AF",
      ...options.style
    }
  });

  node.label = options.label ?? "Button";
  node.state = {
    hovered: false,
    pressed: false,
    disabled: Boolean(options.disabled)
  };

  node.onPointerEnter = () => {
    node.state.hovered = true;
    node.requestRender();
  };

  node.onPointerLeave = () => {
    node.state.hovered = false;
    node.state.pressed = false;
    node.requestRender();
  };

  node.onPointerDown = () => {
    if (node.state.disabled) return;
    node.state.pressed = true;
    node.requestRender();
  };

  node.onPointerUp = () => {
    if (node.state.disabled) return;
    const shouldTrigger = node.state.pressed;
    node.state.pressed = false;
    node.requestRender();
    if (shouldTrigger && typeof options.onPress === "function") {
      options.onPress(node);
    }
  };

  return node;
}

function createBehaviorFromRegistry(type) {
  const BehaviorClass = behaviorRegistry.get(type);
  return new BehaviorClass(null);
}
