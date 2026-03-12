import { DefaultBehavior } from "../nodes/behaviours/defaultBehaviour.js";
import { SceneNode } from "../nodes/sceneNode.js";
import { behaviorRegistry } from "../registries/behaviourReg.js";
import { componentRegistry } from "../registries/componentReg.js";

export class NodeFactory {
  constructor() {}

  create(vnode) {
    const { type, props } = vnode;

    // 1. Resolve behavior class
    const BehaviorClass =
      behaviorRegistry.get(type) ??
      DefaultBehavior; // fallback for unknown types

    // 2. Create SceneNode (behavior attached after)
    const node = new SceneNode({
      id: props.id,
      style: props.style,
      visible: props.visible ?? true,
      behavior: null
    });

    // 3. Attach behavior instance
    node.behavior = new BehaviorClass(node);

    // 4. Apply props (except style/components)
    this.applyProps(node, props);

    // 5. Attach components
    this.applyComponents(node, props);

    // 6. Recursively create children
    vnode.children.forEach(childVNode => {
      const childNode = this.create(childVNode);
      node.add(childNode);
      childVNode._node = childNode;
    });

    // 7. Attach SceneNode reference to VNode
    vnode._node = node;

    return node;
  }

  applyProps(node, props) {
    for (const key in props) {
      if (key === "style" || key === "components") continue;
      node[key] = props[key];
    }
  }

  applyComponents(node, props) {
    const comps = props.components ?? [];

    for (const comp of comps) {
      // If user passed a string, resolve via registry
      if (typeof comp === "string") {
        const CompClass = componentRegistry.get(comp);
        if (CompClass) {
          node.addComponent(new CompClass());
        }
      } else {
        // Direct instance
        node.addComponent(comp);
      }
    }
  }
}
