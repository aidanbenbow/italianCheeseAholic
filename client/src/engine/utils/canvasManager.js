// canvasManager.js
function resizeCanvas(canvas, width, height) {
  if (!canvas) return null;

  const dpr = window.devicePixelRatio || 1;
  const backingWidth = Math.round(width * dpr);
  const backingHeight = Math.round(height * dpr);

  const sameLogical =
    canvas._logicalWidth === width &&
    canvas._logicalHeight === height &&
    canvas._dpr === dpr;

  if (sameLogical) {
    return canvas.getContext("2d");
  }

  canvas._logicalWidth = width;
  canvas._logicalHeight = height;
  canvas._dpr = dpr;

  canvas.width = backingWidth;
  canvas.height = backingHeight;

  canvas.style.width = width + "px";
  canvas.style.height = height + "px";

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Scale so draw calls can stay in logical scene units.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  return ctx;
}

export class CanvasManager {
  constructor(config) {
    this.layers = {};
    this.config = config;
    this._resizeHandler = () => this.resizeAll();
    this._dprMediaQuery = null;
    this._dprChangeHandler = () => {
      this.resizeAll();
      this._bindDprListener();
    };

    this._initLayers();
    window.addEventListener("resize", this._resizeHandler);
    this._bindDprListener();
  }

  _addMediaQueryChangeListener(mediaQuery, handler) {
    if (!mediaQuery) return;

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handler);
    } else if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(handler);
    }
  }

  _removeMediaQueryChangeListener(mediaQuery, handler) {
    if (!mediaQuery) return;

    if (typeof mediaQuery.removeEventListener === "function") {
      mediaQuery.removeEventListener("change", handler);
    } else if (typeof mediaQuery.removeListener === "function") {
      mediaQuery.removeListener(handler);
    }
  }

  _bindDprListener() {
    if (this._dprMediaQuery) {
      this._removeMediaQueryChangeListener(
        this._dprMediaQuery,
        this._dprChangeHandler
      );
    }

    const dpr = window.devicePixelRatio || 1;
    this._dprMediaQuery = window.matchMedia(`(resolution: ${dpr}dppx)`);
    this._addMediaQueryChangeListener(this._dprMediaQuery, this._dprChangeHandler);
  }

  // -------------------------------------------------------
  // Initialization
  // -------------------------------------------------------
  _initLayers() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    for (const layerName in this.config) {
      const layerConfig = this.config[layerName];

      const mainCanvas = document.querySelector(layerConfig.mainId);
      const hitCanvas = layerConfig.hitId
        ? document.querySelector(layerConfig.hitId)
        : null;

      const ctx = resizeCanvas(mainCanvas, width, height);
      const hitCtx = hitCanvas ? resizeCanvas(hitCanvas, width, height) : null;

      mainCanvas.style.backgroundColor = layerConfig.bg || "transparent";
      if (hitCanvas) {
        hitCanvas.style.backgroundColor = layerConfig.hitBg || "transparent";
      }

      this.layers[layerName] = {
        canvas: mainCanvas,
        hitCanvas,
        ctx,
        hitCtx,
        bg: layerConfig.bg,
        hitBg: layerConfig.hitBg
      };
    }
  }

  // -------------------------------------------------------
  // Resizing
  // -------------------------------------------------------
  resizeAll() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    for (const layerName in this.layers) {
      const layer = this.layers[layerName];

      layer.ctx = resizeCanvas(layer.canvas, width, height);

      if (layer.hitCanvas) {
        layer.hitCtx = resizeCanvas(layer.hitCanvas, width, height);
      }
    }
  }

  // -------------------------------------------------------
  // Context Access
  // -------------------------------------------------------
  getContext(layerName = "main") {
    return this.layers[layerName]?.ctx || null;
  }

  getHitContext(layerName = "main") {
    return this.layers[layerName]?.hitCtx || null;
  }

  getCanvas(layerName = "main") {
    return this.layers[layerName]?.canvas || null;
  }

  // -------------------------------------------------------
  // Scene Coordinate Helpers
  // -------------------------------------------------------
  getCanvasSize(layerName = "main") {
    const canvas = this.layers[layerName]?.canvas;
    if (!canvas) return { width: 0, height: 0 };

    return {
      width: canvas._logicalWidth ?? canvas.width,
      height: canvas._logicalHeight ?? canvas.height
    };
  }

  toSceneCoords(layerName, canvasX, canvasY) {
    const layer = this.layers[layerName];
    if (!layer) return { x: canvasX, y: canvasY };

    return {
      x: canvasX,
      y: canvasY
    };
  }

  destroy() {
    window.removeEventListener("resize", this._resizeHandler);

    if (this._dprMediaQuery) {
      this._removeMediaQueryChangeListener(
        this._dprMediaQuery,
        this._dprChangeHandler
      );
      this._dprMediaQuery = null;
    }
  }
}

