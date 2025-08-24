import NotificationModel from "../../../../models/Notification.js";
import catchAsync from "../../../utils/catchAsync.js";
import { StatusCodes } from "http-status-codes";
import logger from "../../../utils/logger.js";

export const createNotification = catchAsync(async (req, res) => {
  const { senderId, recipientId, notification, type } = req.body;

  logger.info('Notification creation request', {
    senderId,
    recipientId,
    type,
    requestId: req.requestId
  });

  const getNotification = await NotificationModel.create({
    senderId,
    recipientId,
    notification,
    type,
  });

  logger.info('Notification created successfully', {
    notificationId: getNotification._id,
    senderId,
    recipientId,
    requestId: req.requestId
  });

  res.status(StatusCodes.OK).json(getNotification);
});

export const getNotificationByReceiver = catchAsync(async (req, res) => {
  const { id } = req.params;

  const getNotification = await NotificationModel.find({
    recipientId: id,
  })
    .sort({ createdAt: -1 })
    .populate("senderId", "-password");

  logger.info('Notifications retrieved', {
    recipientId: id,
    notificationCount: getNotification.length,
    requestId: req.requestId
  });

  res.status(StatusCodes.OK).json(getNotification);
});

//get unread message count for all
export const getUnreadNotificationCount = catchAsync(async (req, res) => {
  const result = await NotificationModel.find({
    recipientId: req.user._id,
    isRead: false,
  });

  logger.info('Unread notification count retrieved', {
    userId: req.user._id,
    unreadCount: result.length,
    requestId: req.requestId
  });

  res.status(StatusCodes.OK).json({ result: result.length});
});

//set read notification
export const setRead = catchAsync(async (req, res) => {
  await NotificationModel.updateMany(
    { recipientId: req.user._id },
    { isRead: true }
  );

  logger.info('All notifications marked as read', {
    userId: req.user._id,
    requestId: req.requestId
  });

  res.status(StatusCodes.OK).json({ message: "All notifications are read" });
});