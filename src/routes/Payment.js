import express from "express";
import { protect, permission } from "../domains/auth/middlewares/auth.js";
import {
  createPayment,
  getPaymentByProvider,
  requestPayment,
  updateKhaltiNumber,
} from "../domains/payment/controller/index.js";
import { multipleUpload } from "../domains/auth/middlewares/Multer.js";
const router = express.Router();

router
  .route("/createPayment")
  .post(protect, permission(["job_provider"]), createPayment);

router
  .route("/getPaymentByProvider")
  .get(protect, permission(["job_seeker"]), getPaymentByProvider);

router
  .route("/requestPayment/:id")
  .put(protect, permission(["job_seeker"]), multipleUpload, requestPayment);

router
  .route("/updateKhalitNumber/:id")
  .put(protect, permission(["job_seeker"]), updateKhaltiNumber);

export default router;
