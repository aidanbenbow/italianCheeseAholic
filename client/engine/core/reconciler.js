export class Reconciler {
  constructor(nodeFactory) {
    this.nodeFactory = nodeFactory;
  }

  reconcile(parentNode, oldVNode, newVNode) {
    // Mount
    if (!oldVNode) {
      const newNode = this.nodeFactory.create(newVNode);
      parentNode.add(newNode);
      newVNode._node = newNode;
      return newNode;
    }

    // Unmount
    if (!newVNode) {
      parentNode.remove(oldVNode._node);
      return null;
    }

    // Replace
    if (this.shouldReplace(oldVNode, newVNode)) {
      const newNode = this.nodeFactory.create(newVNode);
      parentNode.replaceChild(oldVNode._node, newNode);
      newVNode._node = newNode;
      return newNode;
    }

    // Update
    const node = oldVNode._node;
    newVNode._node = node;

    this.updateProps(node, oldVNode.props, newVNode.props);
    this.updateStyle(node, oldVNode.props.style, newVNode.props.style);
    this.updateComponents(node, oldVNode.props, newVNode.props);

    // Reconcile children
    newVNode.children = this.reconcileChildren(
      node,
      oldVNode.children,
      newVNode.children
    );

    return node;
  }
}