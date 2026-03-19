export function registerBlogHandlers(io, container) {
  io.on("connection", (socket) => {
    const blogService = container.resolve("blogService");

    socket.on("blog:create", async (data, callback) => {
      try {
        const result = await blogService.create(data);
        callback?.({ ok: true, data: result });
      } catch (error) {
        callback?.({ ok: false, error: error?.message ?? "Failed to create article" });
      }
    });

    socket.on("blog:list", async (_, callback) => {
      try {
        const articles = await blogService.fetchAll();
        callback?.({ ok: true, data: articles });
      } catch (error) {
        callback?.({ ok: false, error: error?.message ?? "Failed to list articles" });
      }
    });

    socket.on("blog:get", async (articleId, callback) => {
      try {
        const article = await blogService.fetch(articleId);
        callback?.({ ok: true, data: article });
      } catch (error) {
        callback?.({ ok: false, error: error?.message ?? "Failed to fetch article" });
      }
    });
  });
}

export function registerBlogHttpRoutes(app, container) {
  app.get("/api/blog/articles", async (_req, res) => {
    try {
      const blogService = container.resolve("blogService");
      const articles = await blogService.fetchAll();
      res.json({ ok: true, data: articles });
    } catch (error) {
      res.status(500).json({ ok: false, error: error?.message ?? "Failed to list articles" });
    }
  });

  app.get("/api/blog/articles/:articleId", async (req, res) => {
    try {
      const blogService = container.resolve("blogService");
      const article = await blogService.fetch(req.params.articleId);

      if (!article) {
        res.status(404).json({ ok: false, error: "Article not found" });
        return;
      }

      res.json({ ok: true, data: article });
    } catch (error) {
      res.status(500).json({ ok: false, error: error?.message ?? "Failed to fetch article" });
    }
  });
}
