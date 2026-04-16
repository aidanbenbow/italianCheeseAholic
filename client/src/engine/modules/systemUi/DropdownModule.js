import { SceneNode } from "../../nodes/sceneNode.js";
import { createOverlayBehavior } from "./createOverlayBehavior.js";

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

const dropdownPanelBehavior = {
  measure(node, constraints, ctx) {
    const overlayBehavior = createOverlayBehavior();
    return overlayBehavior.measure(node, constraints, ctx);
  },

  layout(node, bounds, ctx) {
    node.bounds = bounds;
  },

  render(node, ctx) {
    const { x, y, width, height } = node.bounds;
    const style = node.style ?? {};
    const itemHeight = node.itemHeight ?? 34;
    const hoveredIndex = Number.isInteger(node.hoveredIndex) ? node.hoveredIndex : -1;
    const pressedIndex = Number.isInteger(node.pressedIndex) ? node.pressedIndex : -1;

    ctx.save();
    ctx.fillStyle = style.background ?? "#F8FAFC";
    ctx.strokeStyle = style.borderColor ?? "#CBD5E1";
    ctx.lineWidth = style.borderWidth ?? 1;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, style.radius ?? 10);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    for (let index = 0; index < (node.items?.length ?? 0); index += 1) {
      const rowY = y + index * itemHeight;
      const item = node.items[index];
      const itemStyle = {
        font: "14px sans-serif",
        background: "#F8FAFC",
        hoverBackground: "#E2E8F0",
        pressedBackground: "#CBD5E1",
        textColor: "#0F172A",
        ...(item?.style ?? {})
      };

      let rowBackground = itemStyle.background;
      if (pressedIndex === index) {
        rowBackground = itemStyle.pressedBackground;
      } else if (hoveredIndex === index) {
        rowBackground = itemStyle.hoverBackground;
      }

      ctx.save();
      ctx.fillStyle = rowBackground;
      ctx.fillRect(x, rowY, width, itemHeight);

      ctx.font = itemStyle.font;
      ctx.fillStyle = itemStyle.textColor;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(String(item?.label ?? ""), x + 12, rowY + itemHeight / 2);
      ctx.restore();
    }
  },

  onEvent(node, event) {
    if (!event) return false;

    const itemHeight = node.itemHeight ?? 34;
    const bounds = node.bounds ?? { x: 0, y: 0, width: 0, height: 0 };

    const toLocalAxis = (rawValue, start, size) => {
      if (!Number.isFinite(rawValue)) return -1;

      const globalLocal = rawValue - start;
      if (globalLocal >= 0 && globalLocal <= size) {
        return globalLocal;
      }

      if (rawValue >= 0 && rawValue <= size) {
        return rawValue;
      }

      return -1;
    };

    const localY = toLocalAxis(event.y, bounds.y, bounds.height);

    const itemCount = node.items?.length ?? 0;
    const hoveredIndex = localY >= 0
      ? Math.floor(localY / itemHeight)
      : -1;
    const hasItems = itemCount > 0;
    const clampedIndex = hoveredIndex < 0
      ? -1
      : Math.max(0, Math.min(itemCount - 1, hoveredIndex));
    const selectableIndex = clampedIndex >= 0
      ? clampedIndex
      : (Number.isInteger(node.hoveredIndex) ? node.hoveredIndex : -1);
    const inRange = hasItems && selectableIndex >= 0 && selectableIndex < itemCount;

    if (event.type === "pointermove" || event.type === "pointerenter") {
      node.hoveredIndex = inRange ? selectableIndex : -1;
      node.requestRender?.();
      return false;
    }

    if (event.type === "pointerleave") {
      node.hoveredIndex = -1;
      node.pressedIndex = -1;
      node.requestRender?.();
      return false;
    }

    if (event.type === "pointerdown") {
      node.pressedIndex = inRange ? selectableIndex : -1;
      node.requestRender?.();

      if (inRange) {
        node.onSelectIndex?.(selectableIndex);
      }

      return false;
    }

    if (event.type === "pointerup") {
      node.pressedIndex = -1;
      node.requestRender?.();

      return false;
    }

    return false;
  }
};

export class DropdownModule {
  static create(engine) {
    return new DropdownModule(engine);
  }

  constructor(engine) {
    this.engine = engine;
    this.root = new SceneNode({
      id: "dropdown-layer",
      context: engine.context,
      behavior: createOverlayBehavior(),
      style: {
        x: 0,
        y: 0
      }
    });
    this.root.hitTestable = true;
    this.root.hitTest = childOnlyHitTest;

    this.dropdowns = new Map();
  }

  // Show a dropdown menu
  show(id, items, position, options = {}) {
    if (this.dropdowns.has(id)) {
      this.hide(id);
    }

    if (!Array.isArray(items) || items.length === 0) {
      return;
    }

    const itemHeight = options.itemHeight ?? 34;
    const width = options.style?.width ?? 220;
    const height = options.style?.height ?? (items.length * itemHeight);

    const dropdown = new SceneNode({
      id: `dropdown-${id}`,
      context: this.engine.context,
      behavior: dropdownPanelBehavior,
      style: {
        ...position, // x, y from position
        width,
        height,
        background: "#F8FAFC",
        borderColor: "#CBD5E1",
        borderWidth: 1,
        radius: 10,
        ...options.style
      }
    });
    dropdown.items = items;
    dropdown.itemHeight = itemHeight;
    dropdown.hoveredIndex = -1;
    dropdown.pressedIndex = -1;
    dropdown.onSelectIndex = (index) => {
      const selected = items[index];
      selected?.onSelect?.(selected);
      if (options.hideOnSelect !== false) {
        this.hide(id);
      }
    };

    this.dropdowns.set(id, { node: dropdown, items });
    this.root.add(dropdown);
    
    // Only emit if someone is listening
    if (this.engine.eventListeners.get("dropdown:shown")?.size) {
      this.engine.emit("dropdown:shown", { id, items, position });
    }
  }

  // Hide a dropdown
  hide(id) {
    const dropdown = this.dropdowns.get(id);
    if (dropdown) {
      this.root.remove(dropdown.node);
      this.dropdowns.delete(id);
      
      // Only emit if someone is listening
      if (this.engine.eventListeners.get("dropdown:hidden")?.size) {
        this.engine.emit("dropdown:hidden", { id });
      }
    }
  }

  // Hide all dropdowns
  hideAll() {
    for (const id of this.dropdowns.keys()) {
      this.hide(id);
    }
  }

  destroy() {
    for (const { node } of this.dropdowns.values()) {
      this.root.remove(node);
    }
    this.dropdowns.clear();
  }
}
