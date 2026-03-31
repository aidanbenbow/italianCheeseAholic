export function renderBoxBackground(ctx, bounds, style, options = {}) {
  const {
    defaultBackground,
    alwaysFill = false
  } = options;

  const fillColor = style?.background ?? defaultBackground;
  if (!alwaysFill && !fillColor) {
    return;
  }

  ctx.fillStyle = fillColor ?? "transparent";
  ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
}

export function renderBoxBorder(ctx, bounds, style, options = {}) {
  const borderWidth = style?.borderWidth ?? 0;
  const borderColor = options.borderColor ?? style?.borderColor;

  if (!borderColor || borderWidth <= 0) {
    return;
  }

  ctx.lineWidth = borderWidth;
  ctx.strokeStyle = borderColor;
  ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
}