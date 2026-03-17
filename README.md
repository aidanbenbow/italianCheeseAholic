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