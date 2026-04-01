
import { docClient } from "../infrastructure/db/dynamoClient.js";
import { passwordHasher } from "../infrastructure/security/passwordHasher.js";
import { Container } from "./Container.js";

export function buildContainer() {
  const c = new Container();

  // Shared infrastructure
  c.instance("docClient", docClient);
  c.instance("passwordHasher", passwordHasher);

  return c;
}
