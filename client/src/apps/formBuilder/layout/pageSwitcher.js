export function createPageSwitcher(engine, parentNode = engine.ui.rootNode) {
  let mountedPageNode = null;

  return {
    show(pageNode) {
      if (!pageNode) {
        console.warn("PageSwitcher.show called with invalid node:", pageNode);
        return;
      }

      if (mountedPageNode && mountedPageNode !== pageNode) {
        engine.ui.unmountNode(mountedPageNode);
      }

      if (mountedPageNode !== pageNode) {
        if (!pageNode.parent) {
          engine.ui.mountNode(pageNode, parentNode);
        }
        mountedPageNode = pageNode;
      }
    },

    clear() {
      if (mountedPageNode) {
        engine.ui.unmountNode(mountedPageNode);
        mountedPageNode = null;
      }
    }
  };
}