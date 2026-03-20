import express from "express";
import path from "path";


export function registerStatic(app) {
  const clientPath = path.join(process.cwd(), "client");
  const srcPath = path.join(clientPath, "src");

  // 1. Serve ES modules FIRST
  app.use("/src", express.static(srcPath));

  // 2. Serve root-level static files
  app.use(express.static(clientPath));

  // 3. SPA fallback LAST
  app.use((req, res) => {
    if (req.path.startsWith("/api/")) {
      res.status(404).json({ ok: false, error: "API route not found" });
      return;
    }

    res.sendFile(path.join(srcPath, "index.html"));
  });
}
