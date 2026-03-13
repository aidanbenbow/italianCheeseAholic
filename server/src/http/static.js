import express from "express";
import path from "path";

// export function registerStatic(app) {
//   // // Absolute path to your built frontend
//   // const distPath = path.join(process.cwd(), "client", "dist");

//   // // Serve static assets (JS, CSS, images)
//   // app.use(express.static(distPath));

//   app.use("/src", express.static(path.join(process.cwd(), "client", "src")));
// app.use(express.static(path.join(process.cwd(), "client")));

//   // SPA fallback — must be last
//   app.use((req, res) => {
//     res.sendFile(path.join(distPath, "index.html"));
//   });
// }

export function registerStatic(app) {
  const clientPath = path.join(process.cwd(), "client");
  const srcPath = path.join(clientPath, "src");

  // 1. Serve ES modules FIRST
  app.use("/src", express.static(srcPath));

  // 2. Serve root-level static files
  app.use(express.static(clientPath));

  // 3. SPA fallback LAST
  app.use((req, res) => {
    res.sendFile(path.join(srcPath, "index.html"));
  });
}
