
import { registerDorcasHandlers, registerDorcasHttpRoutes } from "./handlers/dorcasHandlers.js";
import { DorcasRepository } from "./repositories/DorcasRepository.js";
import DorcasService from "./services/DorcasService.js";



export function registerBackend(container, io, app) {
  container.singleton("dorcasRepository", () =>
    new DorcasRepository(container.resolve("docClient"))
  );

  container.singleton("dorcasService", (c) =>
    new DorcasService(c.resolve("dorcasRepository"))
  );

  registerDorcasHandlers(io, container);

  if (app) {
    registerDorcasHttpRoutes(app, container, io);
  }
}
