import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from "path";

import authRoutes from './routes/auth.routes.js';
import messageRoutes from './routes/message.routes.js';
import { connectDB } from './lib/db.js';
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();


if (process.env.NODE_ENV !== "production") {
  app.use(cors({
    origin: [process.env.FRONTEND_URL],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }));
}


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());


app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

app.get('/health', async (req, res) => {
  res.send('API is running...');
});


if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));
  
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

async function startServer() {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log("Server running on port", PORT);
    });

  } catch (err) {
    console.error("Server failed to start", err);
    process.exit(1);
  }
}

startServer();