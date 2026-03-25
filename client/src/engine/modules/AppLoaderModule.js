import { BaseModule } from "./BaseModule.js";

export class AppLoaderModule extends BaseModule {
  constructor(engine) {
    super(engine);
    this.currentApp = null;
  }

  contextExports() {
    return {
      appLoader: this,
      activeApp: this.currentApp
    };
  }

  async loadApp(appName) {
    try {
      // Unmount previous app if it has a cleanup function
      if (this.currentApp?.unmount) {
        this.currentApp.unmount(this.engine);
      }

      // Dynamically import the app
      const appModule = await import(`/src/apps/${appName}/main.js`);

      // Mount the new app
      if (typeof appModule.mount === "function") {
        appModule.mount(this.engine);
      } else {
        console.warn(`App "${appName}" has no mount() function`);
      }

      this.currentApp = appModule;
      this.engine.context.activeApp = this.currentApp;

      // Only emit if someone is listening
      if (this.engine.eventListeners.get("app:loaded")?.size) {
        this.engine.emit("app:loaded", { name: appName });
      }
    } catch (err) {
      console.error(`Failed to load app "${appName}"`, err);
      
      // Only emit if someone is listening
      if (this.engine.eventListeners.get("app:error")?.size) {
        this.engine.emit("app:error", { name: appName, error: err });
      }
    }
  }

  destroy() {
    if (this.currentApp?.unmount) {
      this.currentApp.unmount(this.engine);
    }
    this.currentApp = null;
    this.engine.context.activeApp = null;
  }
}
