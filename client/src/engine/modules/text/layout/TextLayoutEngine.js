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

    if (cacheTarget) {
      const cache = this._getCache(cacheTarget);
      const hit = cache.get(cacheKey);
      if (hit) return hit;
    }

    const baseLayout = TextLayoutCalculator.calculateLayout(
      normalizedText,
      ctx,
      normalizedWidth,
      normalizedFont
    );

    const rawLineHeight = Number(baseLayout?.lineHeight) || 0;
    const lineAdvance = rawLineHeight + normalizedGap;

    const layout = new TextLayout({
      ...baseLayout,
      rawLineHeight,
      lineGap: normalizedGap,
      lineAdvance,
      lineHeight: normalizedMode === "advance" ? lineAdvance : rawLineHeight
    });

    if (cacheTarget) {
      this._setCached(cacheTarget, cacheKey, layout);
    }

    return layout;
  }

  /**
   * Invalidate all cached layouts on a target (call when text/style changes).
   * @param {object} cacheTarget
   */
  static invalidate(cacheTarget) {
    if (cacheTarget?.__textLayoutCache instanceof Map) {
      cacheTarget.__textLayoutCache.clear();
    }
  }

  /** @private */
  static _getCache(cacheTarget) {
    if (!(cacheTarget.__textLayoutCache instanceof Map)) {
      cacheTarget.__textLayoutCache = new Map();
    }
    return cacheTarget.__textLayoutCache;
  }

  /** @private — evict oldest entry when cap is exceeded */
  static _setCached(cacheTarget, key, layout) {
    const cache = this._getCache(cacheTarget);
    if (!cache.has(key) && cache.size >= 32) {
      cache.delete(cache.keys().next().value);
    }
    cache.set(key, layout);
  }

  static _createCacheKey({ text, font, maxWidth, lineGap, lineHeightMode }) {
    return `${font}|${maxWidth}|${lineGap}|${lineHeightMode}|${text}`;
  }
}
