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
  app.post("/api/blog/articles", async (req, res) => {
    try {
      const blogService = container.resolve("blogService");
      const rawTitle = typeof req.body?.title === "string" ? req.body.title : "";
      const title = rawTitle.trim();

      if (!title) {
        res.status(400).json({ ok: false, error: "title is required" });
        return;
      }

      const article = {
        articleId: req.body?.articleId || `article-${Date.now()}`,
        title,
        createdAt: req.body?.createdAt || new Date().toISOString()
      };

     // const created = await blogService.create(article);
     console.log("Received article creation request", article);
      res.status(201).json({ ok: true, data: created });
    } catch (error) {
      res.status(500).json({ ok: false, error: error?.message ?? "Failed to create article" });
    }
  });

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
