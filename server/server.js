import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

import { registerStatic } from "./src/http/static.js";
import { buildContainer } from "./src/bootstrap/buildContainer.js";

// Backend app modules
import { registerBackend as registerAuth } from "../shared/auth/registerBackend.js";
import { registerBackend as registerFormBuilder } from "./src/application/formBuilder/registerBackend.js";
import { registerBackend as registerDorcas } from "./src/application/dorcasApp/registerBackend.js";
import { registerBackend as registerBlog } from "./src/application/blog/registerBackend.js";

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

// Register backend modules
registerAuth(container, io);
registerFormBuilder(container, io);
registerDorcas(container, io);
registerBlog(container, io, app);

// Serve static frontend (after API routes)
registerStatic(app);

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
