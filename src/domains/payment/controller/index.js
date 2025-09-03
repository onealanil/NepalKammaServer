/**
 * @file Payment/index.js
 * @description This file contains the controller functions for the payment module.
 * It handles the creation of payments, fetching payments by provider, requesting payments, and updating Khalti numbers.
 * @module Payment
 * @requires express
 * @requires cloudinary
 * @requirres multer
 */
import Job from "../../../../models/Job.js";
import Payment from "../../../../models/Payment.js";
import { getDataUris } from "../../../utils/Features.js";
import { clearCache } from "../../../utils/cacheService.js";
import catchAsync from "../../../utils/catchAsync.js";
import cloudinary from "cloudinary";
import { StatusCodes } from "http-status-codes";
import logger from "../../../utils/logger.js";

/**
 * @function createPayment
 * @description Creates a new payment.
 * @param req - The request object containing payment details.
 * @param res - The response object to send the result.
 * @returns - A JSON response with the created payment details or an error message.
 * @throws - If an error occurs during payment creation, a 500 status code and error message are returned.
 * @async
 */
export const createPayment = catchAsync(async (req, res) => {
  const { job, amount, recieverNumber } = req.body;

  logger.info('Payment creation request', {
    jobId: job,
    amount,
    paymentBy: req.body.paymentBy,
    paymentTo: req.body.paymentTo,
    userId: req.user._id,
    requestId: req.requestId
  });

  // Store payment record internally
  const payment = await Payment.create({
    PaymentBy: req.body.paymentBy,
    PaymentTo: req.body.paymentTo,
    paymentType: req.body.paymentMethod,
    job,
    amount,
    recieverNumber
  });

  const updatedJob = await Job.findByIdAndUpdate(
    job,
    { job_status: "Paid" },
    { new: true }
  );

  if (!updatedJob) {
    logger.warn('Payment creation failed - job not found', {
      jobId: job,
      userId: req.user._id,
      requestId: req.requestId
    });
    return res.status(StatusCodes.NOT_FOUND).json({ message: "Job not found" });
  }

  clearCache([
    `user_jobs${req.user._id}`
  ]);

  logger.info('Payment created successfully', {
    paymentId: payment._id,
    jobId: job,
    amount,
    userId: req.user._id,
    requestId: req.requestId
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Payment recorded and job marked as Paid",
    payment,
    job: updatedJob
  });
});


/**
 * @function getPaymentByProvider
 * @description Fetches payments made to a specific provider.
 * @param req - The request object containing user details.
 * @param res - The response object to send the result.
 * @returns - A JSON response with the payment details or an error message.
 * @throws - If an error occurs during fetching payments, a 500 status code and error message are returned.
 * @async
 */
export const getPaymentByProvider = catchAsync(async (req, res) => {
  const payments = await Payment.find({
    PaymentTo: req.user._id,
    paymentStatus: { $in: ["provider_paid", "request_payment"] },
  })
    .populate("PaymentBy", "username email")
    .populate("PaymentTo", "username email")
    .populate({
      path: "job",
      populate: {
        path: "postedBy",
        select: "username email profilePic",
      },
    });

  res.status(StatusCodes.OK).json(payments);
});

/**
 * @function requestPayment
 * @description Requests payment by uploading confirmation images.
 * @param req - The request object containing payment ID and image files.
 * @param res - The response object to send the result.
 * @returns - A JSON response with the updated payment details or an error message.
 * @throws - If an error occurs during payment request, a 500 status code and error message are returned.
 * @async
 */
export const requestPayment = catchAsync(async (req, res) => {
  try {
    const files = getDataUris(req.files);

    const payment = await Payment.findById(req.params.id);
    const images = [];
    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];
      const cdb = await cloudinary.v2.uploader.upload(fileData, {});
      images.push({
        public_id: cdb.public_id,
        url: cdb.secure_url,
      });
    }

    payment.confirmation_image = images;
    payment.paymentStatus = "request_payment";
    await payment.save();

    res.status(200).json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to request payment" });
  }
});

/**
 * @function updateKhaltiNumber
 * @description Updates the Khalti number for a payment.
 * @param req - The request object containing payment ID and Khalti number.
 * @param res - The response object to send the result.
 * @returns - A JSON response with the updated payment details or an error message.
 * @throws - If an error occurs during Khalti number update, a 500 status code and error message are returned.
 * @async
 *
 */
export const updateKhaltiNumber = catchAsync(async (req, res) => {
  try {
    const { recieverNumber } = req.body;
    const payment = await Payment.findById(req.params.id);
    payment.recieverNumber = recieverNumber;
    await payment.save();
    res.status(200).json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update khalti number" });
  }
});
