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
import { normalLimiter } from "../services/normalRoutes.js";
const router = express.Router();

/**
 * @description This route is used to create a conversation.
 * @route POST /api/v1/message/conversation
 * @access Private
 */
router.route("/conversation").post(normalLimiter, protect, createConversation);


/**
 * @description This route is used to get all conversation.
 * @route GET /api/v1/message/getConversation
 * @access Private
 */
router.route("/getConversation").get(normalLimiter, protect, getConversation);

/**
 * @description This route is used to create a message.
 * @route POST /api/v1/message/createMessage
 * @access Private
 */
router.route("/createMessage").post(normalLimiter, protect, createMessage);

/**
 * @description This route is used to get all messages of a conversation.
 * @route GET /api/v1/message/messagesCombo/:id
 * @access Private
 */
router.route("/messagesCombo/:id").get(normalLimiter, protect, getMessages);

/**
 * @description This route is used to get the last message of a conversation.
 * @route GET /api/v1/message/lastMessages/:id
 * @access Private
 * @param {string} id - The ID of the conversation.
 */
router.route("/lastMessages/:id").get(normalLimiter, protect, getLastMessage);


/**
 * @description This route is used to set all messages as read.
 * @route PUT /api/v1/message/readAllMessage/:id
 * @access Private
 * @param {string} id - The ID of the conversation.
 */
router.route("/readAllMessage/:id").put(normalLimiter, protect, setRead);

/**
 * @description This route is used to get the count of unread messages.
 * @route GET /api/v1/message/unreadMessage
 * @access Private
 */
router.route("/unreadMessage").get(normalLimiter, protect, getUnreadMessageCount);

export default router;
