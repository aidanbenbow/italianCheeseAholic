export class UserAuth {
  constructor(authRepository, passwordHasher) {
    this.authRepository = authRepository;
    this.passwordHasher = passwordHasher;
  }

  async registerUser(username, password, role = "user") {
    const hashed = await this.passwordHasher.hash(password);
    return this.authRepository.createUser({
      userId: username,
      username,
      password: hashed,
      role,
    });
  }

  async authenticate(username, password) {
    const user = await this.authRepository.getUserByUsername(username);
    if (!user) return null;

    const valid = await this.passwordHasher.compare(password, user.password);
    return valid ? user : null;
  }
}
