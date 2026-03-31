export function resolvePadding(style, toFinite, defaults = {}) {
  const paddingX = toFinite(style?.paddingX, 0);
  const paddingY = toFinite(style?.paddingY, 0);

  const left = toFinite(style?.paddingLeft, defaults.left ?? 0) + paddingX;
  const right = toFinite(style?.paddingRight, defaults.right ?? 0) + paddingX;
  const top = toFinite(style?.paddingTop, defaults.top ?? 0) + paddingY;
  const bottom = toFinite(style?.paddingBottom, defaults.bottom ?? 0) + paddingY;

  return {
    left,
    right,
    top,
    bottom,
    totalX: left + right,
    totalY: top + bottom
  };
}

export function resolveContentRect(bounds, layout, padding) {
  const x = layout?.x ?? bounds.x;
  const y = layout?.y ?? bounds.y;
  const width = layout?.width ?? bounds.width;
  const height = layout?.height ?? bounds.height;

  const contentX = layout?.contentX ?? (x + padding.left);
  const contentY = layout?.contentY ?? (y + padding.top);
  const contentWidth = Math.max(0, layout?.contentWidth ?? (width - padding.totalX));
  const contentHeight = Math.max(0, layout?.contentHeight ?? (height - padding.totalY));

  return {
    x,
    y,
    width,
    height,
    contentX,
    contentY,
    contentWidth,
    contentHeight
  };
}

export function parseFontSize(font) {
  const match = String(font).match(/(\d+(?:\.\d+)?)px/);
  return match ? Number(match[1]) : 14;
}

export function measureIntrinsicText(text, font, ctx) {
  if (!ctx) {
    const fontSize = parseFontSize(font);
    return {
      width: text.length * Math.max(6, fontSize * 0.55),
      height: fontSize * 1.2
    };
  }

  ctx.save();
  ctx.font = font;
  const metrics = ctx.measureText(text);
  ctx.restore();

  const fontSize = parseFontSize(font);
  const measuredHeight = (metrics.actualBoundingBoxAscent ?? fontSize * 0.8)
    + (metrics.actualBoundingBoxDescent ?? fontSize * 0.2);

  return {
    width: metrics.width,
    height: measuredHeight
  };
}