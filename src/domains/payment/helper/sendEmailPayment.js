import nodemailer from "nodemailer";
import logger from "../../../utils/logger.js";
import dotenv from "dotenv";
dotenv.config();


export const sendPaymentNotificationEmail = async ({
    email,
    job_seeker_name,
    job_name,
    job_provider_name,
    amount,
    payment_method,
    receiver_number
}, res, req) => {
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
            subject: `💰 Payment Alert: ${job_provider_name} has sent you Rs.${amount}`,
            text: `Payment notification: ${job_provider_name} has paid Rs.${amount} for ${job_name}. Please check and confirm receipt.`,
            html: `<div style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4CAF50; margin-bottom: 10px;">💰 Payment Notification</h1>
            <h2 style="color: #333333; font-size: 24px; margin: 0;">Your Payment Has Been Sent!</h2>
          </div>
          
          <!-- Main Content -->
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
            <p style="color: #333333; font-size: 18px; line-height: 1.6; margin-bottom: 15px;">
              Dear <strong>${job_seeker_name}</strong>,
            </p>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Great news! <strong>${job_provider_name}</strong> has processed your payment for the completed job 
              <strong style="color: #4CAF50;">${job_name}</strong>.
            </p>
            <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; border-left: 4px solid #4CAF50;">
              <p style="color: #2e7d2e; font-size: 18px; font-weight: bold; margin: 0;">
                💸 Payment Amount: Rs.${amount}
              </p>
            </div>
          </div>
          
          <!-- Payment Details -->
          <div style="background-color: #ffffff; border: 1px solid #e0e0e0; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
            <h3 style="color: #333333; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
              💳 Payment Details
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666666; font-weight: bold; width: 30%;">From:</td>
                <td style="padding: 8px 0; color: #333333;">${job_provider_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666; font-weight: bold;">Job:</td>
                <td style="padding: 8px 0; color: #333333;">${job_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666; font-weight: bold;">Amount:</td>
                <td style="padding: 8px 0; color: #333333; font-weight: bold; color: #4CAF50;">Rs.${amount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666; font-weight: bold;">Payment Method:</td>
                <td style="padding: 8px 0; color: #333333;">${payment_method}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666; font-weight: bold;">Receiver Number:</td>
                <td style="padding: 8px 0; color: #333333;">${receiver_number}</td>
              </tr>
            </table>
          </div>
          
          <!-- Important Message -->
          <div style="background-color: #fff3cd; padding: 20px; border-left: 4px solid #ffc107; margin-bottom: 25px; border-radius: 6px;">
            <h3 style="color: #856404; margin-top: 0; margin-bottom: 15px;">📋 Important: Did You Receive the Payment?</h3>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Please check your account/wallet and confirm if you have received the payment of <strong>Rs.${amount}</strong>.
            </p>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              <strong>If you have received the payment:</strong>
            </p>
            <ol style="color: #333333; font-size: 16px; line-height: 1.6; padding-left: 20px; margin-bottom: 15px;">
              <li>Go to your <strong>"Completed Jobs"</strong> page</li>
              <li>Find this job and click on <strong>"Request Payment Verification"</strong></li>
              <li>Upload proof of payment receipt (screenshot, transaction details, etc.)</li>
              <li>Submit for verification</li>
            </ol>
            <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; border: 1px solid #ffc107;">
              <p style="color: #856404; font-weight: bold; font-size: 16px; margin: 0;">
                ⭐ Why verify your payment? This helps us build your credibility profile and unlocks premium features!
              </p>
            </div>
          </div>
          
          <!-- Benefits Section -->
          <div style="background-color: #e3f2fd; padding: 20px; border-left: 4px solid #2196F3; margin-bottom: 25px; border-radius: 6px;">
            <h3 style="color: #1976d2; margin-top: 0; margin-bottom: 15px;">🌟 Payment Verification Benefits</h3>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
              Verifying your payments unlocks exclusive features:
            </p>
            <ul style="color: #333333; font-size: 16px; line-height: 1.6; padding-left: 20px; margin-bottom: 15px;">
              <li><strong>Priority Job Listings:</strong> Your profile appears higher in search results</li>
              <li><strong>Verified Badge:</strong> Builds trust with potential clients</li>
              <li><strong>Advanced Analytics:</strong> Track your earnings and job performance</li>
              <li><strong>Premium Support:</strong> Get priority customer service</li>
              <li><strong>Higher Job Limits:</strong> Apply to more jobs simultaneously</li>
              <li><strong>Payment Protection:</strong> Dispute resolution assistance</li>
            </ul>
            <p style="color: #1976d2; font-style: italic; font-size: 16px; margin: 0;">
              "Verified freelancers earn 40% more on average!"
            </p>
          </div>
          
          <!-- Action Steps -->
          <div style="background-color: #f3e5f5; padding: 20px; border-radius: 6px; border-left: 4px solid #9c27b0; margin-bottom: 25px;">
            <h3 style="color: #7b1fa2; margin-top: 0; margin-bottom: 15px;">🚀 What to Do Next?</h3>
            <div style="color: #333333; font-size: 16px; line-height: 1.6;">
              <p style="margin-bottom: 15px;"><strong>Step 1:</strong> Check if you received Rs.${amount} in your account/wallet</p>
              <p style="margin-bottom: 15px;"><strong>Step 2:</strong> Take a screenshot or note down transaction details</p>
              <p style="margin-bottom: 15px;"><strong>Step 3:</strong> Visit your "Completed Jobs" page on NepalKamma</p>
              <p style="margin-bottom: 15px;"><strong>Step 4:</strong> Upload payment proof and request verification</p>
              <p style="margin: 0;"><strong>Step 5:</strong> Enjoy enhanced profile features and increased job opportunities!</p>
            </div>
          </div>
          
          <!-- CTA Buttons -->
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="#" 
               style="display: inline-block; background-color: #4CAF50; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; 
                      box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-right: 10px;">
              Go to Completed Jobs
            </a>
            <a href="mailto:${job_provider_name}?subject=Payment Received Confirmation - ${job_name}" 
               style="display: inline-block; background-color: #2196F3; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; 
                      box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              Contact Job Provider
            </a>
          </div>
          
          <!-- Warning -->
          <div style="background-color: #ffebee; padding: 20px; border-left: 4px solid #f44336; margin-bottom: 25px; border-radius: 6px;">
            <h3 style="color: #c62828; margin-top: 0; margin-bottom: 15px;">⚠️ Didn't Receive Payment?</h3>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
              If you haven't received the payment within 24 hours:
            </p>
            <ul style="color: #333333; font-size: 16px; line-height: 1.6; padding-left: 20px; margin-bottom: 15px;">
              <li>Contact the job provider directly</li>
              <li>Check your payment method for any issues</li>
              <li>Report the issue to NepalKamma support</li>
            </ul>
            <p style="color: #c62828; font-weight: bold; font-size: 16px; margin: 0;">
              We're here to help resolve any payment issues!
            </p>
          </div>
          
          <!-- Footer -->
          <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; text-align: center;">
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              🎉 <strong>Congratulations on another successful job completion!</strong> 🎉
            </p>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Keep up the excellent work and continue building your reputation on NepalKamma.
            </p>
            <p style="color: #4CAF50; font-size: 18px; font-weight: bold; margin-bottom: 20px;">
              Your success is our success! 💪
            </p>
            <div style="color: #999999; font-size: 12px;">
              <p style="margin-bottom: 5px;">This email was sent to you by NepalKamma</p>
              <p style="margin: 0;">© 2024 NepalKamma. All rights reserved.</p>
            </div>
          </div>
          
        </div>
      </div>`,
        };

        await transporter.sendMail(mailOptions);

        logger.info('Payment notification email sent successfully', {
            email,
            job_seeker_name,
            job_name,
            job_provider_name,
            amount,
            requestId: req.requestId
        });

    } catch (err) {
        logger.error('Payment notification email failed', {
            error: err.message,
            email,
            requestId: req.requestId
        });
        throw new Error('Failed to send payment notification email');
    }
};