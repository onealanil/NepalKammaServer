/**
 * @file Payment.js
 * @description This file contains the routes for the payment module in the application.
 */
import express from "express";
import { protect, permission } from "../domains/auth/middlewares/auth.js";
import {
  createPayment,
  getPaymentByProvider,
  requestPayment,
  updateKhaltiNumber,
} from "../domains/payment/controller/index.js";
import { multipleUpload } from "../domains/auth/middlewares/Multer.js";
import { normalLimiter } from "../services/normalRoutes.js";
const router = express.Router();

/**
 * @description This route is used to create a payment.
 * @route POST /api/v1/payment/createPayment
 * @access Private
 * @permission job_provider
 */
router
  .route("/createPayment")
  .post(normalLimiter, protect, permission(["job_provider"]), createPayment);

/**
 * @description This route is used to get payment by provider.
 * @route GET /api/v1/payment/getPaymentByProvider
 * @access Private
 * @permission job_seeker
 */

router
  .route("/getPaymentByProvider")
  .get(normalLimiter, protect, permission(["job_seeker"]), getPaymentByProvider);

/**
 * @description This route is used to request payment.
 * @route PUT /api/v1/payment/requestPayment/:id
 * @access Private
 * @param {string} id - The ID of the payment to request.
 * @permission job_seeker
 */
router
  .route("/requestPayment/:id")
  .put(normalLimiter, protect, permission(["job_seeker"]), multipleUpload, requestPayment);

/**
 * @description This route is used to update Khalti number.
 * @route PUT /api/v1/payment/updateKhaltiNumber/:id
 * @access Private
 * @permission job_seeker
 * @param {string} id - The ID of the payment to update.
 */

router
  .route("/updateKhalitNumber/:id")
  .put(normalLimiter, protect, permission(["job_seeker"]), updateKhaltiNumber);

export default router;
