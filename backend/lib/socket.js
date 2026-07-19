import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import http from "http";
import express from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { getAllowedOrigins } from "./cors.js";
import { verifyTokenOptions } from "./utils.js";
import User from "../model/user.model.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: getAllowedOrigins(),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
  },
  maxHttpBufferSize: 1e6,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: false
  },
  pingInterval: 25000,
  pingTimeout: 20000
});

const userSocketMap = {};
let redisClients = null;
const ONLINE_USERS_KEY = "yaroo:online-users";

const userRoom = (userId) => `user:${userId}`;

const logSocketError = (message, error) => {
  console.error(`${message}: ${error.message}`);
};

export function emitToUser(userId, event, payload) {
  io.to(userRoom(userId.toString())).emit(event, payload);
}

export function emitToUsers(userIds, event, payload) {
  const rooms = [...new Set(userIds.map((userId) => userRoom(userId.toString())))];
  if (rooms.length > 0) io.to(rooms).emit(event, payload);
}

export function emitToUserWithAck(userId, event, payload, timeoutMs = 5000, callback) {
  io.to(userRoom(userId.toString())).timeout(timeoutMs).emit(event, payload, callback);
}

export async function configureSocketAdapter() {
  if (!process.env.REDIS_URL) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("REDIS_URL not set. Socket.IO is running in single-instance mode.");
    }
    return;
  }

  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  pubClient.on("error", (error) => console.error(`Redis pub client error: ${error.message}`));
  subClient.on("error", (error) => console.error(`Redis sub client error: ${error.message}`));

  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));
  redisClients = { pubClient, subClient };

  console.log("Socket.IO Redis adapter connected");
}

export async function closeSocketAdapter() {
  if (!redisClients) return;

  await Promise.allSettled([
    redisClients.pubClient.quit(),
    redisClients.subClient.quit(),
  ]);
  redisClients = null;
}

async function incrementOnlineUser(userId) {
  if (redisClients?.pubClient) {
    await redisClients.pubClient.hIncrBy(ONLINE_USERS_KEY, userId.toString(), 1);
  }
}

async function decrementOnlineUser(userId) {
  if (!redisClients?.pubClient) return;

  const nextCount = await redisClients.pubClient.hIncrBy(ONLINE_USERS_KEY, userId.toString(), -1);
  if (nextCount <= 0) {
    await redisClients.pubClient.hDel(ONLINE_USERS_KEY, userId.toString());
  }
}

async function getOnlineUserIds() {
  if (redisClients?.pubClient) {
    return redisClients.pubClient.hKeys(ONLINE_USERS_KEY);
  }

  return Object.keys(userSocketMap);
}

async function emitOnlineUsers() {
  try {
    io.emit("getOnlineUsers", await getOnlineUserIds());
  } catch (error) {
    console.error(`Failed to emit online users: ${error.message}`);
  }
}

const parseCookies = (cookieHeader = "") => (
  cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .reduce((cookies, cookie) => {
      const separatorIndex = cookie.indexOf("=");
      if (separatorIndex === -1) return cookies;

      const key = cookie.slice(0, separatorIndex).trim();
      const value = cookie.slice(separatorIndex + 1).trim();
      cookies[key] = decodeURIComponent(value);
      return cookies;
    }, {})
);

io.use(async (socket, next) => {
  try {
    const token = parseCookies(socket.handshake.headers.cookie).ChatAppToken;
    if (!token) return next(new Error("Unauthorized socket"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET, verifyTokenOptions);
    const user = await User.findById(decoded.userId).select("passwordChangedAt");

    if (!user) return next(new Error("Unauthorized socket"));

    if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime()) {
      return next(new Error("Unauthorized socket"));
    }

    socket.userId = decoded.userId;
    return next();
  } catch {
    return next(new Error("Unauthorized socket"));
  }
});

io.on("connection", async (socket) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("A user connected", socket.id);
  }

  const userId = socket.userId;
  if (userId) {
    if (!userSocketMap[userId]) userSocketMap[userId] = new Set();
    userSocketMap[userId].add(socket.id);
    socket.join(userRoom(userId));
    try {
      await incrementOnlineUser(userId);
    } catch (error) {
      logSocketError("Failed to update online presence", error);
    }
  }

  await emitOnlineUsers();

  socket.on("typing", ({ receiverId }) => {
    if (receiverId) emitToUser(receiverId, "typing", { senderId: userId });
  });

  socket.on("stopTyping", ({ receiverId }) => {
    if (receiverId) emitToUser(receiverId, "stopTyping", { senderId: userId });
  });

  socket.on("disconnect", async () => {
    if (process.env.NODE_ENV !== "production") {
      console.log("A user disconnected", socket.id);
    }

    if (userId && userSocketMap[userId]) {
      userSocketMap[userId].delete(socket.id);
      if (userSocketMap[userId].size === 0) delete userSocketMap[userId];
      try {
        await decrementOnlineUser(userId);
      } catch (error) {
        logSocketError("Failed to update online presence", error);
      }
    }
    await emitOnlineUsers();
  });
});

export { io, app, server };
