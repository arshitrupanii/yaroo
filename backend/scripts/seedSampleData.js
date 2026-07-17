import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";

import Message from "../model/message.model.js";
import User from "../model/user.model.js";

dotenv.config();

const password = "Password123!";

const ids = {
  arshit: new mongoose.Types.ObjectId(),
  mira: new mongoose.Types.ObjectId(),
  jay: new mongoose.Types.ObjectId(),
  neha: new mongoose.Types.ObjectId(),
  dev: new mongoose.Types.ObjectId(),
};

const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60 * 1000);

async function seedSampleData() {
  if (!process.env.MONGODB_URI) {
    throw new Error("Missing MONGODB_URI");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const hashedPassword = await bcrypt.hash(password, 12);

  await Promise.all([
    Message.deleteMany({}),
    User.deleteMany({}),
  ]);

  await User.insertMany([
    {
      _id: ids.arshit,
      firstname: "Arshit",
      username: "arshit",
      email: "arshit@example.com",
      password: hashedPassword,
      friends: [ids.mira, ids.jay, ids.neha],
      friendRequestsReceived: [ids.dev],
    },
    {
      _id: ids.mira,
      firstname: "Mira",
      username: "mira",
      email: "mira@example.com",
      password: hashedPassword,
      friends: [ids.arshit, ids.jay],
    },
    {
      _id: ids.jay,
      firstname: "Jay",
      username: "jay",
      email: "jay@example.com",
      password: hashedPassword,
      friends: [ids.arshit, ids.mira],
    },
    {
      _id: ids.neha,
      firstname: "Neha",
      username: "neha",
      email: "neha@example.com",
      password: hashedPassword,
      friends: [ids.arshit],
    },
    {
      _id: ids.dev,
      firstname: "Dev",
      username: "dev",
      email: "dev@example.com",
      password: hashedPassword,
      friendRequestsSent: [ids.arshit],
    },
  ]);

  await Message.insertMany([
    {
      senderId: ids.mira,
      receiverId: ids.arshit,
      text: "Hey, are you free for the project review?",
      status: "seen",
      readAt: minutesAgo(78),
      createdAt: minutesAgo(80),
      updatedAt: minutesAgo(80),
    },
    {
      senderId: ids.arshit,
      receiverId: ids.mira,
      text: "Yes. Send me the latest build and I will check it.",
      status: "seen",
      readAt: minutesAgo(74),
      createdAt: minutesAgo(76),
      updatedAt: minutesAgo(76),
    },
    {
      senderId: ids.mira,
      receiverId: ids.arshit,
      text: "Done. I also cleaned the auth flow.",
      status: "delivered",
      createdAt: minutesAgo(70),
      updatedAt: minutesAgo(70),
    },
    {
      senderId: ids.jay,
      receiverId: ids.arshit,
      text: "Can we keep the chat UI simple? Less noise feels better.",
      status: "seen",
      readAt: minutesAgo(42),
      createdAt: minutesAgo(45),
      updatedAt: minutesAgo(45),
    },
    {
      senderId: ids.arshit,
      receiverId: ids.jay,
      text: "Agreed. Compact sidebar, clean bubbles, better mobile flow.",
      status: "delivered",
      createdAt: minutesAgo(40),
      updatedAt: minutesAgo(40),
    },
    {
      senderId: ids.neha,
      receiverId: ids.arshit,
      text: "I sent a few ideas for onboarding.",
      status: "seen",
      readAt: minutesAgo(18),
      createdAt: minutesAgo(22),
      updatedAt: minutesAgo(22),
    },
    {
      senderId: ids.arshit,
      receiverId: ids.neha,
      text: "Nice. I will add the best ones after this UI pass.",
      status: "sent",
      createdAt: minutesAgo(16),
      updatedAt: minutesAgo(16),
    },
  ]);

  console.log("Sample data seeded");
  console.log(`Login email: arshit@example.com`);
  console.log(`Password: ${password}`);
}

seedSampleData()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
