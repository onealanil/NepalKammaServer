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
const router = express.Router();

router.route("/countAll").get(protect, permission(["admin"]), countAll);

router
  .route("/getAllFreelancers")
  .get(protect, permission(["admin"]), getAllFreelancers);

router
  .route("/getAllJobProviders")
  .get(protect, permission(["admin"]), getAllJobProviders);

router
  .route("/getAllPayments")
  .get(protect, permission(["admin"]), getAllPayments);

router.route("/getAllJobs").get(protect, permission(["admin"]), getAllJobs);

router.route("/getAllGigs").get(protect, permission(["admin"]), getAllGigs);

router
  .route("/completedPayment/:paymentId")
  .put(protect, permission(["admin"]), completedPayment);

router
  .route("/verifyDocument/:userId")
  .put(protect, permission(["admin"]), verifyDocument);

router
  .route("/rejectDocument/:userId")
  .put(protect, permission(["admin"]), rejectDocument);

router
  .route("/getAllReports")
  .get(protect, permission(["admin"]), getAllReports);

router
  .route("/deactivateUser/:userId")
  .put(protect, permission(["admin"]), deactivateUser);

router
  .route("/activateUser/:userId")
  .put(protect, permission(["admin"]), activateUser);

router
  .route("/getallDeactivatedUsers")
  .get(protect, permission(["admin"]), getAllDeactivatedAccounts);

router
  .route("/getUserGrowth")
  .get(protect, permission(["admin"]), getUserGrowth);

router
  .route("/sendNotification")
  .post(protect, permission(["admin"]), sendPushNotification);

router.route("/getUsersGraph").get(protect, permission(["admin"]), getNewUsers);

export default router;
