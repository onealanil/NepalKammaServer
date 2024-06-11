import MessageModel from "./models/Message.js";
import User from "./models/User.js";

let io;

const onlineUsers = [];

const addNewUser = async (userId, socketId) => {
  try {
    const user = await User.findById(userId);
    if (user) {
      user.onlineStatus = true;
      await user.save();
    }

    if (!onlineUsers.some((user) => user.userId === userId)) {
      onlineUsers.push({ userId, socketId });
      io.emit("getU", onlineUsers);
    }
  } catch (err) {
    console.error(err);
  }
};

const removeUser = async (socketId) => {
  try {
    const index = onlineUsers.findIndex((user) => user.socketId === socketId);

    if (index !== -1) {
      const userId = onlineUsers[index].userId;
      const user = await User.findById(userId);

      if (user) {
        console.log(user.username, "is offline.");
        user.onlineStatus = false;
        await user.save();
        onlineUsers.splice(index, 1);
        io.emit("getU", onlineUsers);
      }
    }
  } catch (err) {
    console.error(err);
  }
};

const getUser = (userId) => {
  return onlineUsers.find((user) => user.userId === userId);
};

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

// Socket Connection
export default (socketIo) => {
  io = socketIo;

  io.on("connection", (socket) => {
    console.log(socket.id, "connected.");

    socket.on("addUser", (data) => {
      console.log(data.username, "is online.");
      addNewUser(data.userId, socket.id);
      console.log(onlineUsers);
    });

    socket.on("getOnlineUsers", (data) => {
      io.emit("getU", onlineUsers);
    });

    socket.on("conversationOpened", ({ conversationId, senderId }) => {
      console.log(conversationId, senderId, "conversation opened.");
      MessageModel.updateMany(
        { conversationId: conversationId, senderId: { $ne: senderId } },
        { isRead: true }
      );
    });

    // for messages
    socket.on(
      "textMessage",
      ({ sender, receiver, message, conversationId }) => {
        console.log(sender, receiver, message, "message received.");
        const socketIdReceiver = getUser(receiver);
        if (socketIdReceiver) {
          io.to(socketIdReceiver.socketId).emit("textMessageFromBack", {
            sender,
            receiver,
            message,
            conversationId,
          });
        }
      }
    );

    //for notification
    socket.on("notification", (notification) => {
      const receiver = getUser(notification.receiver);
      if (receiver) {
        io.to(receiver.socketId).emit("notificationFromBack", notification);
      }
    });

    socket.on("removeUser", (socketId) => {
      console.log("removeUser", socketId);
      removeUser(socketId);
    });

    socket.on("disconnect", () => {
      console.log("disconnectted", socket.id);
      removeUser(socket.id);
    });
  });
};
