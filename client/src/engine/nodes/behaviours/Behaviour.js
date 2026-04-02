// behaviors/Behavior.js
export class Behavior {
  constructor(node) {
    this.node = node;
  }

  toFinite(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  normalizeConstraints(constraints) {
    return {
      maxWidth: Number.isFinite(constraints?.maxWidth) ? constraints.maxWidth : Infinity,
      maxHeight: Number.isFinite(constraints?.maxHeight) ? constraints.maxHeight : Infinity
    };
  }

  measureFillConstraints(constraints) {
    return {
      width: constraints?.maxWidth ?? 0,
      height: constraints?.maxHeight ?? 0
    };
  }

  resolveRawDimension(value, { axis, constraints, node, style }) {
    const resolvedStyle = style ?? node?.style ?? {};

    if (typeof value === "function") {
      return this.resolveRawDimension(
        value({ axis, constraints, node, style: resolvedStyle }),
        { axis, constraints, node, style: resolvedStyle }
      );
    }

    if (typeof value === "number") {
      return Number.isFinite(value) ? value : NaN;
    }

    if (typeof value !== "string") {
      return NaN;
    }

    const input = value.trim().toLowerCase();
    if (!input) return NaN;

    const axisLimit = axis === "width"
      ? Number(constraints?.maxWidth)
      : Number(constraints?.maxHeight);

    if (input.endsWith("%")) {
      const percent = Number(input.slice(0, -1));
      if (!Number.isFinite(percent) || !Number.isFinite(axisLimit)) return NaN;
      return (axisLimit * percent) / 100;
    }

    if (input.endsWith("vw")) {
      const percent = Number(input.slice(0, -2));
      const viewportWidth = Number(constraints?.maxWidth);
      if (!Number.isFinite(percent) || !Number.isFinite(viewportWidth)) return NaN;
      return (viewportWidth * percent) / 100;
    }

    if (input.endsWith("vh")) {
      const percent = Number(input.slice(0, -2));
      const viewportHeight = Number(constraints?.maxHeight);
      if (!Number.isFinite(percent) || !Number.isFinite(viewportHeight)) return NaN;
      return (viewportHeight * percent) / 100;
    }

    const numeric = Number(input);
    return Number.isFinite(numeric) ? numeric : NaN;
  }

  resolveDimension(value, {
    axis,
    constraints,
    node,
    style,
    fallback = 0
  }) {
    let resolved = this.resolveRawDimension(value, { axis, constraints, node, style });

    if (!Number.isFinite(resolved)) {
      resolved = fallback;
    }

    return Math.max(0, resolved);
  }

  layoutAbsoluteChildren(node, bounds, ctx) {
    const childConstraints = {
      maxWidth: bounds.width,
      maxHeight: bounds.height
    };

    for (const child of node.children) {
      const measured = child.measure(childConstraints, ctx);
      const width = child.style?.width ?? measured?.width ?? 0;
      const height = child.style?.height ?? measured?.height ?? 0;
      const x = bounds.x + (child.style?.x ?? 0);
      const y = bounds.y + (child.style?.y ?? 0);

      child.applyLayout(
        {
          x,
          y,
          width,
          height
        },
        ctx
      );
    }
  }

  // --- Layout ---
  measure(node, constraints, ctx) {
    return { width: 0, height: 0 };
  }

  layout(node, bounds, ctx) {
    // default: do nothing
  }

  // --- Update ---
  update(node, dt, ctx) {
    // default: do nothing
  }

  // --- Render ---
  render(node, ctx) {
    // default: do nothing
  }

  // --- Hit testing ---
  hitTest(node, point) {
    return node.containsLocal(point.x, point.y) ? node : null;
  }

  // --- Optional event propagation ---
  onEvent(node, event) {
    return false;
  }

  onEventCapture(node, event) {
    return false;
  }

  onEventBubble(node, event) {
    return false;
  }
}