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
      height: 44,
      background: "#111827",
      borderColor: "#374151",
      focusBorderColor: "#60A5FA",
      color: "#F9FAFB",
      placeholderColor: "#6B7280",
      font: "14px sans-serif",
      paddingLeft: 10,
      paddingRight: 10,
      ...options.style
    },
    behavior: options.behavior ?? createBehaviorFromRegistry("input"),
    value: options.value ?? "",
    placeholder: options.placeholder ?? "Enter text"
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

  node.command = options.command ?? null;
  node.commandArgs = options.commandArgs ?? null;

  node.state = {
    hovered: false,
    pressed: false,
    disabled: Boolean(options.disabled)
  };

  node.onEvent = (event) => {
    if (!event) return false;

    if (event.type === "pointerenter") {
      node.state.hovered = true;
      node.requestRender();
      return false;
    }

    if (event.type === "pointerleave") {
      node.state.hovered = false;
      node.state.pressed = false;
      node.requestRender();
      return false;
    }

    if (event.type === "pointerdown") {
      if (node.state.disabled) return false;
      node.state.pressed = true;
      node.requestRender();
      return false;
    }

    if (event.type === "pointerup") {
      if (node.state.disabled) return false;
      const shouldTrigger = node.state.pressed;
      node.state.pressed = false;
      node.requestRender();
      if (shouldTrigger) {
         if (node.command) {
          const args = typeof node.commandArgs === "function"
            ? node.commandArgs(node)
            : node.commandArgs;
          node.context.engine.commands.execute(
            node.command,
            args
          );
        } else if(typeof options.onPress === "function") {
        options.onPress(node);
      }
    }
      return false;
    }

    return false;
  };

  return node;
}

function createBehaviorFromRegistry(type) {
  const BehaviorClass = behaviorRegistry.get(type);
  return new BehaviorClass(null);
}

export function createScrollableNode(options = {}) {
  const { spacing = 12, ...rest } = options;
  return new SceneNode({
    visible: true,
    ...rest,
    behavior: new (behaviorRegistry.get("scrollable"))({ spacing }),
    style: {
      ...rest.style
    }
  });
}
