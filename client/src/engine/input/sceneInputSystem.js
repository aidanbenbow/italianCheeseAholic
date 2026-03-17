// SceneInputSystem.js
import { SceneEvent } from "./sceneEvent.js";
import { SceneEventDispatcher } from "./sceneEventDispatcher.js";
import { SceneHitTestSystem } from "./sceneHitTestSystem.js";

export class SceneInputSystem {
  constructor({ canvas, rendererContext }) {
    this.canvas = canvas;
    this.ctx = rendererContext.ctx;
    this.toSceneCoords = rendererContext.toSceneCoords;
    this.getRoot = () => rendererContext.pipeline?.root;

    this.dispatcher = new SceneEventDispatcher();
    this.hitTest = new SceneHitTestSystem();

    // Touch → mouse suppression
    this._ignoreMouseUntil = 0;

    // Touch scroll state
    this._lastTouch = null;
    this._lastTouchMoveY = null;
    this._lastTouchMoveTime = 0;
    this._touchVelocityY = 0;
    this._touchScrollTarget = null;
    this._touchMomentumFrame = null;

    this.touchScrollMultiplier = 1.6;
    this.touchScrollFriction = 0.96;
    this.touchScrollMinVelocity = 0.01;

    // Pointer tracking
    this.lastPointerTarget = null;

    this._bind();
  }

  // -------------------------------------------------------
  // Event binding
  // -------------------------------------------------------
  _bind() {
    this.canvas.addEventListener("mousemove", e => this._handleMouse(e, "mousemove"));
    this.canvas.addEventListener("mousedown", e => this._handleMouse(e, "mousedown"));
    this.canvas.addEventListener("mouseup",   e => this._handleMouse(e, "mouseup"));
    this.canvas.addEventListener("click",     e => this._handleMouse(e, "click"));
    this.canvas.addEventListener("dblclick",  e => this._handleMouse(e, "dblclick"));
    this.canvas.addEventListener("wheel",     e => this._handleWheel(e), { passive: false });

    this.canvas.addEventListener("touchstart", e => this._handleTouch(e, "mousedown"), { passive: false });
    this.canvas.addEventListener("touchmove",  e => this._handleTouch(e, "mousemove"), { passive: false });
    this.canvas.addEventListener("touchend",   e => this._handleTouch(e, "mouseup"));
  }

  // -------------------------------------------------------
  // Coordinate conversion helper
  // -------------------------------------------------------
  _getSceneCoords(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;

    return this.toSceneCoords(canvasX, canvasY);
  }

  // -------------------------------------------------------
  // Mouse handling
  // -------------------------------------------------------
  _handleMouse(e, type) {
    if (this._ignoreMouseUntil && Date.now() < this._ignoreMouseUntil) return;

    const { x, y } = this._getSceneCoords(e.clientX, e.clientY);
    this._dispatchPointer(type, x, y, e);
  }

  // -------------------------------------------------------
  // Touch handling
  // -------------------------------------------------------
  _handleTouch(e, type) {
    if (["mousedown", "mousemove", "mouseup"].includes(type)) {
      e.preventDefault();
    }

    this._ignoreMouseUntil = Date.now() + 1200;

    const touch = e.touches[0] || e.changedTouches[0];
    if (!touch) return;

    // Double-tap detection
    if (type === "mousedown") {
      const now = Date.now();
      const last = this._lastTouch;
      const dx = last ? Math.abs(touch.clientX - last.x) : 0;
      const dy = last ? Math.abs(touch.clientY - last.y) : 0;
      const isDoubleTap = last && now - last.time < 350 && dx < 24 && dy < 24;

      this._lastTouch = { time: now, x: touch.clientX, y: touch.clientY };

      if (isDoubleTap) {
        const { x, y } = this._getSceneCoords(touch.clientX, touch.clientY);
        this._dispatchPointer("dblclick", x, y, e);
        return;
      }

      // Reset momentum
      if (this._touchMomentumFrame) {
        cancelAnimationFrame(this._touchMomentumFrame);
        this._touchMomentumFrame = null;
      }

      this._lastTouchMoveY = touch.clientY;
      this._lastTouchMoveTime = performance.now();
      this._touchVelocityY = 0;
      this._touchScrollTarget = null;
    }

    // Touch scrolling
    if (type === "mousemove") {
      const now = performance.now();
      const deltaY = this._lastTouchMoveY !== null
        ? (this._lastTouchMoveY - touch.clientY) * this.touchScrollMultiplier
        : 0;

      const dt = Math.max(1, now - this._lastTouchMoveTime);
      const velocity = deltaY / dt;

      this._lastTouchMoveY = touch.clientY;
      this._lastTouchMoveTime = now;

      if (Math.abs(deltaY) > 0) {
        const scrollTarget = this._findScrollableTarget(touch.clientX, touch.clientY);
        if (scrollTarget) {
          this._touchVelocityY = this._touchVelocityY * 0.7 + velocity * 0.3;
          this._touchScrollTarget = scrollTarget;

          const scrollEvent = new SceneEvent({
            type: "wheel",
            x: scrollTarget.x,
            y: scrollTarget.y,
            target: scrollTarget.target,
            originalEvent: { deltaY }
          });

          this.dispatcher.dispatch(scrollEvent);
          return;
        }
      }
    }

    if (type === "mouseup") {
      if (this._touchScrollTarget && Math.abs(this._touchVelocityY) > this.touchScrollMinVelocity) {
        this._startTouchMomentum();
      }
    }

    const { x, y } = this._getSceneCoords(touch.clientX, touch.clientY);
    this._dispatchPointer(type, x, y, e);
  }

  // -------------------------------------------------------
  // Wheel handling
  // -------------------------------------------------------
  _handleWheel(e) {
    e.preventDefault();

    const { x, y } = this._getSceneCoords(e.clientX, e.clientY);
    const root = this.getRoot();
    const target = this.hitTest.hitTest(root, x, y, this.ctx);

    const event = new SceneEvent({
      type: "wheel",
      x,
      y,
      target,
      originalEvent: e
    });

    this.dispatcher.dispatch(event);
  }

  // -------------------------------------------------------
  // Scrollable target detection
  // -------------------------------------------------------
  _findScrollableTarget(clientX, clientY) {
    const { x, y } = this._getSceneCoords(clientX, clientY);
    let target = this.hitTest.hitTest(this.getRoot(), x, y, this.ctx);

    while (target) {
      if (target.scroll) return { target, x, y };
      target = target.parent;
    }

    return null;
  }

  // -------------------------------------------------------
  // Touch momentum scrolling
  // -------------------------------------------------------
  _startTouchMomentum() {
    let velocity = this._touchVelocityY;
    let lastTime = performance.now();
    const scrollTarget = this._touchScrollTarget;

    const step = () => {
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      lastTime = now;

      const deltaY = velocity * dt;

      if (Math.abs(deltaY) > 0.01) {
        const scrollEvent = new SceneEvent({
          type: "wheel",
          x: scrollTarget.x,
          y: scrollTarget.y,
          target: scrollTarget.target,
          originalEvent: { deltaY }
        });

        this.dispatcher.dispatch(scrollEvent);
      }

      velocity *= Math.pow(this.touchScrollFriction, dt / 16);

      if (Math.abs(velocity) <= this.touchScrollMinVelocity) {
        this._touchMomentumFrame = null;
        return;
      }

      this._touchMomentumFrame = requestAnimationFrame(step);
    };

    this._touchMomentumFrame = requestAnimationFrame(step);
  }

  // -------------------------------------------------------
  // Pointer dispatch (enter/leave/down/up/dblclick)
  // -------------------------------------------------------
  _dispatchPointer(type, x, y, originalEvent) {
    const root = this.getRoot();
    const target = this.hitTest.hitTest(root, x, y, this.ctx);

    // Hover transitions
    if (target !== this.lastPointerTarget) {
      this.lastPointerTarget?.onPointerLeave?.();
      target?.onPointerEnter?.();
      this.lastPointerTarget = target;
    }

    if (target) {
      if (type === "mousedown") target.onPointerDown?.(x, y);
      if (type === "mouseup")   target.onPointerUp?.(x, y);
      if (type === "dblclick")  target.onPointerDoubleClick?.(x, y);
    }

    // SceneEvent dispatch
    const event = new SceneEvent({ type, x, y, target, originalEvent });
    this.dispatcher.dispatch(event);
  }
}