import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/user.models.js";
import ProjectMember from "../models/projectmember.models.js";

let io = null;

export const projectRoom = (projectId) => `project:${projectId}`;
export const userRoom = (userId) => `user:${userId}`;

// setTimeout overflows past ~24.8 days; tokens are far shorter, but stay safe
const MAX_TIMEOUT_MS = 2_147_483_647;

const readCookie = (cookieHeader = "", name) => {
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
};

// Same rules as verifyJWT: accessToken cookie or Bearer token, valid signature,
// existing user and matching tokenVersion.
const authenticateSocket = async (socket, next) => {
  try {
    const { auth = {}, headers = {} } = socket.handshake;
    const token =
      readCookie(headers.cookie, "accessToken") ||
      auth.token?.replace("Bearer ", "").trim() ||
      headers.authorization?.replace("Bearer ", "").trim();

    if (!token) return next(new Error("Unauthorized"));

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded._id).select(
      "_id userName fullName tokenVersion",
    );

    if (!user || decoded.tokenVersion !== user.tokenVersion) {
      return next(new Error("Unauthorized"));
    }

    socket.user = { _id: user._id.toString(), userName: user.userName };
    socket.data.tokenExp = decoded.exp;
    next();
  } catch (error) {
    next(
      new Error(
        error.name === "TokenExpiredError" ? "Access token expired" : "Unauthorized",
      ),
    );
  }
};

// Close the socket when its access token expires. The client refreshes the
// token over HTTP and reconnects.
const scheduleExpiry = (socket) => {
  if (!socket.data.tokenExp) return;
  const delay = Math.min(socket.data.tokenExp * 1000 - Date.now(), MAX_TIMEOUT_MS);
  const timer = setTimeout(() => {
    socket.emit("auth:expired");
    socket.disconnect(true);
  }, Math.max(delay, 0));
  socket.on("disconnect", () => clearTimeout(timer));
};

export const initSocket = (httpServer, allowedOrigins) => {
  io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
  });

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    scheduleExpiry(socket);

    // Personal room for notifications aimed at this user only
    socket.join(userRoom(socket.user._id));

    socket.on("project:join", async (projectId, ack) => {
      const reply = typeof ack === "function" ? ack : () => {};

      try {
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
          return reply({ ok: false, message: "Invalid Project ID" });
        }

        const isMember = await ProjectMember.exists({
          project: projectId,
          user: socket.user._id,
        });

        if (!isMember) {
          return reply({ ok: false, message: "You are not a member of this project" });
        }

        socket.join(projectRoom(projectId));
        reply({ ok: true });
      } catch (error) {
        console.error("[socket] project:join failed:", error.message);
        reply({ ok: false, message: "Could not join project" });
      }
    });

    socket.on("project:leave", (projectId, ack) => {
      socket.leave(projectRoom(projectId));
      if (typeof ack === "function") ack({ ok: true });
    });
  });

  return io;
};

// All helpers below are safe to call even if sockets are not initialised (e.g. scripts)

export const emitToProject = (projectId, event, payload) => {
  io?.to(projectRoom(projectId.toString())).emit(event, payload);
};

export const emitToUser = (userId, event, payload) => {
  io?.to(userRoom(userId.toString())).emit(event, payload);
};

// Logout / password change / reset: kill every open socket of this user
export const disconnectUser = (userId, reason = "revoked") => {
  if (!io) return;
  const room = userRoom(userId.toString());
  io.to(room).emit("auth:revoked", { reason });
  io.in(room).disconnectSockets(true);
};

// Member removed: pull all of their sockets out of the project room right away
export const removeUserFromProject = (projectId, userId) => {
  if (!io) return;
  const room = userRoom(userId.toString());
  io.in(room).socketsLeave(projectRoom(projectId.toString()));
  io.to(room).emit("project:removed", { projectId: projectId.toString() });
};

// Project deleted: tell everyone in the room, then empty it
export const closeProjectRoom = (projectId) => {
  if (!io) return;
  const room = projectRoom(projectId.toString());
  io.to(room).emit("project:deleted", { projectId: projectId.toString() });
  io.in(room).socketsLeave(room);
};
