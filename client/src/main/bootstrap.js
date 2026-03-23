import { Engine } from "../engine/core/Engine.js";


export async function bootstrapLauncher() {
  console.log("CanvasApp bootstrap running");

  const engine = new Engine();

  // Start the engine
  engine.start();

  // Load the manifest
  await engine.launcher.loadManifest('/src/runtime.json');
  // Launch the default app
  await engine.launcher.launchDefaultApp();
}
