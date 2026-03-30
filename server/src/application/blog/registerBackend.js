import { BlogRepository } from "./repositories/BlogRepository.js";

import { registerBlogHandlers, registerBlogHttpRoutes } from "./handlers/blogHandlers.js";
import BlogService from "./services/BlogService.js";

export function registerBackend(container, io, app) {
  container.singleton("blogRepository", () =>
    new BlogRepository(container.resolve("docClient"))
  );

  container.singleton("blogService", (c) =>
    new BlogService(c.resolve("blogRepository"))
  );

  registerBlogHandlers(io, container);
  if (app) {
    registerBlogHttpRoutes(app, container, io);
  }
}
