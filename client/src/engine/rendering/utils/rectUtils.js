// /render/utils/rectUtils.js

export function normalizeRect(rect) {
  if (!rect) return null;

  const x = Number(rect.x ?? 0);
  const y = Number(rect.y ?? 0);
  const width = Number(rect.width ?? 0);
  const height = Number(rect.height ?? 0);

  if (!Number.isFinite(x) || !Number.isFinite(y) ||
      !Number.isFinite(width) || !Number.isFinite(height)) {
    return null;
  }

  if (width <= 0 || height <= 0) return null;

  return { x, y, width, height };
}

export function rectsOverlapOrTouch(a, b) {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

export function unionRects(a, b) {
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

export function mergeOverlappingRects(rects) {
  const pending = rects.filter(Boolean).map(r => ({ ...r }));
  const merged = [];

  while (pending.length) {
    let current = pending.pop();
    let changed = true;

    while (changed) {
      changed = false;

      for (let i = pending.length - 1; i >= 0; i--) {
        if (!rectsOverlapOrTouch(current, pending[i])) continue;

        current = unionRects(current, pending[i]);
        pending.splice(i, 1);
        changed = true;
      }
    }

    merged.push(current);
  }

  return merged;
}

export function getFullCanvasRect(ctx) {
  if (!ctx?.canvas) return null;
  return {
    x: 0,
    y: 0,
    width: ctx.canvas.width,
    height: ctx.canvas.height
  };
}

export function rectMatchesCanvas(rect, ctx) {
  if (!rect || !ctx?.canvas) return false;
  return (
    rect.x === 0 &&
    rect.y === 0 &&
    rect.width === ctx.canvas.width &&
    rect.height === ctx.canvas.height
  );
}