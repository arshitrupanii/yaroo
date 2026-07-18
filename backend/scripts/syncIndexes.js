import dotenv from "dotenv";

import { connectDB, disconnectDB } from "../lib/db.js";
import Message from "../model/message.model.js";
import User from "../model/user.model.js";

dotenv.config();

async function syncIndexes() {
  await connectDB();

  await Promise.all([
    User.createIndexes(),
    Message.createIndexes(),
  ]);

  console.log("MongoDB indexes ensured");
}

syncIndexes()
  .catch((error) => {
    console.error(`Index sync failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
