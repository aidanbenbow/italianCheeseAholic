import { DIRTY_LAYOUT, DIRTY_RENDER, DIRTY_UPDATE } from "../nodes/sceneNode.js";

export class RenderPipeline {
    constructor(renderManager) {
      this.renderManager = renderManager;
      this.rendererContext = null;
      this.root = null; // root SceneNode
      this.dirty = true;
      this.running = false;
      this.constraints = { maxWidth: Infinity, maxHeight: Infinity };
      this.editor = null;
      this.currentFrame = 0;
      this.subtreeWorkFrame = 0;
      this.subtreeBudgetMs = 8;
      this.debugSubtreeScheduling = true;
      this.forceFullFrame = false;
      this.layoutQueue = new Set();
      this.updateQueue = new Set();
      this.renderQueue = new Set();
      this.currentConstraints = this.constraints;
      this.rafId = null;
      this.frameMetrics = {
        measure: 0,
        layout: 0,
        update: 0,
        render: 0,
        subtreeWork: 0
      };
      this.lastSubtreeStats = {
        frame: 0,
        renderFrame: 0,
        processed: 0,
        hasRemaining: false,
        durationMs: 0,
        budgetMs: this.subtreeBudgetMs
      };
    }
  
    setRendererContext(rendererContext) {
      
      this.rendererContext = rendererContext;
    }

    setEditor(editor) {
      this.editor = editor;
    }
  
    setRoot(rootNode) {
      // 1. Detach old root
      if (this.root) {
        this.root.off("invalidate", this._invalidateHandler);
        this.root.off("scheduleLayout", this._scheduleLayoutHandler);
        this.root.off("scheduleUpdate", this._scheduleUpdateHandler);
        this.root.off("scheduleRender", this._scheduleRenderHandler);
      }
      console.log("RenderPipeline: Setting new root node:", rootNode);

      // 2. Attach new root
      this.root = rootNode;
      // Keep a reference to the handler so we can remove it later
      this._invalidateHandler = () => {
        this.invalidate();
      };
      this._scheduleLayoutHandler = ({ node } = {}) => {
        this.scheduleLayout(node || this.root);
      };
      this._scheduleUpdateHandler = ({ node } = {}) => {
        this.scheduleUpdate(node || this.root);
      };
      this._scheduleRenderHandler = ({ node } = {}) => {
        this.scheduleRender(node || this.root);
      };
      rootNode.on("invalidate", this._invalidateHandler);
      rootNode.on("scheduleLayout", this._scheduleLayoutHandler);
      rootNode.on("scheduleUpdate", this._scheduleUpdateHandler);
      rootNode.on("scheduleRender", this._scheduleRenderHandler);
      this.forceFullFrame = true;

      this.layoutQueue.clear();
      this.updateQueue.clear();
      this.renderQueue.clear();
      this.scheduleLayout(rootNode);
      this.scheduleUpdate(rootNode);
      this.scheduleRender(rootNode);

      // 3. Recursively schedule any children already in the tree
      this._scheduleSubtree(rootNode);

      // 4. Force redraw
      this.invalidate();
    }

    _scheduleSubtree(node) {
      if (!node?.children) return;
      for (const child of node.children) {
        this.scheduleLayout(child);
        this.scheduleUpdate(child);
        this.scheduleRender(child);
        this._scheduleSubtree(child);
      }
    }
  
    invalidate() {
      this.dirty = true;
    }
  
    tick(dt, constraints) {
      if (!this.root) return;

      if (constraints) {
        const normalizedConstraints = normalizeConstraints(constraints);
        this.constraints = normalizedConstraints;
        this.currentConstraints = normalizedConstraints;
      }

      this.currentFrame += 1;

      this.processSubtreeWork();

      if (!this.dirty && !this.hasPendingWork()) {
        this.renderSubtreeDebugOverlay();
        return;
      }

      this.runLayout();
      this.runUpdate(dt);
      this.renderFrame();
      this.forceFullFrame = false;
    }

   scheduleLayout(node) {
     if (!node) return;

     node.flags |= DIRTY_LAYOUT;
     node.flags |= DIRTY_RENDER;

     if (hasQueuedAncestor(this.layoutQueue, node)) {
       this.dirty = true;
       this.scheduleRender(node);
       return;
     }

     pruneQueuedDescendants(this.layoutQueue, node);
     this.layoutQueue.add(node);
     this.scheduleRender(node);
     this.dirty = true;
   }

   scheduleUpdate(node) {
     if (!node) return;

     node.flags |= DIRTY_UPDATE;
     node.flags |= DIRTY_RENDER;

     if (hasQueuedAncestor(this.updateQueue, node)) {
       this.dirty = true;
       this.scheduleRender(node);
       return;
     }

     pruneQueuedDescendants(this.updateQueue, node);
     this.updateQueue.add(node);
     this.scheduleRender(node);
     this.dirty = true;
   }

   scheduleRender(node) {
     if (!node) return;

     node.flags |= DIRTY_RENDER;

     if (hasQueuedAncestor(this.renderQueue, node)) {
       this.dirty = true;
       return;
     }

     pruneQueuedDescendants(this.renderQueue, node);
     this.renderQueue.add(node);
     this.dirty = true;
   }

   processSubtreeWork() {
     if (!this.root) return;

     const hasPendingSubtreeWork = hasDirtySubtree(this.root);

     if (hasPendingSubtreeWork) {
       this.subtreeWorkFrame += 1;
       const subtreeStart = now();
       const subtreeWork = this._doSubtreeWork(this.root, this.subtreeBudgetMs, this.currentFrame);
       this.lastSubtreeStats = {
         frame: this.subtreeWorkFrame,
         renderFrame: this.currentFrame,
         processed: subtreeWork.processed,
         hasRemaining: subtreeWork.hasRemaining,
         durationMs: now() - subtreeStart,
         budgetMs: this.subtreeBudgetMs
       };
       this.frameMetrics.subtreeWork = this.lastSubtreeStats.durationMs;
     } else {
       this.lastSubtreeStats = {
         frame: this.subtreeWorkFrame,
         renderFrame: this.currentFrame,
         processed: 0,
         hasRemaining: false,
         durationMs: 0,
         budgetMs: this.subtreeBudgetMs
       };
       this.frameMetrics.subtreeWork = 0;
     }
   }

   hasPendingWork() {
     return this.layoutQueue.size > 0 || this.updateQueue.size > 0 || this.renderQueue.size > 0 || this.lastSubtreeStats?.hasRemaining || false;
   }

   runLayout() {
     if (!this.root) return;

     if (!this.layoutQueue.size) {
       this.frameMetrics.measure = 0;
       this.frameMetrics.layout = 0;
       return;
     }

      let measureDuration = 0;
      let layoutDuration = 0;
      let passCount = 0;

      while (this.layoutQueue.size) {
        if (passCount > 1000) {
          break;
        }

        const nodes = Array.from(this.layoutQueue).sort((a, b) => getDepth(a) - getDepth(b));
        this.layoutQueue.clear();

        for (const node of nodes) {
          const previousMeasured = node.measured
            ? { width: node.measured.width, height: node.measured.height }
            : { width: 0, height: 0 };
          const measureConstraints = this.getMeasureConstraints(node);

          const measureStart = now();
          node.measure(measureConstraints, this.rendererContext);
          measureDuration += now() - measureStart;

          const layoutBounds = this.getLayoutBounds(node, measureConstraints);

          const layoutStart = now();
          node.layout(layoutBounds, this.rendererContext);
          layoutDuration += now() - layoutStart;
          node.flags &= ~DIRTY_LAYOUT;

          if (didNodeSizeChange(previousMeasured, node.measured) && node.parent) {
            this.scheduleLayout(node.parent);
          }
        }

        passCount += 1;
      }

     this.frameMetrics.measure = measureDuration;
     this.frameMetrics.layout = layoutDuration;
   }

   runUpdate(dt) {
     if (!this.root) return;

     if (!this.updateQueue.size) {
       this.frameMetrics.update = 0;
       return;
     }

     const start = now();
     const nodes = Array.from(this.updateQueue).sort((a, b) => getDepth(a) - getDepth(b));
     this.updateQueue.clear();

     for (const node of nodes) {
       node.update(dt, this.rendererContext);
       this.updateScrollableNodes(node);
       node.flags &= ~DIRTY_UPDATE;
     }

     this.frameMetrics.update = now() - start;
   }

   _doSubtreeWork(root, budgetMs = 8, frameId = 0) {
      const start = now();
      const stack = [root];
      let processed = 0;

      while (stack.length) {
        if (now() - start > budgetMs) {
          break;
        }

        const node = stack.pop();
        const meta = ensureSubtreeMeta(node);
        if (!meta) continue;

        if (meta.dirty) {
          this.reconcileNode(node, frameId);
          clearNodeDirty(node);
          processed += 1;
        }

        if (meta.dirtyChildrenCount > 0 && Array.isArray(node.children) && node.children.length > 0) {
          for (let index = node.children.length - 1; index >= 0; index -= 1) {
            const child = node.children[index];
            const childMeta = ensureSubtreeMeta(child);
            if (!childMeta) continue;
            if (childMeta.dirty || childMeta.dirtyChildrenCount > 0) {
              stack.push(child);
            }
          }
        }
      }

      return {
        processed,
        hasRemaining: hasDirtySubtree(root)
      };
    }

    reconcileNode(node, frameId) {
      const meta = ensureSubtreeMeta(node);
      if (!meta) return;

      meta.lastProcessedFrame = frameId;
      node.reconcileSubtree?.();
    }
    updateScrollableNodes(node) {
      if (node.scroll) node.updateScroll();
      for (const child of node.children) {
        this.updateScrollableNodes(child);
      }
    }
    renderFrame() {
      const start = now();
      if (!this.dirty || !this.renderQueue.size) {
        this.frameMetrics.render = 0;
        return;
      }

      const dirtyRects = this.forceFullFrame
        ? [getFullCanvasRect(this.rendererContext)].filter(Boolean)
        : this.getDirtyRenderRects();

      const renderNodes = Array.from(this.renderQueue);
      this.renderQueue.clear();

      if (!dirtyRects.length) {
        this.dirty = false;
        this.frameMetrics.render = now() - start;
        return;
      }

      for (const dirtyRect of dirtyRects) {
        this.clearDirtyRect(dirtyRect);
        this.renderClipped(dirtyRect, () => {
          if (this.root) {
            this.root.render(this.rendererContext);
          }

          if (this.editor) {
            this.editor.renderOverlay(this.rendererContext);
          }
        });
      }

      for (const node of renderNodes) {
        node.flags &= ~DIRTY_RENDER;
      }

      this.renderSubtreeDebugOverlay();

      this.dirty = false;
      this.frameMetrics.render = now() - start;
    }

    renderSubtreeDebugOverlay() {
      if (!this.debugSubtreeScheduling) return;
      const ctx = this.rendererContext;
      if (!ctx) return;

      const stats = this.lastSubtreeStats || {};
      const lines = [
        `subtree work frame: ${stats.frame ?? 0}`,
        `render frame: ${stats.renderFrame ?? this.currentFrame}`,
        `processed: ${stats.processed ?? 0}`,
        `remaining: ${stats.hasRemaining ? 'yes' : 'no'}`,
        `layout queue: ${this.layoutQueue.size}`,
        `update queue: ${this.updateQueue.size}`,
        `render queue: ${this.renderQueue.size}`,
        `budget: ${stats.budgetMs ?? this.subtreeBudgetMs}ms`,
        `work: ${Number(stats.durationMs || 0).toFixed(2)}ms`,
        `measure: ${Number(this.frameMetrics.measure || 0).toFixed(2)}ms`,
        `layout: ${Number(this.frameMetrics.layout || 0).toFixed(2)}ms`,
        `update: ${Number(this.frameMetrics.update || 0).toFixed(2)}ms`,
        `render: ${Number(this.frameMetrics.render || 0).toFixed(2)}ms`
      ];

      const panelWidth = 190;
      const panelHeight = 186;
      const margin = 8;
      const x = Math.max(margin, (ctx.canvas?.width || 0) - panelWidth - margin);
      const y = margin;

      ctx.save();
      ctx.font = '12px monospace';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(x, y, panelWidth, panelHeight);
      ctx.fillStyle = '#93c5fd';
      for (let index = 0; index < lines.length; index += 1) {
        ctx.fillText(lines[index], x + 6, y + 16 + index * 14);
      }
      ctx.restore();
    }
  
    start(constraints) {
      const normalizedConstraints = normalizeConstraints(constraints);
      this.constraints = normalizedConstraints;
      this.currentConstraints = normalizedConstraints;
      if (this.running) return;
      this.running = true;
      let lastTime = performance.now();
  
      const loop = (time) => {
        const dt = time - lastTime;
        lastTime = time;
        this.tick(dt, this.currentConstraints);
        if (this.running) {
          this.rafId = requestAnimationFrame(loop);
        }
      };

      this.rafId = requestAnimationFrame(loop);
    }
  
    stop() {
       this.running = false;
       if (this.rafId !== null) {
         cancelAnimationFrame(this.rafId);
         this.rafId = null;
       }
    }
    toSceneCoords(canvasX, canvasY) {
      const scaleX = this.constraints.maxWidth / this.rendererContext.canvas.width;
      const scaleY = this.constraints.maxHeight / this.rendererContext.canvas.height;
    
      return {
        x: canvasX * scaleX,
        y: canvasY * scaleY
      };
    }

    getMeasureConstraints(node) {
      if (node === this.root) {
        return this.currentConstraints;
      }

      return node.lastMeasureConstraints ?? this.currentConstraints;
    }

    getLayoutBounds(node, constraints) {
      if (node === this.root) {
        return {
          x: 0,
          y: 0,
          width: constraints.maxWidth,
          height: constraints.maxHeight
        };
      }

      // Use measured dimensions when available — lastLayoutBounds starts as
      // {0,0,0,0} so cannot be trusted until at least one successful layout pass.
      const measuredW = node.measured?.width;
      const measuredH = node.measured?.height;

      const width = (measuredW != null && measuredW > 0)
        ? measuredW
        : (node.lastLayoutBounds?.width ?? node.bounds?.width ?? 0);

      const height = (measuredH != null && measuredH > 0)
        ? measuredH
        : (node.lastLayoutBounds?.height ?? node.bounds?.height ?? 0);

      // Prefer explicit style x/y for absolute-positioned nodes (toasts, popups etc.)
      const x = node.style?.x ?? node.lastLayoutBounds?.x ?? node.bounds?.x ?? 0;
      const y = node.style?.y ?? node.lastLayoutBounds?.y ?? node.bounds?.y ?? 0;

      return { x, y, width, height };
    }

    getDirtyRenderRects() {
      const dirtyRects = [];

      for (const node of this.renderQueue) {
        const currentRect = normalizeRect(node.bounds);
        const previousRect = normalizeRect(node.lastRenderedBounds);

        if (currentRect) dirtyRects.push(currentRect);
        if (previousRect) dirtyRects.push(previousRect);
      }

      const overlayRect = this.getDebugOverlayRect();
      if (overlayRect) {
        dirtyRects.push(overlayRect);
      }

      return mergeOverlappingRects(dirtyRects);
    }

    clearDirtyRect(rect) {
      if (!rect || !this.rendererContext) return;

      if (typeof this.renderManager?.clearRect === "function") {
        this.renderManager.clearRect(this.rendererContext, rect);
        return;
      }

      if (typeof this.renderManager?.clearAll === "function" && rectMatchesCanvas(rect, this.rendererContext)) {
        this.renderManager.clearAll(this.rendererContext);
        return;
      }

      this.rendererContext.clearRect(rect.x, rect.y, rect.width, rect.height);
    }

    renderClipped(rect, renderFn) {
      if (!rect || !this.rendererContext || typeof renderFn !== "function") return;

      const ctx = this.rendererContext;
      ctx.save();
      ctx.beginPath();
      ctx.rect(rect.x, rect.y, rect.width, rect.height);
      ctx.clip();
      renderFn();
      ctx.restore();
    }

    getDebugOverlayRect() {
      if (!this.debugSubtreeScheduling || !this.rendererContext?.canvas) {
        return null;
      }

      const panelWidth = 190;
      const panelHeight = 186;
      const margin = 8;
      const x = Math.max(margin, this.rendererContext.canvas.width - panelWidth - margin);
      const y = margin;

      return { x, y, width: panelWidth, height: panelHeight };
    }
  }

function normalizeConstraints(constraints) {
  if (!constraints) {
    return { maxWidth: Infinity, maxHeight: Infinity };
  }

  const maxWidth = Number(
    constraints.maxWidth ?? constraints.width ?? Infinity
  );
  const maxHeight = Number(
    constraints.maxHeight ?? constraints.height ?? Infinity
  );

  return {
    maxWidth: Number.isFinite(maxWidth) ? maxWidth : Infinity,
    maxHeight: Number.isFinite(maxHeight) ? maxHeight : Infinity
  };
}

function ensureSubtreeMeta(node) {
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

function clearNodeDirty(node) {
  const meta = ensureSubtreeMeta(node);
  if (!meta || !meta.dirty) return;

  meta.dirty = false;

  let parent = node.parent;
  while (parent) {
    const parentMeta = ensureSubtreeMeta(parent);
    if (parentMeta) {
      parentMeta.dirtyChildrenCount = Math.max(0, parentMeta.dirtyChildrenCount - 1);
    }
    parent = parent.parent;
  }
}

function hasDirtySubtree(root) {
  const stack = [root];

  while (stack.length) {
    const node = stack.pop();
    const meta = ensureSubtreeMeta(node);
    if (!meta) continue;

    if (meta.dirty) {
      return true;
    }

    if (meta.dirtyChildrenCount > 0 && Array.isArray(node.children) && node.children.length > 0) {
      for (let index = 0; index < node.children.length; index += 1) {
        stack.push(node.children[index]);
      }
    }
  }

  return false;
}

function getDepth(node) {
  let depth = 0;
  let current = node?.parent;

  while (current) {
    depth += 1;
    current = current.parent;
  }

  return depth;
}

function hasQueuedAncestor(queue, node) {
  let current = node?.parent;

  while (current) {
    if (queue.has(current)) {
      return true;
    }
    current = current.parent;
  }

  return false;
}

function pruneQueuedDescendants(queue, node) {
  for (const queuedNode of queue) {
    if (isDescendantOf(queuedNode, node)) {
      queue.delete(queuedNode);
    }
  }
}

function isDescendantOf(node, ancestor) {
  let current = node?.parent;

  while (current) {
    if (current === ancestor) {
      return true;
    }
    current = current.parent;
  }

  return false;
}

function didNodeSizeChange(previousMeasured, nextMeasured) {
  return previousMeasured?.width !== nextMeasured?.width || previousMeasured?.height !== nextMeasured?.height;
}

function normalizeRect(rect) {
  if (!rect) return null;

  const x = Number(rect.x ?? 0);
  const y = Number(rect.y ?? 0);
  const width = Number(rect.width ?? 0);
  const height = Number(rect.height ?? 0);

  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height)) {
    return null;
  }

  if (width <= 0 || height <= 0) {
    return null;
  }

  return { x, y, width, height };
}

function mergeOverlappingRects(rects) {
  const pending = rects.filter(Boolean).map((rect) => ({ ...rect }));
  const merged = [];

  while (pending.length) {
    let current = pending.pop();
    let changed = true;

    while (changed) {
      changed = false;

      for (let index = pending.length - 1; index >= 0; index -= 1) {
        if (!rectsOverlapOrTouch(current, pending[index])) {
          continue;
        }

        current = unionRects(current, pending[index]);
        pending.splice(index, 1);
        changed = true;
      }
    }

    merged.push(current);
  }

  return merged;
}

function rectsOverlapOrTouch(a, b) {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

function unionRects(a, b) {
  const minX = Math.min(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxX = Math.max(a.x + a.width, b.x + b.width);
  const maxY = Math.max(a.y + a.height, b.y + b.height);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function getFullCanvasRect(ctx) {
  if (!ctx?.canvas) return null;
  return {
    x: 0,
    y: 0,
    width: ctx.canvas.width,
    height: ctx.canvas.height
  };
}

function rectMatchesCanvas(rect, ctx) {
  if (!rect || !ctx?.canvas) return false;
  return rect.x === 0 && rect.y === 0 && rect.width === ctx.canvas.width && rect.height === ctx.canvas.height;
}

function now() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}
