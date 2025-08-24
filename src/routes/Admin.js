import express from "express";
import { protect, permission } from "../domains/auth/middlewares/auth.js";
import {
  activateUser,
  completedPayment,
  countAll,
  deactivateUser,
  getAllDeactivatedAccounts,
  getAllFreelancers,
  getAllGigs,
  getAllJobProviders,
  getAllJobs,
  getAllPayments,
  getAllReports,
  getNewUsers,
  getUserGrowth,
  rejectDocument,
  sendPushNotification,
  verifyDocument,
} from "../domains/admin/controller/index.js";
import { normalLimiter } from "../services/normalRoutes.js";
const router = express.Router();

router.route("/countAll").get(normalLimiter, protect, permission(["admin"]), countAll);

router
  .route("/getAllFreelancers")
  .get(normalLimiter, protect, permission(["admin"]), getAllFreelancers);

router
  .route("/getAllJobProviders")
  .get(normalLimiter, protect, permission(["admin"]), getAllJobProviders);

router
  .route("/getAllPayments")
  .get(normalLimiter, protect, permission(["admin"]), getAllPayments);

router.route("/getAllJobs").get(normalLimiter, protect, permission(["admin"]), getAllJobs);

router.route("/getAllGigs").get(normalLimiter, protect, permission(["admin"]), getAllGigs);

router
  .route("/completedPayment/:paymentId")
  .put(normalLimiter, protect, permission(["admin"]), completedPayment);

router
  .route("/verifyDocument/:userId")
  .put(normalLimiter, protect, permission(["admin"]), verifyDocument);

router
  .route("/rejectDocument/:userId")
  .put(normalLimiter, protect, permission(["admin"]), rejectDocument);

router
  .route("/getAllReports")
  .get(normalLimiter, protect, permission(["admin"]), getAllReports);

router
  .route("/deactivateUser/:userId")
  .put(normalLimiter, protect, permission(["admin"]), deactivateUser);

router
  .route("/activateUser/:userId")
  .put(normalLimiter, protect, permission(["admin"]), activateUser);

router
  .route("/getallDeactivatedUsers")
  .get(normalLimiter, protect, permission(["admin"]), getAllDeactivatedAccounts);

router
  .route("/getUserGrowth")
  .get(normalLimiter, protect, permission(["admin"]), getUserGrowth);

router
  .route("/sendNotification")
  .post(normalLimiter, protect, permission(["admin"]), sendPushNotification);

router.route("/getUsersGraph").get(normalLimiter, protect, permission(["admin"]), getNewUsers);

export default router;
