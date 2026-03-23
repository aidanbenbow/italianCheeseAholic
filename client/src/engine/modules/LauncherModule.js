// /modules/LauncherModule.js

import { BaseModule } from "./BaseModule.js";

export class LauncherModule extends BaseModule {
  constructor(engine) {
    super(engine);
    this.manifest = null;
    this.loaded = false;
  }

  contextExports() {
    return {
      launcher: this,
      manifest: this.manifest
    };
  }

  /**
   * Load runtime.json (or any manifest URL)
   */
  async loadManifest(url = "/src/runtime.json") {
    try {
      const res = await fetch(url);
      this.manifest = await res.json();
      this.engine.context.manifest = this.manifest;

      console.log("LauncherModule: Loaded manifest:", this.manifest);

      this.engine.emit("launcher:manifestLoaded", this.manifest);
      return this.manifest;
    } catch (err) {
      console.error("LauncherModule: Failed to load manifest", err);
      throw err;
    }
  }

  /**
   * Launch the default app (first in manifest.apps)
   */
  async launchDefaultApp() {
    if (!this.manifest) {
      throw new Error("LauncherModule: No manifest loaded");
    }

    const apps = this.manifest.apps || [];
    if (!apps.length) {
      console.warn("LauncherModule: No apps defined in manifest");
      return;
    }

    const firstApp = apps[0];
    return this.launchApp(firstApp);
  }

  /**
   * Launch a specific app by name
   */
  async launchApp(appName) {
    if (!this.manifest) {
      throw new Error("LauncherModule: No manifest loaded");
    }

    console.log(`LauncherModule: Launching app "${appName}"`);

    await this.engine.appLoader.loadApp(appName);

    this.engine.emit("launcher:appLaunched", { appName });
    this.loaded = true;
  }
}