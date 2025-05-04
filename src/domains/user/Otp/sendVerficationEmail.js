/**
 * @file sendVerficationEmail.js
 * @description This file contains the function to send OTP verification email to the user.
 * It uses nodemailer to send the email and mongoose to save the OTP in the database
 */
import nodemailer from "nodemailer";
import UserOTPVerification from "../../../../models/UserOTPVerification.js";
import { hashPassword } from "../../../utils/hashBcrypt.js";
import { generateOTP } from "../../../utils/otpGenerator.js";

/**
 * @function sendOTPVerificationEmail
 * @param {*} _id - User ID
 * @param {*} email - User email
 * @param {*} res - Response object
 * @description This function sends an OTP verification email to the user and saves the OTP in the database.
 * It generates a random OTP, hashes it, and saves it in the UserOTPVerification collection along with the user ID and expiration time.
 */
export const sendOTPVerificationEmail = async ({ _id, email }, res) => {
  try {
    const otp = generateOTP();
    const currentDate = Date.now();
    const expiresAt = new Date(currentDate + 180000);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
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

// export const sendVerifiedEmail = async (_id, email, username, res) => {
//   try {
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASSWORD,
//       },
//     });
//     let mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "Email Verified",
//       text: "Email Verified",
//       html: `<div style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
//       <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
//         <h1 style="color: #4CAF50;">${username} Welcome to NepalKamma!</h1>
//         <p style="color: #333333; line-height: 1.6;">Your email has been verified successfully.</p>
//         <div style="margin-top: 20px; text-align: center; color: #999999; font-size: 12px;">
//           <p>This email was sent to you by NepalKamma</p>
//         </div>
//       </div>
//     </div>`,
//     };
//     transporter.sendMail(mailOptions);
//     res.json({
//       status: "success",
//       message: "Email has been verified successfully",
//       data: {
//         userId: _id,
//         email,
//       },
//     });
//   } catch (err) {
//     res.json({
//       status: "failed",
//       message: "Something went wrong",
//     });
//   }
// };
