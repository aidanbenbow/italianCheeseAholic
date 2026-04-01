// /scene/behaviours/ScrollableBehavior.js

import { Behavior } from "./Behaviour.js";
import { renderBoxBackground, renderBoxBorder } from "./boxRenderHelpers.js";

const SCROLLBAR_W   = 5;   // thumb + track width (px)
const SCROLLBAR_PAD = 3;   // gap from right edge (px)
const SCROLLBAR_MIN_THUMB = 24; // minimum thumb height (px)

export class ScrollableBehavior extends Behavior {
  /**
   * @param {object} options
   * @param {number} [options.spacing=0]   Gap between stacked children.
   * @param {string} [options.direction="vertical"]  Only "vertical" is supported for now.
   */
  constructor({ spacing = 0 } = {}) {
    super(null);
    this.spacing = spacing;
  }

  // -------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------

  /** Initialise node.scroll if the node doesn't already have it. */
  _ensureScroll(node) {
    if (!node.scroll) {
      node.scroll = { offsetY: 0, contentHeight: 0 };
    }
  }

  _maxOffset(node) {
    return Math.max(0, (node.scroll?.contentHeight ?? 0) - (node.bounds?.height ?? 0));
  }

  // -------------------------------------------------------
  // measure — fill all available space (this is a viewport)
  // -------------------------------------------------------

  measure(node, constraints) {
    this._ensureScroll(node);

    const { maxWidth, maxHeight } = this.normalizeConstraints(constraints);

    const width = Number.isFinite(maxWidth) ? maxWidth : 0;

    // When the parent offers unlimited vertical space (e.g. a VerticalBehavior
    // root passes maxHeight: Infinity), fall back to the actual canvas height so
    // the viewport has a meaningful finite size.  Without this the clip rect
    // becomes Infinity and nothing renders.
    const canvasHeight =
      node.context?.canvasManager?.getCanvasSize?.("main")?.height ?? 600;

    const height = Number.isFinite(maxHeight) ? maxHeight : canvasHeight;

    return { width, height };
  }

  // -------------------------------------------------------
  // layout — stack children vertically into unbounded height
  // -------------------------------------------------------

  layout(node, bounds, ctx) {
    this._ensureScroll(node);

    // Children may grow as tall as they like — the viewport clips them.
    const childConstraints = {
      maxWidth:  bounds.width,
      maxHeight: Infinity
    };

    let currentY = bounds.y;
    const childCount = node.children.length;

    for (let i = 0; i < childCount; i++) {
      const child   = node.children[i];
      const measured = child.measure(childConstraints, ctx);

      child.applyLayout(
        {
          x:      bounds.x,
          y:      currentY,
          width:  measured.width,
          height: measured.height
        },
        ctx
      );

      currentY += measured.height;
      if (i < childCount - 1) currentY += this.spacing;
    }

    // Record total scrollable content height.
    node.scroll.contentHeight = Math.max(0, currentY - bounds.y);

    // Re-clamp offsetY in case content shrank (e.g. items removed).
    const max = this._maxOffset(node);
    node.scroll.offsetY = Math.min(node.scroll.offsetY, max);
  }

  // -------------------------------------------------------
  // render — clip to viewport, apply scroll translation, draw background
  //
  // NOTE: ctx.translate(0, -offsetY) is set here so that every subsequent
  // draw (children + postRender) is in scroll-content space.  To draw at a
  // fixed viewport position, add offsetY back to the y coordinate.
  // -------------------------------------------------------

  render(node, ctx) {
    this._ensureScroll(node);

    const { x, y, width, height } = node.bounds;
    const style = node.style ?? {};

    // 1. Optional background / border (outside clip so it always shows):
    renderBoxBackground(ctx, node.bounds, style, {
      defaultBackground: null,  // transparent by default
      alwaysFill: Boolean(style.background || style.backgroundColor)
    });
    renderBoxBorder(ctx, node.bounds, style, { borderColor: style.borderColor });

    // 2. Clip children to viewport.
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();

    // 3. Translate so scrolled content renders in the right place.
    ctx.translate(0, -node.scroll.offsetY);
  }

  // -------------------------------------------------------
  // postRender — scrollbar drawn ON TOP of children
  //
  // At this point ctx.translate(0, -offsetY) is still active.  To draw at
  // viewport coordinates (y_screen), use y_content = y_screen + offsetY.
  // -------------------------------------------------------

  postRender(node, ctx) {
    const { x, y, width, height } = node.bounds;
    const { offsetY, contentHeight } = node.scroll;

    if (contentHeight <= height) return; // no overflow — nothing to show

    const maxOffset = this._maxOffset(node);

    const trackX = x + width - SCROLLBAR_W - SCROLLBAR_PAD;
    const trackY = y + offsetY;          // viewport-top in content space
    const trackH = height;

    const thumbRatio  = height / contentHeight;
    const thumbH      = Math.max(SCROLLBAR_MIN_THUMB, trackH * thumbRatio);
    const maxThumbTop = trackH - thumbH;
    const scrollFrac  = maxOffset > 0 ? offsetY / maxOffset : 0;
    const thumbY      = trackY + scrollFrac * maxThumbTop;

    ctx.save();

    // Track
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(trackX, trackY, SCROLLBAR_W, trackH, SCROLLBAR_W / 2);
    } else {
      ctx.rect(trackX, trackY, SCROLLBAR_W, trackH);
    }
    ctx.fill();

    // Thumb
    ctx.fillStyle = "rgba(255,255,255,0.38)";
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(trackX, thumbY, SCROLLBAR_W, thumbH, SCROLLBAR_W / 2);
    } else {
      ctx.rect(trackX, thumbY, SCROLLBAR_W, thumbH);
    }
    ctx.fill();

    ctx.restore();
  }

  // -------------------------------------------------------
  // onEvent — handle wheel (mouse + synthesised touch momentum)
  // -------------------------------------------------------

  onEvent(node, event) {
    if (event.type !== "wheel") return false;

    this._ensureScroll(node);

    const deltaY   = event.originalEvent?.deltaY ?? 0;
    const maxOffset = this._maxOffset(node);

    node.scroll.offsetY = Math.min(
      Math.max(0, node.scroll.offsetY + deltaY),
      maxOffset
    );

    node.requestRender?.();
    return true; // consumed — stop propagation
  }

  onEventBubble(node, event) {
    return this.onEvent(node, event);
  }
}
