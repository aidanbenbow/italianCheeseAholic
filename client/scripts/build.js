import fs from "fs-extra";
import path from "path";

const root = process.cwd();
const src = path.join(root, "src");
const dist = path.join(root, "dist");

export async function build() {

  // Clean
  await fs.remove(dist);

  // Copy files
  await fs.copy(src, dist);

  // Detect apps
  const appsDir = path.join(src, "apps");

  let apps = [];

  if (await fs.pathExists(appsDir)) {
    apps = (await fs.readdir(appsDir))
      .filter(name => !name.startsWith("."));
  }

  // Runtime manifest
  const manifest = {
    engineVersion: "1.0.0",
    apps
  };

  await fs.writeJson(
    path.join(dist, "runtime.json"),
    manifest,
    { spaces: 2 }
  );

  console.log("✔ Build complete");
}

if (process.argv.includes("--build")) {
  await build();
}