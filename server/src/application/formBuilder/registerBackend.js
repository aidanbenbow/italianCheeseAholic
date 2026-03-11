

import { registerFormHandlers } from "./handlers/formHandlers.js";
import { FormRepository } from "./repositories/formRepository.js";
import FormService from "./services/FormService.js";

export function registerBackend(container, io) {
  container.singleton("formRepository", () =>
    new FormRepository(container.resolve("docClient"))
  );

  container.singleton("formService", (c) =>
    new FormService(c.resolve("formRepository"))
  );

  registerFormHandlers(io, container);
}
