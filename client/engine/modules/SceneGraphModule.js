export class SceneGraphModule {
  constructor(engine) {
    this.engine = engine;
    this.root = null;
  }

  setRoot(node) {
    this.root = node;
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
