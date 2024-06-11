import mongoose from "mongoose";
const Schema = mongoose.Schema;

const Notification = new mongoose.Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      default: null,
    },
    gigId: {
      type: Schema.Types.ObjectId,
      ref: "Gig",
      default: null,
    },
    notification: {
      type: String,
    },
    type: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const NotificationModel = mongoose.model("Notification", Notification);

export default NotificationModel;
