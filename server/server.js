import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

import { registerStatic } from "./src/http/static.js";

// Socket handlers
import { registerAuthHandlers } from "./src/socket/authHandlers.js";
import { registerFormHandlers } from "./src/socket/formHandlers.js";
import { registerFormResultsHandlers } from "./src/socket/formResultsHandlers.js";
import { registerArticleHandlers } from "./src/socket/articleHandlers.js";
import { registerReportHandlers } from "./src/socket/reportHandlers.js";

import { buildContainer } from "./src/bootstrap/buildContainer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const container = buildContainer();

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend (index.html + bundles)
registerStatic(app);

// Socket.IO handlers
io.on("connection", (socket) => {
 
  registerAuthHandlers(io, socket, { userAuth: container.resolve("userAuth"), authRepository: container.resolve("authRepository") });
  registerFormHandlers(io, socket, {
  formService: container.resolve("formService")
});

  registerFormResultsHandlers(io, socket);
  registerArticleHandlers(io, socket);
  registerReportHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 4500;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
