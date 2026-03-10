import path from "path";
import express from "express";

export function registerStatic(app) {
  const clientPath = path.join(process.cwd(), "../client/public");
  app.use(express.static(clientPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
}
