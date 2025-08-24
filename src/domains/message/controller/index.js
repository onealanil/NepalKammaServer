import catchAsync from "../../../utils/catchAsync.js";
import ConversationModel from "../../../../models/Conversation.js";
import MessageModel from "../../../../models/Message.js";
import firebase from "../../../firebase/index.js";
import User from "../../../../models/User.js";
import { StatusCodes } from "http-status-codes";
import logger from "../../../utils/logger.js";

export const createConversation = catchAsync(async (req, res) => {
  const senderId = req.body.senderId;
  const receiverId = req.body.receiverId;

  logger.info('Conversation creation attempt', {
    senderId,
    receiverId,
    requestId: req.requestId
  });

  const existingConversation = await ConversationModel.findOne({
    conversation: { $all: [senderId, receiverId] },
  });

  if (existingConversation) {
    logger.info('Existing conversation found', {
      conversationId: existingConversation._id,
      requestId: req.requestId
    });
    return res.status(StatusCodes.OK).json({ conversation: existingConversation });
  }

  const conversation = new ConversationModel({
    conversation: [senderId, receiverId],
  });
  await conversation.save();

  logger.info('New conversation created', {
    conversationId: conversation._id,
    senderId,
    receiverId,
    requestId: req.requestId
  });

  res.status(StatusCodes.OK).json({ conversation });
});

export const getConversation = catchAsync(async (req, res) => {
  const userId = req.user._id;

  const result = await ConversationModel.find({
    conversation: { $in: [userId] },
  })
    .populate({
      path: "conversation",
      model: "User",
      options: { strictPopulate: false },
      select: "-password -savedPost -isVerified -bio",
    })
    .exec();

  const filteredResult = result.filter((message) => {
    if (message.conversation.some((conv) => conv._id.equals(userId))) {
      message.conversation = message.conversation
        .map((conv) => (conv._id.equals(userId) ? null : conv))
        .filter((conv) => conv !== null);
    }
    return message;
  });

  logger.info('Conversations retrieved', {
    userId,
    conversationCount: filteredResult.length,
    requestId: req.requestId
  });

  res.status(StatusCodes.OK).json({ result: filteredResult });
});

// for message
export const createMessage = catchAsync(async (req, res) => {
  const senderId = req.user._id;
  const conversationId = req.body.conversationId;
  const msg = req.body.msg;
  const recipientId = req.body.recipientId;

  logger.info('Message creation request', {
    senderId,
    recipientId,
    conversationId,
    requestId: req.requestId
  });

  const messages = await MessageModel.create({
    senderId,
    conversationId,
    msg,
    recipientId,
  });

  const senderUser = await User.findById(senderId);
  const recipientUser = await User.findById(recipientId);

  const sendNotification = async () => {
    try {
      await firebase.messaging().send({
        token: recipientUser?.fcm_token,
        notification: {
          title: `${senderUser?.username} messaged you 🎆💬`,
          body: msg,
        },
      });
    } catch (err) {
      logger.error('Firebase message notification failed', {
        error: err.message,
        recipientId,
        requestId: req.requestId
      });
    }
  };

  if (recipientUser?.fcm_token) {
    await sendNotification();
  }

  logger.info('Message created successfully', {
    messageId: messages._id,
    senderId,
    recipientId,
    requestId: req.requestId
  });

  res.status(StatusCodes.OK).json({ messages });
});

//get message of conversation of user
export const getMessages = catchAsync(async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await MessageModel.find({ conversationId: id })
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();
    const conversation = await ConversationModel.findById(id)
      .populate({
        path: "conversation",
        model: "User",
        options: { strictPopulate: false },
        select: "profilePic username _id",
      })
      .exec();

    const otherUser = conversation.conversation.filter(
      (user) => user._id.toString() !== req.user._id.toString()
    )[0];

    res.status(200).json({ result, otheruser: otherUser });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

//get last messages from conversation id
export const getLastMessage = catchAsync(async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await MessageModel.find({ conversationId: id })
      .sort({ createdAt: -1 })
      .limit(1);

    res.status(200).json({ result });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch last messages" });
  }
});

export const setRead = catchAsync(async (req, res, next) => {
  try {
    const id = req.params.id;
    await MessageModel.updateMany(
      { conversationId: id, recipientId: req.user._id },
      { isRead: true }
    );
    res.status(200).json({ message: "All messages are read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to set all messages read" });
  }
});

//get unread message count for all
export const getUnreadMessageCount = catchAsync(async (req, res, next) => {
  try {
    const result = await MessageModel.find({
      recipientId: req.user._id,
      isRead: false,
    });
    res.status(200).json({ result: result.length });
  } catch (err) {
    res.status(500).json({ message: "Failed to get unread message count" });
  }
});
