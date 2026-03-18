import { SceneNode } from "../nodes/sceneNode.js";

const boxBehavior = {
  measure(node) {
    return {
      width: node.style.width ?? 100,
      height: node.style.height ?? 100
    };
  },
  render(node, ctx) {
    const { x, y, width, height } = node.bounds;
    ctx.fillStyle = node.style.background ?? "#334155";
    ctx.fillRect(x, y, width, height);

    if (node.style.borderColor && (node.style.borderWidth ?? 0) > 0) {
      ctx.lineWidth = node.style.borderWidth ?? 1;
      ctx.strokeStyle = node.style.borderColor;
      ctx.strokeRect(x, y, width, height);
    }
  }
};

const textBehavior = {
  measure(node) {
    return {
      width: node.style.width ?? 180,
      height: node.style.height ?? 24
    };
  },
  render(node, ctx) {
    const { x, y, height } = node.bounds;
    ctx.fillStyle = node.style.color ?? "#FFFFFF";
    ctx.font = node.style.font ?? "14px sans-serif";
    ctx.textAlign = node.style.textAlign ?? "left";
    ctx.textBaseline = node.style.textBaseline ?? "middle";

    const textX = resolveTextX(node);
    const textY = y + height / 2;
    ctx.fillText(node.text ?? "", textX, textY);
  }
};

export function createBoxNode(options = {}) {
  return new SceneNode({
    visible: true,
    ...options,
    behavior: options.behavior ?? boxBehavior,
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
    behavior: options.behavior ?? textBehavior,
    style: {
      color: "#FFFFFF",
      font: "14px sans-serif",
      textAlign: "left",
      textBaseline: "middle",
      ...options.style
    }
  });
}

function resolveTextX(node) {
  const { x, width } = node.bounds;
  const align = node.style.textAlign ?? "left";

  if (align === "center") {
    return x + width / 2;
  }

  if (align === "right" || align === "end") {
    return x + width;
  }

  return x;
}
