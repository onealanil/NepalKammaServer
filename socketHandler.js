/**
 * @file socketHandler.js
 * @description This file contains the Socket.IO configuration and event handling for real-time communication in the application.
 * @requires express
 * @requires socket.io
 * @requires dotenv
 */

import MessageModel from "./models/Message.js";
import User from "./models/User.js";
import jwt from "jsonwebtoken";

// Use a Map for better performance with frequent lookups
const onlineUsers = new Map(); // socketId -> {userId, socket}

let io;

/**
 *
 * @param userId - The ID of the user to be added
 * @param socketId - The ID of the socket connection
 * @description Adds a new user to the online users list and updates their status in the database.
 * @function addNewUser
 * @async
 */
const addNewUser = async (userId, socketId) => {
  try {
    // Update user status in DB
    await User.findByIdAndUpdate(userId, { onlineStatus: true });

    // Store only minimal socket information
    onlineUsers.set(socketId, {
      userId,
      socketId, // Just store the ID, not the whole socket object
    });

    console.log(`User ${userId} connected via ${socketId}`);

    // Emit only the essential data
    io.emit(
      "getOnlineUsers",
      Array.from(onlineUsers.values()).map((user) => ({
        userId: user.userId,
        socketId: user.socketId,
      }))
    );
  } catch (err) {
    console.error("Error adding user:", err);
  }
};

/**
 *
 * @param socketId
 * @description Removes a user from the online users list and updates their status in the database.
 * @function removeUser
 * @async
 */
const removeUser = async (socketId) => {
  try {
    const userData = onlineUsers.get(socketId);
    if (userData) {
      await User.findByIdAndUpdate(userData.userId, { onlineStatus: false });
      console.log(`User ${userData.userId} disconnected via ${socketId}`);
      onlineUsers.delete(socketId);

      // Emit simplified data
      io.emit(
        "getOnlineUsers",
        Array.from(onlineUsers.values()).map((user) => ({
          userId: user.userId,
          socketId: user.socketId,
        }))
      );
    }
  } catch (err) {
    console.error("Error removing user:", err);
  }
};

/**
 *
 * @param {string} userId
 * @returns {Socket|null}
 * @description Retrieves the socket instance for a given user ID.
 * @function getUserSocket
 */
const getUserSocket = (userId) => {
  for (const [socketId, userData] of onlineUsers) {
    if (userData.userId === userId) {
      return io.sockets.sockets.get(socketId); // Get the socket instance when needed
    }
  }
  return null;
};

/**
 * 
 * @param io - Socket.IO instance
 * @param recipientId - ID of the recipient user
 * @param notification - Notification object to be sent
 * @description Emits a notification to a specific user.
 * @function emitNotification
 */
export const emitNotification = (io, recipientId, notification) => {
  const recipient = getUser(recipientId);
  if (recipient && recipient.socketId) {
    io.to(recipient.socketId).emit(
      "notificationForLocationAndRecommend",
      notification
    );
  } else {
    console.log(
      `User ${recipientId} is not connected to the Socket.IO server.`
    );
  }
};

/**
 * 
 * @param io - Socket.IO instance
 * @param recipientId - ID of the recipient user
 * @description Emits an account deactivation event to a specific user.
 * @function emitAccountDeactivation
 */
export const emitAccountDeactivation = (io, recipientId) => {
  const recipient = getUser(recipientId);
  if (recipient && recipient.socketId) {
    console.log("accountdeactivate", recipientId, recipient.socketId);
    io.to(recipient.socketId).emit("accountDeactivation");
  } else {
    console.log(
      `User ${recipientId} is not connected to the Socket.IO server.`
    );
  }
};

/**
 * 
 * @param socketIo - Socket.IO instance
 * @description Configures the Socket.IO server with authentication and event handling (includes the instance of socket.io).
 * @function configureSocket
 */
const configureSocket = (socketIo) => {
  io = socketIo;

  // Configure Socket.IO server
  io.engine.on("connection_error", (err) => {
    console.error("Connection error:", err);
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication error"));

      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      socket.userId = decoded.userId; // Attach userId to socket
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log("New connection:", socket.id);

    // Heartbeat mechanism
    let heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit("ping");
      }
    }, 30000);

    socket.on("pong", () => {
      // Connection is alive
    });

    socket.on("addUser", async (data) => {
      // Prevent duplicate connections for same user
      for (const [id, user] of onlineUsers) {
        if (user.userId === data.userId) {
          console.log(`Closing duplicate connection for user ${data.userId}`);
          io.sockets.sockets.get(id)?.disconnect();
        }
      }
      await addNewUser(data.userId, socket.id);
    });

    socket.on("getOnlineUsers", () => {
      console.log("this is getOnlineUsers");
      console.log("online users", Array.from(onlineUsers.values()));
      socket.emit("getOnlineUsers", Array.from(onlineUsers.values()));
    });

    socket.on("conversationOpened", async ({ conversationId, senderId }) => {
      try {
        await MessageModel.updateMany(
          { conversationId, senderId: { $ne: senderId } },
          { isRead: true }
        );
      } catch (err) {
        console.error("Error updating messages:", err);
      }
    });

    socket.on(
      "textMessage",
      ({ sender, receiver, message, conversationId }) => {
        const receiverSocket = getUserSocket(receiver);
        console.log("this is message: ", message);
        if (receiverSocket) {
          receiverSocket.emit("textMessageFromBack", {
            sender,
            receiver,
            message,
            conversationId,
          });
        }
      }
    );

    socket.on("notification", (notification) => {
      const receiverSocket = getUserSocket(notification.receiver);
      if (receiverSocket) {
        receiverSocket.emit("notificationFromBack", notification);
      }
    });

    socket.on("disconnect", () => {
      clearInterval(heartbeatInterval);
      removeUser(socket.id);
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err);
      socket.disconnect();
    });
  });
};

export default configureSocket;
