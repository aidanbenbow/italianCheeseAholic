import { effect } from "./reactive.js";

export function bind(node, fn) {
  if (!node) {
    throw new Error("bind(node, fn): node is required");
  }
  if (typeof fn !== "function") {
    throw new Error("bind(node, fn): fn must be a function");
  }

  const stop = effect(() => {
    fn(node);
  });

  if (typeof node.onDispose === "function") {
    node.onDispose(stop);
  }

  return stop;
}

export function bindProp(node, key, source, options = {}) {
  const { request = "render" } = options;

  return bind(node, (target) => {
    const value = resolveBindingValue(source, target);
    target[key] = value;
    requestNodeWork(target, request, key === "visible");
  });
}

export function bindText(node, source, options = {}) {
  return bindProp(node, "text", source, {
    request: options.request ?? "render"
  });
}

export function bindVisible(node, source, options = {}) {
  return bind(node, (target) => {
    target.visible = Boolean(resolveBindingValue(source, target));
    requestNodeWork(target, options.request ?? "render", true);
  });
}

export function bindStyle(node, source, options = {}) {
  const request = options.request ?? "auto";

  return bind(node, (target) => {
    const nextStyle = resolveBindingValue(source, target) ?? {};

    for (const [key, value] of Object.entries(nextStyle)) {
      target.style[key] = value;
    }

    if (request !== "auto") {
      requestNodeWork(target, request);
    }
  });
}

function resolveBindingValue(source, node) {
  if (typeof source === "function") {
    return source(node);
  }

  if (source && typeof source === "object" && "value" in source) {
    return source.value;
  }

  return source;
}

function requestNodeWork(node, request, forceRender = false) {
  if (!node) return;

  switch (request) {
    case "layout":
      node.requestLayout?.();
      break;
    case "update":
      node.requestUpdate?.();
      break;
    case "render":
      node.requestRender?.();
      break;
    case "auto":
    case "none":
    default:
      if (forceRender) {
        node.requestRender?.();
      }
      break;
  }
}
