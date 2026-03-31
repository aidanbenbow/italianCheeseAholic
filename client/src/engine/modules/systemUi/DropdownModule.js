import { SceneNode } from "../../nodes/sceneNode.js";
import { createOverlayBehavior } from "./createOverlayBehavior.js";

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

    this.dropdowns = new Map();
  }

  // Show a dropdown menu
  show(id, items, position, options = {}) {
    if (this.dropdowns.has(id)) {
      console.warn(`Dropdown "${id}" already exists`);
      return;
    }

    const dropdown = new SceneNode({
      id: `dropdown-${id}`,
      context: this.engine.context,
      style: {
        ...position, // x, y from position
        ...options.style
      }
    });

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
    this.dropdowns.clear();
  }
}
