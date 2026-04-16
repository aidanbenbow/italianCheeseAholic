export function registerDorcasHandlers(io, container) {
  io.on("connection", (socket) => {
    const dorcasService = container.resolve("dorcasService");

    socket.on("dorcas:fetchReports", async (_payload, callback) => {
      try {
        const reports = await dorcasService.fetchAll();
        callback?.({ ok: true, data: reports });
      } catch (error) {
        callback?.({ ok: false, error: error?.message ?? "Failed to fetch reports" });
      }
    });

    socket.on("dorcas:getReport", async (id, callback) => {
      try {
        const report = await dorcasService.fetch(id);
        callback?.({ ok: true, data: report });
      } catch (error) {
        callback?.({ ok: false, error: error?.message ?? "Failed to fetch report" });
      }
    });

    socket.on("dorcas:saveReport", async (payload, callback) => {
      try {
        const saved = await dorcasService.save(payload);
        io?.emit?.("dorcas:saved", saved);
        callback?.({ ok: true, data: saved });
      } catch (error) {
        callback?.({ ok: false, error: error?.message ?? "Failed to save report" });
      }
    });
  });
}

export function registerDorcasHttpRoutes(app, container, io) {
  app.get("/api/dorcas/reports", async (_req, res) => {
    try {
      const dorcasService = container.resolve("dorcasService");
      const reports = await dorcasService.fetchAll();
      res.json({ ok: true, data: reports });
    } catch (error) {
      res.status(500).json({ ok: false, error: error?.message ?? "Failed to fetch reports" });
    }
  });

  app.get("/api/dorcas/reports/:reportId", async (req, res) => {
    try {
      const dorcasService = container.resolve("dorcasService");
      const report = await dorcasService.fetch(req.params.reportId);

      if (!report) {
        res.status(404).json({ ok: false, error: "Report not found" });
        return;
      }

      res.json({ ok: true, data: report });
    } catch (error) {
      res.status(500).json({ ok: false, error: error?.message ?? "Failed to fetch report" });
    }
  });

  app.post("/api/dorcas/reports", async (req, res) => {
    try {
      const dorcasService = container.resolve("dorcasService");
      const saved = await dorcasService.save(req.body ?? {});
      io?.emit?.("dorcas:saved", saved);
      res.status(201).json({ ok: true, data: saved });
    } catch (error) {
      res.status(500).json({ ok: false, error: error?.message ?? "Failed to save report" });
    }
  });
}
