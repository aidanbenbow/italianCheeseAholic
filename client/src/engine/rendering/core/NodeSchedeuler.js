// /render/core/NodeScheduler.js

export class NodeScheduler {
  constructor() {
    this.layoutQueue = new Set();
    this.updateQueue = new Set();
    this.renderQueue = new Set();
    this.root = null;
  }

  attachRoot(root) {
    this.root = root;
    this.layoutQueue.clear();
    this.updateQueue.clear();
    this.renderQueue.clear();
  }

  scheduleLayout(node) {
    if (!node) return;
    // set DIRTY_LAYOUT, DIRTY_RENDER, prune descendants, ancestor checks, etc.
    this.layoutQueue.add(node);
    this.scheduleRender(node);
  }

  scheduleUpdate(node) {
    if (!node) return;
    // set DIRTY_UPDATE, DIRTY_RENDER, prune descendants, ancestor checks, etc.
    this.updateQueue.add(node);
    this.scheduleRender(node);
  }

  scheduleRender(node) {
    if (!node) return;
    // set DIRTY_RENDER, prune descendants, ancestor checks, etc.
    this.renderQueue.add(node);
  }

  getLayoutQueue() {
    return this.layoutQueue;
  }

  getUpdateQueue() {
    return this.updateQueue;
  }

  getRenderQueue() {
    return this.renderQueue;
  }

  hasPendingWork() {
    return (
      this.layoutQueue.size > 0 ||
      this.updateQueue.size > 0 ||
      this.renderQueue.size > 0
    );
  }
}