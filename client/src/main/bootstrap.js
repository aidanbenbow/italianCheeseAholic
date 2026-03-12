import { Engine } from "../../engine/core/Engine.js";


export async function bootstrapLauncher() {
  console.log("CanvasApp bootstrap running");

  const manifest = await fetch("/runtime.json").then(r => r.json());
  console.log("Loaded manifest:", manifest);

  const engine = new Engine({ manifest });
  console.log("Engine created:", engine);
  engine.start();

  const firstApp = manifest.apps[0];
  engine.appLoader.loadApp(firstApp);
}
