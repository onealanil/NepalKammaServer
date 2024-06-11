import express from "express";
import { protect } from "../domains/auth/middlewares/auth.js";
import {
  createNotification,
  getNotificationByReceiver,
  getUnreadNotificationCount,
  setRead,
} from "../domains/notification/controller/index.js";
const router = express.Router();

router.route("/createNotification").post(protect, createNotification);
router
  .route("/getNotificationByReceiver/:id")
  .get(protect, getNotificationByReceiver);

router.route("/readAllNotifications").put(protect, setRead);

//get unread message count
router.route("/unreadNotification").get(protect, getUnreadNotificationCount);

export default router;
