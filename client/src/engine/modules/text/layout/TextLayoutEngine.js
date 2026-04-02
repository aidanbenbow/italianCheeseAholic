import { TextLayoutCalculator } from "../../../utils/textLayoutCalculator.js";
import { TextLayout } from "./TextLayout.js";

export class TextLayoutEngine {
  static getLayout({
    cacheTarget,
    text,
    ctx,
    maxWidth,
    font,
    lineGap = 0,
    lineHeightMode = "raw"
  } = {}) {
    const normalizedText = String(text ?? "");
    const normalizedFont = String(font ?? "14px sans-serif");
    const normalizedWidth = Number.isFinite(maxWidth)
      ? Math.max(0, maxWidth)
      : Infinity;
    const normalizedGap = Number.isFinite(lineGap) ? Math.max(0, lineGap) : 0;
    const normalizedMode = lineHeightMode === "advance" ? "advance" : "raw";

    const cacheKey = this._createCacheKey({
      text: normalizedText,
      font: normalizedFont,
      maxWidth: normalizedWidth,
      lineGap: normalizedGap,
      lineHeightMode: normalizedMode
    });

    const cachedLayout = cacheTarget?.__textLayoutCache;
    if (cachedLayout?.key === cacheKey && cachedLayout.layout) {
      return cachedLayout.layout;
    }

    const baseLayout = TextLayoutCalculator.calculateLayout(
      normalizedText,
      ctx,
      normalizedWidth,
      normalizedFont
    );

    const rawLineHeight = Number(baseLayout?.lineHeight) || 0;
    const lineAdvance = rawLineHeight + normalizedGap;
    const lineCount = baseLayout?.lines?.length ?? 0;
    const totalHeight = lineCount <= 0
      ? 0
      : (rawLineHeight * lineCount) + (normalizedGap * Math.max(0, lineCount - 1));

    const layout = new TextLayout({
      ...baseLayout,
      rawLineHeight,
      lineGap: normalizedGap,
      lineAdvance,
      lineHeight: normalizedMode === "advance" ? lineAdvance : rawLineHeight,
      totalHeight
    });

    if (cacheTarget) {
      cacheTarget.__textLayoutCache = {
        key: cacheKey,
        layout
      };
    }

    return layout;
  }

  static _createCacheKey({ text, font, maxWidth, lineGap, lineHeightMode }) {
    return `${font}|${maxWidth}|${lineGap}|${lineHeightMode}|${text}`;
  }
}
