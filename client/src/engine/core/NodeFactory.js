export class NodeFactory {
  constructor() {}

  create(vnode) {
    const { type, props = {} } = vnode;

    const BehaviorClass =
      behaviorRegistry.get(type) ?? DefaultBehavior;

    const node = new SceneNode({
      id: props.id,
      key: props.key,
      style: props.style,
      visible: props.visible ?? true,
      behavior: null
    });

    node.behavior = new BehaviorClass(node);

    this.applyProps(node, props);
    this.applyComponents(node, props);

    if (node.behavior.onInit) {
      node.behavior.onInit(props);
    }

    const children = vnode.children ?? [];

    for (const childVNode of children) {
      const childNode = this.create(childVNode);
      node.add(childNode);
      childVNode._node = childNode;
    }

    if (node.behavior.onMount) {
      queueMicrotask(() => node.behavior.onMount());
    }

    vnode._node = node;

    return node;
  }

  applyProps(node, props) {
    const RESERVED = new Set(["id", "style", "components", "visible", "children"]);

    for (const key in props) {
      if (RESERVED.has(key)) continue;

      const value = props[key];

      // Event binding
      if (key.startsWith("on") && typeof value === "function") {
        node.behavior?.[key]?.(value);
        continue;
      }

      if (key in node) {
        node[key] = value;
      } else {
        node.setProp?.(key, value);
      }
    }
  }

  applyComponents(node, props) {
    const comps = props.components ?? [];

    for (const comp of comps) {
      if (typeof comp === "string") {
        const CompClass = componentRegistry.get(comp);
        if (CompClass) {
          node.addComponent(new CompClass());
        }
      } else {
        node.addComponent(comp);
      }
    }
  }
}