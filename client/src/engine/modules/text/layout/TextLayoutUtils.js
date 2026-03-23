// /engine/modules/text/layout/TextLayoutUtils.js

export function getRenderedNodeY(node) {
  let y = node?.bounds?.y ?? 0;
  let current = node?.parent;

  while (current) {
    if (current.scroll) {
      y -= current.scroll.offsetY || 0;
    }
    current = current.parent;
  }

  return y;
}

export function getTextAreaTop(node) {
  const layout = node?._layout || {};
  const wcHeight = layout.wordCountHeight ?? 0;
  const wcSpacing = layout.wordCountSpacing ?? 0;

  const offset = wcHeight > 0 ? wcHeight + wcSpacing : 0;

  return getRenderedNodeY(node) + offset;
}

export function getLineStartX(node, line, ctx) {
  const boundsX = node?.bounds?.x ?? 0;
  const boundsWidth = node?.bounds?.width ?? 0;
  const paddingX = node?.style?.paddingX || 0;
  const align = node?.style?.align || "left";

  const text = line?.text ?? "";
  const lineWidth = ctx.measureText(text).width;

  if (align === "center") {
    return boundsX + (boundsWidth - lineWidth) / 2;
  }

  if (align === "right") {
    return boundsX + boundsWidth - paddingX - lineWidth;
  }

  return boundsX + paddingX;
}

export function isWhitespace(char) {
  return /\s/.test(char);
}