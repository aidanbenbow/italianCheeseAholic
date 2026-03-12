import { NodeFactory } from "../core/NodeFactory.js";
import { Reconciler } from "../core/reconciler.js";
import { SceneNode } from "../nodes/sceneNode.js";

export class UIModule {
  constructor(engine) {
    this.engine = engine;
    this.nodeFactory = new NodeFactory();
    this.reconciler = new Reconciler(this.nodeFactory);
    this.oldVNode = null;
  }

  onAttach() {
    // Create root SceneNode
    const root = new SceneNode({
      id: "root",
      behavior: null,
      style: { width: "100%", height: "100%" }
    });

    // Give it to SceneGraphModule
    this.engine.sceneGraph.setRoot(root);
    this.rootNode = root;
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
