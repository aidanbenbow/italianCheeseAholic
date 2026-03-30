export function registerBlogHandlers(io, container) {
  io.on("connection", (socket) => {
    const blogService = container.resolve("blogService");

    socket.on("blog:create", async (data, callback) => {
      try {
        const blogService = container.resolve("blogService");
        const title = typeof data?.title === "string" ? data.title.trim() : "";

        if (!title) {
          callback?.({ ok: false, error: "title is required" });
          return;
        }

        const now = Date.now();
        const article = {
          articleId: data?.articleId || `article-${now}`,
          title,
          content: data?.content ?? "",
          excerpt: data?.excerpt ?? "",
          slug: data?.slug ?? title.toLowerCase().replace(/\s+/g, "-"),
          status: data?.status ?? "draft",
          createdAt: data?.createdAt ?? now,
          updatedAt: now,
          createdBy: data?.createdBy ?? "system",
          updatedBy: "system",
          publishedAt: data?.publishedAt ?? 0,
          photo: data?.photo ?? ""
        };

        const result = await blogService.create(article);
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

export function registerBlogHttpRoutes(app, container, io) {
  app.post("/api/blog/articles", async (req, res) => {
    try {
      const blogService = container.resolve("blogService");
      const rawTitle = typeof req.body?.title === "string" ? req.body.title : "";
      const title = rawTitle.trim();

      if (!title) {
        res.status(400).json({ ok: false, error: "title is required" });
        return;
      }

      const now = Date.now();
      const article = {
        articleId: req.body?.articleId || `article-${now}`,
        title,
        content: req.body?.content ?? "",
        excerpt: req.body?.excerpt ?? "",
        slug: req.body?.slug ?? title.toLowerCase().replace(/\s+/g, "-"),
        status: req.body?.status ?? "draft",
        createdAt: req.body?.createdAt ?? now,
        updatedAt: now,
        createdBy: req.body?.createdBy ?? "system",
        updatedBy: "system",
        publishedAt: req.body?.publishedAt ?? 0,
        photo: req.body?.photo ?? ""
      };

      const created = await blogService.create(article);
      io?.emit?.("blog:created", created);
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
