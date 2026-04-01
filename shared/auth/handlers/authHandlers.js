import { toPublicUser } from "../http/sessionAuth.js";

export function registerAuthHandlers(io, container) {
  io.on("connection", (socket) => {
    const authService = container.resolve("authService");

    socket.on("auth:login", async ({ username, password }, callback) => {
      const user = await authService.authenticate(username, password);
      const sessionUser = user ? toPublicUser(user) : null;
      socket.data.user = sessionUser;
      callback(sessionUser);
    });

    socket.on("auth:register", async ({ username, password, role }, callback) => {
      const user = await authService.registerUser(username, password, role);
      callback(toPublicUser(user));
    });
  });
}

export function registerAuthHttpRoutes(app, container) {
  app.post("/api/auth/login", async (req, res) => {
    try {
      const authService = container.resolve("authService");
      const username = String(req.body?.username ?? "").trim();
      const password = String(req.body?.password ?? "");

      if (!username || !password) {
        res.status(400).json({ ok: false, error: "Username and password are required" });
        return;
      }

      const user = await authService.authenticate(username, password);

      if (!user) {
        res.status(401).json({ ok: false, error: "Invalid username or password" });
        return;
      }

      const sessionUser = toPublicUser(user);
      req.session.user = sessionUser;
      req.session.save(() => {
        res.json({ ok: true, data: sessionUser });
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error?.message ?? "Login failed" });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    res.json({ ok: true, data: req.session?.user ?? null });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("italiancheeseaholic.sid");
      res.json({ ok: true });
    });
  });
}
