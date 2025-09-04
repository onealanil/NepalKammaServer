import nodemailer from "nodemailer";
import logger from "../../../utils/logger.js";
import dotenv from "dotenv";
dotenv.config();

export const sendRejectionEmail = async ({ email, reason }, res, req) => {
    try {
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
            subject: "Document Verification Update - Action Required",
            text: "Document verification was unsuccessful. Please review and resubmit.",
            html: `<div style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
          <h1 style="color: #f44336;">NepalKamma Document Review</h1>
          <p style="color: #333333; line-height: 1.6;">We have reviewed your submitted document and need you to take action:</p>
          <p style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #f44336;">Document verification was unsuccessful</p>
          ${reason ? `<div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0;">
            <p style="color: #856404; margin: 0; font-weight: bold;">Reason for rejection:</p>
            <p style="color: #856404; margin: 10px 0 0 0;">${reason}</p>
          </div>` : ''}
          <p style="color: #333333; line-height: 1.6;">Please review the feedback above and resubmit your document with the necessary corrections to continue using NepalKamma's full features.</p>
          <div style="margin-top: 30px; padding: 15px; background-color: #e3f2fd; border-radius: 4px;">
            <p style="color: #1565c0; margin: 0; font-size: 14px;">
              <strong>What's next?</strong><br>
              1. Review the rejection reason<br>
              2. Prepare a corrected document<br>
              3. Resubmit through your NepalKamma account
            </p>
          </div>
          <div style="margin-top: 20px; text-align: center; color: #999999; font-size: 12px;">
            <p>This email was sent to you by NepalKamma</p>
          </div>
        </div>
      </div>`,
        };

        transporter.sendMail(mailOptions);
        logger.info('Rejection email sent successfully', {
            email,
            reason,
            requestId: req.requestId
        });
    } catch (err) {
        logger.error('Rejection email failed', {
            error: err.message,
            requestId: req.requestId
        });
        res.json({
            status: "failed",
            message: "Something went wrong",
        });
    }
};