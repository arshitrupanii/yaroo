import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import messageRoutes from './routes/message.routes.js';
import { connectDB } from './lib/db.js';
import { app, server } from "./lib/socket.js";

dotenv.config({
  path:
    process.env.NODE_ENV === "production"
      ? ".env.production"
      : ".env.development",
});

const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(cookieParser());

app.use(cors({
  origin: [process.env.FRONTEND_URL],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));


app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

app.get('/', async (req, res) => {
  res.send('API is running...');
});


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