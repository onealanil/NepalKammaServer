import Payment from "../../../../models/Payment.js";
import { getDataUris } from "../../../utils/Features.js";
import catchAsync from "../../../utils/catchAsync.js";
import cloudinary from "cloudinary";

//create payment
export const createPayment = catchAsync(async (req, res, next) => {
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

export const getPaymentByProvider = catchAsync(async (req, res, next) => {
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

//request payment update payment_status to request_payment
export const requestPayment = catchAsync(async (req, res, next) => {
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

//update khaltinumber
export const updateKhaltiNumber = catchAsync(async (req, res, next) => {
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
