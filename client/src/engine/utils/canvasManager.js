// canvasManager.js
function resizeCanvas(canvas, width, height) {
  const dpr = window.devicePixelRatio || 1;

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  canvas.style.width = width + "px";
  canvas.style.height = height + "px";

  const ctx = canvas.getContext("2d");

  // IMPORTANT:
  // We do NOT scale the main scene context because the engine
  // works in scene coordinates, not device pixels.
  // Overlay layers *may* scale later if needed.

  return ctx;
}

export class CanvasManager {
  constructor(config) {
    this.layers = {};
    this.config = config;

    this._initLayers();
    window.addEventListener("resize", () => this.resizeAll());
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

    const dpr = window.devicePixelRatio || 1;

    return {
      width: canvas.width / dpr,
      height: canvas.height / dpr
    };
  }

  toSceneCoords(layerName, canvasX, canvasY) {
    const layer = this.layers[layerName];
    if (!layer) return { x: canvasX, y: canvasY };

    const dpr = window.devicePixelRatio || 1;

    return {
      x: canvasX * dpr,
      y: canvasY * dpr
    };
  }
}

// /render/core/CanvasManager.js

// export class CanvasManager {
//   constructor(layerConfig = {}) {
//     this.layers = {};
//     this._initLayers(layerConfig);
//   }

//   // -------------------------------------------------------
//   // Initialize canvas layers
//   // -------------------------------------------------------
//   _initLayers(layerConfig) {
//     for (const [layerName, cfg] of Object.entries(layerConfig)) {
//       const canvas = document.querySelector(cfg.mainId);
//       if (!canvas) {
//         console.warn(`CanvasManager: Missing canvas for layer "${layerName}"`);
//         continue;
//       }

//       const ctx = canvas.getContext("2d");

//       this.layers[layerName] = {
//         canvas,
//         ctx,
//         bg: cfg.bg || "transparent"
//       };
//     }
//   }

//   // -------------------------------------------------------
//   // Get 2D context for a layer
//   // -------------------------------------------------------
//   getContext(layerName) {
//     return this.layers[layerName]?.ctx || null;
//   }

//   // -------------------------------------------------------
//   // Get canvas size for a layer
//   // -------------------------------------------------------
//   getCanvasSize(layerName) {
//     const canvas = this.layers[layerName]?.canvas;
//     if (!canvas) return { maxWidth: 0, maxHeight: 0 };

//     return {
//       maxWidth: canvas.width,
//       maxHeight: canvas.height
//     };
//   }

//   // -------------------------------------------------------
//   // Convert canvas coords → scene coords
//   // -------------------------------------------------------
//   toSceneCoords(layerName, x, y) {
//     const canvas = this.layers[layerName]?.canvas;
//     if (!canvas) return { x, y };

//     const rect = canvas.getBoundingClientRect();
//     const scaleX = canvas.width / rect.width;
//     const scaleY = canvas.height / rect.height;

//     return {
//       x: (x - rect.left) * scaleX,
//       y: (y - rect.top) * scaleY
//     };
//   }
// }