import { Container } from "./container.js";
import { docClient } from "../infrastructure/db/dynamoClient.js";

import { UserRepository } from "../infrastructure/repositories/userRepo.js";
import { passwordHasher } from "../infrastructure/security/passwordHasher.js";

import UserAuth from "../application/services/UserAuth.js";
import { FormRepository } from "../infrastructure/repositories/formRepo.js";
import FormService from "../application/services/FormServices.js";

export function buildContainer() {
  const c = new Container();

  c.instance("docClient", docClient);

  c.singleton("userRepo", (c) => new UserRepository(c.resolve("docClient")));
  c.singleton('formRepo', (c) => new FormRepository(c.resolve("docClient")));

  c.singleton('formService', (c) => new FormService(c.resolve('formRepo')));

  c.instance("passwordHasher", passwordHasher);

  c.singleton("userAuth", (c) =>
    new UserAuth(
      c.resolve("userRepo"),
      c.resolve("passwordHasher")
    )
  );

  return c;
}
