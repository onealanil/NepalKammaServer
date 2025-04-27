/**
 * @file Payment/index.js
 * @description This file contains the controller functions for the payment module.
 * It handles the creation of payments, fetching payments by provider, requesting payments, and updating Khalti numbers.
 * @module Payment
 * @requires express
 * @requires cloudinary
 * @requirres multer
 */
import Payment from "../../../../models/Payment.js";
import { getDataUris } from "../../../utils/Features.js";
import catchAsync from "../../../utils/catchAsync.js";
import cloudinary from "cloudinary";

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
  try {
    const { PaymentBy, PaymentTo, job, amount, payment_type } = req.body;
    const payment = await Payment.create({
      PaymentBy,
      PaymentTo,
      paymentType: payment_type,
      job,
      amount,
    });
    res.status(200).json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create payment" });
  }
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
  try {
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

    res.status(200).json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get payments" });
  }
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
