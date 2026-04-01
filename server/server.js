import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

import express from "express";
import http from "http";
import session from "express-session";
import { Server } from "socket.io";

import { registerStatic } from "./src/http/static.js";

// Backend app modules
import { registerBackend as registerAuth } from "../shared/auth/registerBackend.js";
import { registerBackend as registerFormBuilder } from "./src/application/formBuilder/registerBackend.js";
import { registerBackend as registerDorcas } from "./src/application/dorcasApp/registerBackend.js";
import { registerBackend as registerBlog } from "./src/application/blog/registerBackend.js";

// Dynamic import so buildContainer loads AFTER dotenv.config()
const { buildContainer } = await import("./src/bootstrap/buildContainer.js");

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
app.use(session({
  name: "italiancheeseaholic.sid",
  secret: process.env.SESSION_SECRET || "change-this-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 8,
  },
}));

// Register backend modules
registerAuth(container, io, app);
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
