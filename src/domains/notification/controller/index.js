import NotificationModel from "../../../../models/Notification.js";
import catchAsync from "../../../utils/catchAsync.js";

export const createNotification = catchAsync(async (req, res, next) => {
  try {
    const { senderId, recipientId, notification, type } = req.body;
    const getNotification = await NotificationModel.create({
      senderId,
      recipientId,
      notification,
      type,
    });
    res.status(200).json(getNotification);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create notifications" });
  }
});

export const getNotificationByReceiver = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const getNotification = await NotificationModel.find({
      recipientId: id,
    })
      .sort({ createdAt: -1 })
      .populate("senderId", "-password");
    res.status(200).json(getNotification);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get notifications" });
  }
});

//get unread message count for all
export const getUnreadNotificationCount = catchAsync(async (req, res, next) => {
  try {
    const result = await NotificationModel.find({
      recipientId: req.user._id,
      isRead: false,
    });
    res.status(200).json({ result: result.length});
  } catch (err) {
    res.status(500).json({ message: "Failed to get unread message count" });
  }
});

//set read notification
export const setRead = catchAsync(async (req, res, next) => {
  try {
    await NotificationModel.updateMany(
      { recipientId: req.user._id },
      { isRead: true }
    );
    res.status(200).json({ message: "All notifications are read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to set all notifications read" });
  }
});