import express from "express";
import { protect, permission } from "../domains/auth/middlewares/auth.js";
import {
  createConversation,
  createMessage,
  getConversation,
  getLastMessage,
  getMessages,
  getUnreadMessageCount,
  setRead,
} from "../domains/message/controller/index.js";
const router = express.Router();

// create conversation
router.route("/conversation").post(protect, createConversation);

// get all conversation
router.route("/getConversation").get(protect, getConversation);

// create message
router.route("/createMessage").post(protect, createMessage);

//get messages
router.route("/messagesCombo/:id").get(protect, getMessages);

//last messages
router.route("/lastMessages/:id").get(protect, getLastMessage);

//read all message
router.route("/readAllMessage/:id").put(protect, setRead);

//count unread message
router.route("/unreadMessage").get(protect, getUnreadMessageCount);

export default router;
