// /render/core/SubtreeScheduler.js
import { now } from "../utils/TimeUtils.js";

export class SubtreeScheduler {
  process(root, frameId, budgetMs = 8) {
    if (!root) {
      return {
        frame: frameId,
        renderFrame: frameId,
        processed: 0,
        hasRemaining: false,
        durationMs: 0,
        budgetMs
      };
    }

    const start = now();
    const stack = [root];
    let processed = 0;

    while (stack.length) {
      if (now() - start > budgetMs) break;

      const node = stack.pop();
      const meta = this.ensureSubtreeMeta(node);
      if (!meta) continue;

      if (meta.dirty) {
        this.reconcileNode(node, frameId);
        this.clearNodeDirty(node);
        processed++;
      }

      if (meta.dirtyChildrenCount > 0 && Array.isArray(node.children)) {
        for (let i = node.children.length - 1; i >= 0; i--) {
          const child = node.children[i];
          const childMeta = this.ensureSubtreeMeta(child);
          if (childMeta?.dirty || childMeta?.dirtyChildrenCount > 0) {
            stack.push(child);
          }
        }
      }
    }

    return {
      frame: frameId,
      renderFrame: frameId,
      processed,
      hasRemaining: this.hasDirtySubtree(root),
      durationMs: now() - start,
      budgetMs
    };
  }

  ensureSubtreeMeta(node) {
    if (!node) return null;
    if (!node.subtreeMeta) {
      node.subtreeMeta = {
        dirty: false,
        dirtyChildrenCount: 0,
        lastProcessedFrame: 0
      };
    }
    return node.subtreeMeta;
  }

  reconcileNode(node, frameId) {
    const meta = this.ensureSubtreeMeta(node);
    if (!meta) return;
    meta.lastProcessedFrame = frameId;
    node.reconcileSubtree?.();
  }

  clearNodeDirty(node) {
    const meta = this.ensureSubtreeMeta(node);
    if (!meta || !meta.dirty) return;

    meta.dirty = false;

    let parent = node.parent;
    while (parent) {
      const parentMeta = this.ensureSubtreeMeta(parent);
      if (parentMeta) {
        parentMeta.dirtyChildrenCount = Math.max(
          0,
          parentMeta.dirtyChildrenCount - 1
        );
      }
      parent = parent.parent;
    }
  }

  hasDirtySubtree(root) {
    const stack = [root];

    while (stack.length) {
      const node = stack.pop();
      const meta = this.ensureSubtreeMeta(node);
      if (!meta) continue;

      if (meta.dirty) return true;

      if (meta.dirtyChildrenCount > 0 && Array.isArray(node.children)) {
        for (const child of node.children) {
          stack.push(child);
        }
      }
    }

    return false;
  }
}