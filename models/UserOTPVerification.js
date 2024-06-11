import mongoose from "mongoose";
import cron from "node-cron";

const UserOTPVerificationSchema = new mongoose.Schema({
  userId: String,
  otp: String,
  createdAt: Date,
  expiresAt: Date,
});

const UserOTPVerification = mongoose.model(
  "UserOtpVerification",
  UserOTPVerificationSchema
);

// delete otps which are expired
const deleteExpiredOTPs = async () => {
  const now = new Date();
  await UserOTPVerification.deleteMany({ expiresAt: { $lt: now } });
};

// for every hour delete expired otps
cron.schedule("0 * * * *", deleteExpiredOTPs);

export default UserOTPVerification;
