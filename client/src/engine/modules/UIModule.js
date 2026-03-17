import { Reconciler } from "../core/reconciler.js";
import { NodeFactory } from "../core/NodeFactory.js";

import { SceneNode } from "../nodes/sceneNode.js";

const fullLayerBehavior = {
  measure(node, constraints) {
    return {
      width: constraints?.maxWidth ?? 0,
      height: constraints?.maxHeight ?? 0
    };
  }
};

export class UIModule {
  constructor(engine) {
    this.engine = engine;
    this.nodeFactory = new NodeFactory();
    this.reconciler = new Reconciler(this.nodeFactory);
    this.oldVNode = null;
  }

  attach() {
    // Create root SceneNode
    const root = new SceneNode({
      id: "root",
      behavior: fullLayerBehavior,
      style: { x: 0, y: 0 }
    });

    // Give it to SceneGraphModule
    this.engine.sceneGraph.setRoot(root);
    this.rootNode = root
    console.log("UIModule attached, root node created:", root);
  }

  render(vnode) {
    this.oldVNode = this.reconciler.reconcile(
      this.rootNode,
      this.oldVNode,
      vnode
    );
  }

  destroy() {
    this.oldVNode = null;
    this.rootNode = null;
  }
}
