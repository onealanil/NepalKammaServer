import mongoose from "mongoose";
const Schema = mongoose.Schema;

const Message = new mongoose.Schema(
  {
    conversationId: {
      type: String,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    msg: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const MessageModel = mongoose.model("Message", Message);

export default MessageModel;
