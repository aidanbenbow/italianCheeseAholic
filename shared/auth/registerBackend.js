import { AuthRepository } from "./repositories/AuthRepository.js";
import { UserAuth } from "./services/UserAuth.js";
import { registerAuthHandlers } from "./handlers/authHandlers.js";

export function registerBackend(container, io) {
  container.singleton("authRepository", () =>
    new AuthRepository(container.resolve("docClient"))
  );

  container.singleton("authService", (c) =>
    new UserAuth(
      c.resolve("authRepository"),
      c.resolve("passwordHasher")
    )
  );

  registerAuthHandlers(io, container);
}
