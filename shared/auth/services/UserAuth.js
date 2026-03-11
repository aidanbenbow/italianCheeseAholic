export class UserAuth {
  constructor(authRepository, passwordHasher) {
    this.authRepository = authRepository;
    this.passwordHasher = passwordHasher;
  }

  async registerUser(email, password) {
    const hashed = await this.passwordHasher.hash(password);
    return this.authRepository.createUser({ email, password: hashed });
  }

  async authenticate(email, password) {
    const user = await this.authRepository.getUserByEmail(email);
    if (!user) return null;

    const valid = await this.passwordHasher.compare(password, user.password);
    return valid ? user : null;
  }
}
