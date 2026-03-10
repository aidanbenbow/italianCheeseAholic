// socket/authHandlers.js
import crypto from "crypto";
import { authRepository } from "../repos/authRepo.js";

export function registerAuthHandlers(io, socket, { userAuth }) {

  socket.on("registerUser", async ({ username, password }) => {
    try {
      await userAuth.registerUser(username, password);
      socket.emit("registerUserResponse", { success: true });
    } catch (e) {
      socket.emit("registerUserResponse", { success: false, error: e.message });
    }
  });

  socket.on("loginUser", async ({ username, password }) => {
    try {
      const valid = await userAuth.authenticateUser(username, password);
      if (!valid) {
        socket.emit("loginUserResponse", { success: false, error: "Invalid credentials" });
        return;
      }

      const token = crypto.randomBytes(32).toString("hex");
      await authRepository.saveSession(token, username);

      socket.emit("loginUserResponse", { success: true, token });
    } catch (e) {
      socket.emit("loginUserResponse", { success: false, error: e.message });
    }
  });

  socket.on("validateSession", async ({ token }) => {
    try {
      const session = await authRepository.getSession(token);
      const username = session?.username || null;
      socket.emit("validateSessionResponse", { valid: !!username, username });
    } catch {
      socket.emit("validateSessionResponse", { valid: false, username: null });
    }
  });
}
