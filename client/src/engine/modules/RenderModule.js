export class RendererModule {
  constructor(engine) {
    this.engine = engine;
    this.canvas = engine.context.canvas;
    this.ctx = this.canvas.getContext("2d");
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const scene = this.engine.sceneGraph;
    scene?.render(ctx);
  }

  destroy() {
    this.ctx = null;
    this.canvas = null;
  }
}
