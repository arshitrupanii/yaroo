import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from "path";

import authRoutes from './routes/auth.routes.js';
import messageRoutes from './routes/message.routes.js';
import friendRoutes from './routes/friend.routes.js';
import groupRoutes from './routes/group.routes.js';
import { connectDB, disconnectDB, getDbHealth } from './lib/db.js';
import { app, closeSocketAdapter, configureSocketAdapter, server } from "./lib/socket.js";
import { requestIdMiddleware } from './middleware/requestId.middleware.js';
import { trustedOriginMiddleware } from './middleware/trustedOrigin.middleware.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { ApiError } from './lib/ApiError.js';
import { corsOptions } from './lib/cors.js';
import { printEnvHelp, validateEnv } from './lib/env.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

app.set('trust proxy', 1);

app.use(requestIdMiddleware);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many requests. Please try again later', { code: 'RATE_LIMITED' }));
  }
});

if (process.env.NODE_ENV !== "production") {
  app.use(cors(corsOptions));
}


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

app.use('/api', trustedOriginMiddleware);
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/groups', groupRoutes);

app.get('/health', async (req, res) => {
  const database = getDbHealth();
  const healthy = database.status === "connected";

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    database,
    requestId: req.requestId
  });
});

app.use('/api', notFoundHandler);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));
  
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    validateEnv();
    await connectDB();
    await configureSocketAdapter();

    server.listen(PORT, () => {
      console.log("Server running on port", PORT);
    });

  } catch (err) {
    if (err.message?.includes("environment variable") || err.message?.includes("JWT_SECRET")) {
      printEnvHelp();
    }

    console.error(`Server failed to start: ${err.message}`);
    process.exit(1);
  }
}

startServer();

const shutdown = async (signal) => {
  console.log(`${signal} received. Closing server...`);

  server.close(async () => {
    try {
      await closeSocketAdapter();
      await disconnectDB();
      console.log("Server closed");
      process.exit(0);
    } catch (error) {
      console.error(`Shutdown failed: ${error.message}`);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (error) => {
  console.error(`Unhandled promise rejection: ${error.message}`);
});

process.on('uncaughtException', (error) => {
  console.error(`Uncaught exception: ${error.message}`);
  process.exit(1);
});
