D:\italianCheeseAholic\server\server.js

registerStatic(app);

D:\italianCheeseAholic\client\src\index.js
bootstrapLauncher();

D:\italianCheeseAholic\client\src\engine\core\Engine.js
engine.start();

D:\italianCheeseAholic\client\src\engine\core\BaseEngine.js
this.mount();

 this.attachModules(this.lifecycleModules);

module?.attach?.();

 this.modules = [
      this.appLoader,
      this.commands,
      this.sceneGraph,
      this.ui
    ];

engine.start()
 → mount()
 → attach lifecycle modules
 → emit "engine:started"
 → bootstrap loads first app
 → app.mount(engine)
 → UI renders

 Signals → Effects → SceneNodes → Dirty Pipeline

## Engine module authoring guide

### Why

- Keep `Engine` pure and deterministic.
- Keep modules decoupled from each other.
- Keep `engine.context` stable and discoverable.

### Module contract

Each module should expose only what other modules/apps need via `contextExports()`.

```js
export class SomeModule {
  constructor(engine) {
    this.engine = engine;
  }

  contextExports() {
    return {
      someService: this
    };
  }

  attach() {}
  detach() {}
}
```

The engine automatically registers each module and merges its exports into `engine.context`.

### Should there be a BaseModule class?

Yes — as a lightweight optional foundation.

- Useful for shared ergonomics (`this.context`, `this.emit`, consistent `id`).
- Prevents repeated boilerplate in each module.
- Should stay minimal and unopinionated so modules remain flexible.

Base class location: [client/src/engine/modules/BaseModule.js](client/src/engine/modules/BaseModule.js)

```js
import { BaseModule } from "./BaseModule.js";

export class InputModule extends BaseModule {
  constructor(engine) {
    super(engine);
  }
}
```