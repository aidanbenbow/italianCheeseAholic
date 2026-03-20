import { bind, bindProp, bindStyle, bindText, bindVisible } from "../core/bind.js";
import { createBoxNode, createButtonNode, createInputNode, createTextNode } from "../core/primitives.js";
import { batch, computed, effect, signal } from "../core/reactive.js";
import { behaviorRegistry } from "../registries/behaviourReg.js";

import { SceneNode } from "../nodes/sceneNode.js";

const UI_ROOT_VERTICAL_SPACING = 12;

export class UIModule {
  constructor(engine) {
    this.engine = engine;
    this.signal = signal;
    this.effect = effect;
    this.computed = computed;
    this.batch = batch;
  }

  attach() {
    const RootBehaviorClass = behaviorRegistry.get("vertical");
    const rootBehavior = new RootBehaviorClass(null);
    if ("spacing" in rootBehavior) {
      rootBehavior.spacing = UI_ROOT_VERTICAL_SPACING;
    }

    // Create root SceneNode
    const root = new SceneNode({
      id: "root",
      context: this.engine.context,
      behavior: rootBehavior,
      style: { x: 0, y: 0 }
    });

    // Give it to SceneGraphModule
    this.engine.sceneGraph.setRoot(root);
    this.rootNode = root;
    console.log("UIModule attached, root node created:", root);
  }

  createNode(options = {}) {
    return new SceneNode({
      context: this.engine.context,
      ...options
    });
  }

  createBoxNode(options = {}) {
    return createBoxNode({
      context: this.engine.context,
      ...options
    });
  }

  createTextNode(options = {}) {
    return createTextNode({
      context: this.engine.context,
      ...options
    });
  }

  createInputNode(options = {}) {
    return createInputNode({
      context: this.engine.context,
      ...options
    });
  }

  createButtonNode(options = {}) {
    return createButtonNode({
      context: this.engine.context,
      ...options
    });
  }

  mountNode(node, parent = this.rootNode) {
    if (!parent) {
      throw new Error("UIModule.mountNode: root node is not attached");
    }
    parent.add(node);
    return node;
  }

  unmountNode(node) {
    node?.parent?.remove(node);
  }

  bind(node, fn) {
    return bind(node, fn);
  }

  bindProp(node, key, source, options) {
    return bindProp(node, key, source, options);
  }

  bindText(node, source, options) {
    return bindText(node, source, options);
  }

  bindVisible(node, source, options) {
    return bindVisible(node, source, options);
  }

  bindStyle(node, source, options) {
    return bindStyle(node, source, options);
  }

  registerBehaviour(type, BehaviourClass) {
    behaviorRegistry.register(type, BehaviourClass);
  }

  render() {
    console.warn("UIModule.render(vnode) is deprecated. Use reactive bindings with SceneNodes instead.");
  }

  destroy() {
    this.rootNode?.disposeSubtree?.();
    this.rootNode = null;
  }
}
