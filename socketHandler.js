/**
 * @file socketHandler.js
 * @description Handles real-time communication using Socket.IO including user status, messaging, and notifications.
 */

import MessageModel from "./models/Message.js";
import User from "./models/User.js";

// Use Map for better performance with frequent lookups
const onlineUsers = new Map(); // socketId -> {userId}

let io;

/**
 * Adds a new user to the online users list and updates their status
 * @param {string} userId - The ID of the user to be added
 * @param {string} socketId - The ID of the socket connection
 */
const addNewUser = async (userId, socketId) => {
  try {
    // Update user status in DB
    const user = await User.findById(userId);
    if (user) {
      user.onlineStatus = true;
      await user.save();
    }

    // Prevent duplicate entries
    if (!Array.from(onlineUsers.values()).some(user => user.userId === userId)) {
      onlineUsers.set(socketId, { userId });
      console.log(`User ${userId} connected via ${socketId}`);
      emitOnlineUsers();
    }
  } catch (err) {
    console.error("Error adding user:", err);
  }
};

/**
 * Removes a user from the online users list and updates their status
 * @param {string} socketId - The socket ID to remove
 */
const removeUser = async (socketId) => {
  try {
    const userData = onlineUsers.get(socketId);
    if (userData) {
      const user = await User.findById(userData.userId);
      if (user) {
        console.log(`User ${user.username} is offline.`);
        user.onlineStatus = false;
        await user.save();
      }
      onlineUsers.delete(socketId);
      emitOnlineUsers();
    }
  } catch (err) {
    console.error("Error removing user:", err);
  }
};

/**
 * Emits the current online users list to all clients
 */
const emitOnlineUsers = () => {
  const usersList = Array.from(onlineUsers.entries()).map(([socketId, user]) => ({
    userId: user.userId,
    socketId
  }));
  io.emit("getU", usersList);
};

/**
 * Gets user data by userId
 * @param {string} userId - The user ID to find
 * @returns {object|null} User data if found
 */
const getUser = (userId) => {
  for (const [socketId, userData] of onlineUsers) {
    if (userData.userId === userId) {
      return { userId: userData.userId, socketId };
    }
  }
  return null;
};

/**
 * Emits a notification to a specific user
 * @param {object} io - Socket.IO instance
 * @param {string} recipientId - ID of the recipient user
 * @param {object} notification - Notification object to send
 */
export const emitNotification = (io, recipientId, notification) => {
  const recipient = getUser(recipientId);
  if (recipient && recipient.socketId) {
    io.to(recipient.socketId).emit(
      "notificationForLocationAndRecommend",
      notification
    );
  } else {
    console.log(`User ${recipientId} is not connected.`);
  }
};

/**
 * Emits account deactivation event to a specific user
 * @param {object} io - Socket.IO instance
 * @param {string} recipientId - ID of the recipient user
 */
export const emitAccountDeactivation = (io, recipientId) => {
  const recipient = getUser(recipientId);
  if (recipient && recipient.socketId) {
    console.log("Emitting deactivation to:", recipientId, recipient.socketId);
    io.to(recipient.socketId).emit("accountDeactivation");
  } else {
    console.log(`User ${recipientId} is not connected.`);
  }
};

/**
 * Configures Socket.IO server with event handlers
 * @param {object} socketIo - Socket.IO instance
 */
export default (socketIo) => {
  io = socketIo;

  // Add error handling for the connection
  io.engine.on("connection_error", (err) => {
    console.error("Socket connection error:", err);
  });

  io.on("connection", (socket) => {
    console.log(socket.id, "connected.");

    // Heartbeat mechanism to detect dead connections
    let heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit("ping");
      }
    }, 30000); // 30 seconds

    socket.on("pong", () => {
      // Connection is alive
    });

    socket.on("addUser", (data) => {
      console.log(data.username, "is online.");
      addNewUser(data.userId, socket.id);
    });

    socket.on("getOnlineUsers", () => {
      emitOnlineUsers();
    });

    socket.on("conversationOpened", async ({ conversationId, senderId }) => {
      try {
        console.log(conversationId, senderId, "conversation opened.");
        await MessageModel.updateMany(
          { conversationId, senderId: { $ne: senderId } },
          { isRead: true }
        );
      } catch (err) {
        console.error("Error updating messages:", err);
      }
    });

    socket.on("textMessage", ({ sender, receiver, message, conversationId }) => {
      console.log("Message received from", sender, "to", receiver);
      const recipient = getUser(receiver);
      if (recipient) {
        io.to(recipient.socketId).emit("textMessageFromBack", {
          sender,
          receiver,
          message,
          conversationId,
        });
      }
    });

    socket.on("notification", (notification) => {
      const receiver = getUser(notification.receiver);
      if (receiver) {
        io.to(receiver.socketId).emit("notificationFromBack", notification);
      }
    });

    socket.on("removeUser", () => {
      removeUser(socket.id);
    });

    socket.on("disconnect", () => {
      clearInterval(heartbeatInterval);
      console.log(socket.id, "disconnected");
      removeUser(socket.id);
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err);
      socket.disconnect();
    });
  });
};