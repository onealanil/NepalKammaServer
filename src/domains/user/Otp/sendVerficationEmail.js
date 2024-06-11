import nodemailer from "nodemailer";
import UserOTPVerification from "../../../../models/UserOTPVerification.js";
import { hashPassword } from "../../../utils/hashBcrypt.js";
import { generateOTP } from "../../../utils/otpGenerator.js";

export const sendOTPVerificationEmail = async ({ _id, email }, res) => {
  try {
    const otp = generateOTP();
    const currentDate = Date.now();
    const expiresAt = new Date(currentDate + 180000);
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "berneice.hamill@ethereal.email",
        pass: "dj5MDvtar1nZMzF1Hr",
      },
    });

    let mailOptions = {
      from: "smtp.ethereal.email",
      to: "brendon.stamm@ethereal.email",
      subject: "Verify your email!",
      text: "Verify Email",
      html: `<div style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
        <h1 style="color: #4CAF50;">Welcome to NepalKamma!</h1>
        <p style="color: #333333; line-height: 1.6;">Please use the following OTP code to verify your account:</p>
        <p style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">${otp}</p>
        <p style="color: #333333; line-height: 1.6;">If you didn't request this OTP, please ignore this email.</p>
        <div style="margin-top: 20px; text-align: center; color: #999999; font-size: 12px;">
          <p>This email was sent to you by NepalKamma</p>
        </div>
      </div>
    </div>`,
    };

    const HashedOTP = await hashPassword(otp);
    const newOTPVerification = await new UserOTPVerification({
      userId: _id,
      otp: HashedOTP,
      createdAt: currentDate,
      expiresAt: expiresAt,
    });

    await newOTPVerification.save();
    transporter.sendMail(mailOptions);
    res.json({
      status: "pending",
      message: "OTP has been sent to your email",
      data: {
        userId: _id,
        email,
        expiresAt,
      },
    });
  } catch (err) {
    res.json({
      status: "failed",
      message: "Something went wrong",
    });
  }
};
