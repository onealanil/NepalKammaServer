import express from "express";
import { protect } from "../domains/auth/middlewares/auth.js";
import {
  createNotification,
  getNotificationByReceiver,
  getUnreadNotificationCount,
  setRead,
} from "../domains/notification/controller/index.js";
import { normalLimiter } from "../services/normalRoutes.js";
const router = express.Router();
/**
 * @description This route is used to create a notification.
 * @route POST /api/v1/notification/createNotification
 * @access Private
 * @permission job_provider
 */
router.route("/createNotification").post(normalLimiter, protect, createNotification);
/**
 * @description This route is used to get all notifications by receiver.
 * @route GET /api/v1/notification/getNotificationByReceiver/:id
 * @access Private
 * @permission job_provider
 * @param {string} id - The ID of the receiver.
 */
router
  .route("/getNotificationByReceiver/:id")
  .get(normalLimiter, protect, getNotificationByReceiver);

/**
 * @description This route is used to set all notifications as read.
 * @route PUT /api/v1/notification/readAllNotifications
 * @access Private
 * @permission job_provider
 */
router.route("/readAllNotifications").put(normalLimiter, protect, setRead);

/**
 * @description This route is used to get the count of unread notifications.
 * @route GET /api/v1/notification/unreadNotification
 * @access Private
 * @permission job_provider
 */
router.route("/unreadNotification").get(normalLimiter, protect, getUnreadNotificationCount);

export default router;
