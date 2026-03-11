import express from "express";
import path from "path";

export function registerStatic(app) {
  // Absolute path to your built frontend
  const distPath = path.join(process.cwd(), "client", "dist");

  // Serve static assets (JS, CSS, images)
  app.use(express.static(distPath));

  // SPA fallback — must be last
  app.use((req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
