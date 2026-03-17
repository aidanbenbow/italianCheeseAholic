export class SceneGraphModule {
  constructor(engine) {
    this.engine = engine;
    this.root = null;
  }

  attach() {
    if (this.root && this.engine.renderer?.getPipeline) {
      const mainPipeline = this.engine.renderer.getPipeline("main");
      mainPipeline?.setRoot?.(this.root);
    }
  }

  setRoot(node) {
    this.root = node;

    if (this.engine.renderer?.getPipeline) {
      const mainPipeline = this.engine.renderer.getPipeline("main");
      mainPipeline?.setRoot?.(node);
    }
  }

  update(dt) {
    this.root?.update(dt, { engine: this.engine });
  }

  render(ctx) {
    this.root?.render(ctx);
  }

  destroy() {
    this.root = null;
  }
}
