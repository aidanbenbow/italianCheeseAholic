/**
 * createPageSwitcher
 * Mounts/unmounts page nodes so only one page is shown at a time.
 *
 * @param {object} engine
 * @returns {{ show(pageNode): void }}
 */
export function createPageSwitcher(engine) {
  let mountedPageNode = null;

  return {
    show(pageNode) {
      if (mountedPageNode && mountedPageNode !== pageNode) {
        engine.ui.unmountNode(mountedPageNode);
      }

      if (mountedPageNode !== pageNode) {
        engine.ui.mountNode(pageNode);
        mountedPageNode = pageNode;
      }
    },
  };
}
