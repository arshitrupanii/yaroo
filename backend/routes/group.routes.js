import express from "express";
import { createGroup, getGroupMessages, getGroups, markGroupMessagesSeen } from "../controllers/group.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../lib/asyncHandler.js";

const router = express.Router();

router.get("/", authMiddleware, asyncHandler(getGroups));
router.post("/", authMiddleware, asyncHandler(createGroup));
router.get("/:id/messages", authMiddleware, asyncHandler(getGroupMessages));
router.patch("/:id/seen", authMiddleware, asyncHandler(markGroupMessagesSeen));

export default router;
