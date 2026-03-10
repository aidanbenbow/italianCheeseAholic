export default class UserAuth {
  constructor(userRepo, passwordHasher) {
    this.userRepo = userRepo;
    this.passwordHasher = passwordHasher;
  }

  async registerUser(username, password) {
    const hashed = await this.passwordHasher.hash(password);
    await this.userRepo.saveUser({ username, password: hashed });
    return true;
  }

  async authenticateUser(username, password) {
    const user = await this.userRepo.getUser(username);
    if (!user) return false;
    return this.passwordHasher.compare(password, user.password);
  }
}
