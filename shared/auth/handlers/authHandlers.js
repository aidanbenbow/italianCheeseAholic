export function registerAuthHandlers(io, container) {
  io.on("connection", (socket) => {
    const authService = container.resolve("authService");

    socket.on("auth:login", async ({ email, password }, callback) => {
      const user = await authService.authenticate(email, password);
      callback(user);
    });

    socket.on("auth:register", async ({ email, password }, callback) => {
      const user = await authService.registerUser(email, password);
      callback(user);
    });
  });
}
