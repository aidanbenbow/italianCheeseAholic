export function registerBlogHandlers(io, container) {
  io.on("connection", (socket) => {
    const articleService = container.resolve("articleService");

    socket.on("blog:create", async (data, callback) => {
      const result = await articleService.createArticle(data);
      callback(result);
    });

    socket.on("blog:list", async (_, callback) => {
      const articles = await articleService.listArticles();
      callback(articles);
    });

    socket.on("blog:get", async (id, callback) => {
      const article = await articleService.getArticle(id);
      callback(article);
    });
  });
}
