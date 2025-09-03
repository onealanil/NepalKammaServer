import nodemailer from "nodemailer";
import logger from "../../../utils/logger.js";
import dotenv from "dotenv";
dotenv.config();

// Email for Job Seeker - Payment Verification Success
export const sendPaymentVerificationSuccessEmail = async ({
    email,
    job_seeker_name,
    job_name,
    job_provider_name,
    amount,
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
            subject: `✅ Payment Verified Successfully - Rs.${amount} Confirmed!`,
            text: `Your payment verification request has been successfully approved. Rs.${amount} has been added to your total income.`,
            html: `<div style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4CAF50; margin-bottom: 10px;">✅ Payment Verified!</h1>
            <h2 style="color: #333333; font-size: 24px; margin: 0;">Your Request Has Been Successfully Approved</h2>
          </div>
          
          <!-- Success Message -->
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 6px; margin-bottom: 25px; border-left: 4px solid #4CAF50;">
            <div style="text-align: center;">
              <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
              <p style="color: #2e7d2e; font-size: 20px; font-weight: bold; margin: 0;">
                Congratulations! Your payment has been successfully verified.
              </p>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
            <p style="color: #333333; font-size: 18px; line-height: 1.6; margin-bottom: 15px;">
              Dear <strong>${job_seeker_name}</strong>,
            </p>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              We are pleased to inform you that your payment verification request for the job 
              <strong style="color: #4CAF50;">${job_name}</strong> has been <strong>successfully approved</strong>!
            </p>
            <p style="color: #333333; font-size: 16px; line-height: 1.6;">
              The payment of <strong style="color: #4CAF50; font-size: 18px;">Rs.${amount}</strong> 
              has been confirmed and added to your total income. Your professional credibility continues to grow!
            </p>
          </div>
          
          <!-- Payment Summary -->
          <div style="background-color: #ffffff; border: 1px solid #e0e0e0; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
            <h3 style="color: #333333; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
              💰 Payment Summary
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666666; font-weight: bold; width: 30%;">Job:</td>
                <td style="padding: 8px 0; color: #333333;">${job_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666; font-weight: bold;">Job Provider:</td>
                <td style="padding: 8px 0; color: #333333;">${job_provider_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666; font-weight: bold;">Verified Amount:</td>
                <td style="padding: 8px 0; color: #4CAF50; font-weight: bold; font-size: 18px;">Rs.${amount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666; font-weight: bold;">Status:</td>
                <td style="padding: 8px 0; color: #4CAF50; font-weight: bold;">✅ Verified & Completed</td>
              </tr>
            </table>
          </div>
          
          <!-- Thank You Message -->
          <div style="background-color: #fff9e6; padding: 20px; border-left: 4px solid #ffc107; margin-bottom: 25px; border-radius: 6px;">
            <h3 style="color: #b8860b; margin-top: 0; margin-bottom: 15px;">🙏 Thank You for Your Trust</h3>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Thank you for choosing NepalKamma as your trusted platform for freelance work. Your commitment to 
              transparency and professionalism helps us maintain a reliable and secure marketplace for everyone.
            </p>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              By verifying your payments, you're not just earning money—you're building a reputation that opens 
              doors to better opportunities and higher-paying projects.
            </p>
            <p style="color: #b8860b; font-style: italic; font-size: 16px; margin: 0;">
              "Your transparency and professionalism make you a valued member of our community!"
            </p>
          </div>
          
          <!-- Premium Features Unlocked -->
          <div style="background-color: #e3f2fd; padding: 20px; border-left: 4px solid #2196F3; margin-bottom: 25px; border-radius: 6px;">
            <h3 style="color: #1976d2; margin-top: 0; margin-bottom: 15px;">🌟 Premium Features Now Active</h3>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
              With your payment verified, you now have access to:
            </p>
            <ul style="color: #333333; font-size: 16px; line-height: 1.6; padding-left: 20px; margin-bottom: 15px;">
              <li><strong>Verified Badge:</strong> ✅ Display on your profile</li>
              <li><strong>Priority Listings:</strong> Higher visibility in job searches</li>
              <li><strong>Advanced Analytics:</strong> Track your earning patterns</li>
              <li><strong>Premium Support:</strong> Faster response times</li>
              <li><strong>Review System:</strong> Rate your experience with ${job_provider_name}</li>
            </ul>
            <p style="color: #1976d2; font-weight: bold; font-size: 16px; margin: 0;">
              Keep earning and verifying to unlock even more benefits! 🚀
            </p>
          </div>
          
          <!-- Next Steps -->
          <div style="background-color: #f3e5f5; padding: 20px; border-radius: 6px; border-left: 4px solid #9c27b0; margin-bottom: 25px;">
            <h3 style="color: #7b1fa2; margin-top: 0; margin-bottom: 15px;">🎯 What's Next?</h3>
            <div style="color: #333333; font-size: 16px; line-height: 1.6;">
              <p style="margin-bottom: 10px;">✨ <strong>Leave a Review:</strong> Share your experience working with ${job_provider_name}</p>
              <p style="margin-bottom: 10px;">🔍 <strong>Find New Jobs:</strong> Browse fresh opportunities with your enhanced profile</p>
              <p style="margin-bottom: 10px;">📊 <strong>Track Progress:</strong> Check your updated income and statistics</p>
              <p style="margin: 0;">🤝 <strong>Build Relationships:</strong> Connect with more clients for repeat business</p>
            </div>
          </div>
          
          <!-- CTA Buttons -->
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="#" 
               style="display: inline-block; background-color: #4CAF50; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; 
                      box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-right: 10px;">
              View My Profile
            </a>
            <a href="#" 
               style="display: inline-block; background-color: #2196F3; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; 
                      box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              Find New Jobs
            </a>
          </div>
          
          <!-- Footer -->
          <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; text-align: center;">
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              🎉 <strong>Once again, congratulations on your successful payment verification!</strong> 🎉
            </p>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Your professionalism and dedication to quality work make NepalKamma a better place for everyone.
            </p>
            <p style="color: #4CAF50; font-size: 18px; font-weight: bold; margin-bottom: 20px;">
              Thank you for being an amazing part of the NepalKamma family! 💚
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

        logger.info('Payment verification success email sent to job seeker', {
            email,
            job_seeker_name,
            job_name,
            amount,
            requestId: req.requestId
        });

    } catch (err) {
        logger.error('Payment verification success email failed', {
            error: err.message,
            email,
            requestId: req.requestId
        });
        throw new Error('Failed to send payment verification success email');
    }
};

// Email for Job Provider - Payment Transparency Appreciation
export const sendPaymentTransparencyAppreciationEmail = async ({
    email,
    job_provider_name,
    job_seeker_name,
    job_name,
    amount,
    milestone_achieved
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
            subject: `👏 Hats Off to Your Transparency! Payment Successfully Verified`,
            text: `Thank you for your transparency! Your payment to ${job_seeker_name} has been successfully verified by both parties.`,
            html: `<div style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4CAF50; margin-bottom: 10px;">👏 Hats Off to You!</h1>
            <h2 style="color: #333333; font-size: 24px; margin: 0;">Payment Successfully Verified by Both Parties</h2>
          </div>
          
          <!-- Appreciation Banner -->
          <div style="background: linear-gradient(135deg, #4CAF50, #45a049); padding: 25px; border-radius: 10px; margin-bottom: 25px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 15px;">🏆</div>
            <p style="color: white; font-size: 20px; font-weight: bold; margin-bottom: 10px;">
              Outstanding Transparency & Professionalism!
            </p>
            <p style="color: white; font-size: 16px; margin: 0;">
              Your commitment to fair payments makes our platform better for everyone
            </p>
          </div>
          
          <!-- Main Content -->
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
            <p style="color: #333333; font-size: 18px; line-height: 1.6; margin-bottom: 15px;">
              Dear <strong>${job_provider_name}</strong>,
            </p>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              We want to extend our heartfelt appreciation for your <strong>transparency and integrity</strong> 
              in completing the payment process for <strong style="color: #4CAF50;">${job_name}</strong>.
            </p>
            <p style="color: #333333; font-size: 16px; line-height: 1.6;">
              Your payment of <strong style="color: #4CAF50; font-size: 18px;">Rs.${amount}</strong> to 
              <strong>${job_seeker_name}</strong> has been <strong>successfully verified by both parties</strong>, 
              demonstrating the highest level of professional conduct.
            </p>
          </div>
          
          <!-- Transaction Summary -->
          <div style="background-color: #ffffff; border: 1px solid #e0e0e0; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
            <h3 style="color: #333333; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
              ✅ Verified Transaction Summary
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666666; font-weight: bold; width: 30%;">Job:</td>
                <td style="padding: 8px 0; color: #333333;">${job_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666; font-weight: bold;">Freelancer:</td>
                <td style="padding: 8px 0; color: #333333;">${job_seeker_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666; font-weight: bold;">Amount Paid:</td>
                <td style="padding: 8px 0; color: #4CAF50; font-weight: bold; font-size: 18px;">Rs.${amount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666; font-weight: bold;">Verification:</td>
                <td style="padding: 8px 0; color: #4CAF50; font-weight: bold;">✅ Confirmed by Both Parties</td>
              </tr>
            </table>
          </div>
          
          <!-- Appreciation Message -->
          <div style="background-color: #e8f5e8; padding: 20px; border-left: 4px solid #4CAF50; margin-bottom: 25px; border-radius: 6px;">
            <h3 style="color: #2e7d2e; margin-top: 0; margin-bottom: 15px;">🌟 Why Your Transparency Matters</h3>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Your commitment to transparent and timely payments creates a foundation of trust that benefits 
              the entire NepalKamma community. Here's the positive impact of your actions:
            </p>
            <ul style="color: #333333; font-size: 16px; line-height: 1.6; padding-left: 20px; margin-bottom: 15px;">
              <li><strong>Builds Trust:</strong> Encourages more skilled freelancers to join the platform</li>
              <li><strong>Sets Standards:</strong> Shows other job providers the importance of fair payment</li>
              <li><strong>Creates Loyalty:</strong> ${job_seeker_name} is more likely to work with you again</li>
              <li><strong>Enhances Reputation:</strong> Your profile gains credibility for future projects</li>
            </ul>
            <p style="color: #2e7d2e; font-style: italic; font-size: 16px; margin: 0;">
              "Transparency is the foundation of all great business relationships!"
            </p>
          </div>
          
          <!-- Achievement Recognition -->
          ${milestone_achieved ? `
          <div style="background-color: #fff3cd; padding: 20px; border-left: 4px solid #ffc107; margin-bottom: 25px; border-radius: 6px;">
            <h3 style="color: #856404; margin-top: 0; margin-bottom: 15px;">🎖️ Milestone Achievement!</h3>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              <strong>Congratulations!</strong> You've reached a significant milestone with your successful job completions. 
              Your consistency in delivering quality projects and making timely payments demonstrates exceptional professionalism.
            </p>
            <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; border: 1px solid #ffc107; text-align: center;">
              <p style="color: #856404; font-weight: bold; font-size: 18px; margin: 0;">
                🏆 Milestone Achieved: ${milestone_achieved} Jobs Successfully Completed!
              </p>
            </div>
          </div>
          ` : ''}
          
          <!-- Community Impact -->
          <div style="background-color: #e3f2fd; padding: 20px; border-left: 4px solid #2196F3; margin-bottom: 25px; border-radius: 6px;">
            <h3 style="color: #1976d2; margin-top: 0; margin-bottom: 15px;">🤝 Your Positive Community Impact</h3>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Job providers like you are the backbone of our thriving freelance community. Your ethical approach to business:
            </p>
            <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
              <p style="color: #1976d2; font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
                ✨ <strong>Creates Opportunities:</strong> More freelancers trust the platform<br>
                💼 <strong>Raises Standards:</strong> Encourages professional excellence<br>
                🌱 <strong>Grows Economy:</strong> Contributes to Nepal's digital workforce<br>
                🔄 <strong>Builds Relationships:</strong> Fosters long-term collaborations
              </p>
            </div>
            <p style="color: #1976d2; font-weight: bold; font-size: 16px; margin: 0;">
              Thank you for being a cornerstone of our community! 🙏
            </p>
          </div>
          
          <!-- Review Opportunity -->
          <div style="background-color: #f3e5f5; padding: 20px; border-radius: 6px; border-left: 4px solid #9c27b0; margin-bottom: 25px;">
            <h3 style="color: #7b1fa2; margin-top: 0; margin-bottom: 15px;">⭐ Share Your Experience</h3>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Your transaction is now complete! You can now rate your experience working with 
              <strong>${job_seeker_name}</strong>. Your feedback helps other job providers make informed decisions.
            </p>
            <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; border: 1px solid #9c27b0;">
              <p style="color: #7b1fa2; font-weight: bold; font-size: 16px; margin: 0;">
                📝 Help the community by sharing your honest review and rating!
              </p>
            </div>
          </div>
          
          <!-- CTA Buttons -->
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="#" 
               style="display: inline-block; background-color: #4CAF50; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; 
                      box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-right: 10px;">
              Rate ${job_seeker_name}
            </a>
            <a href="#" 
               style="display: inline-block; background-color: #2196F3; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; 
                      box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              Post New Job
            </a>
          </div>
          
          <!-- Final Thank You -->
          <div style="background: linear-gradient(135deg, #ff9800, #f57c00); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 25px;">
            <h3 style="color: white; margin-top: 0; margin-bottom: 15px;">🙏 Thank You for Your Excellence</h3>
            <p style="color: white; font-size: 16px; line-height: 1.6; margin: 0;">
              Your professionalism, transparency, and commitment to fair payments make NepalKamma 
              a trusted platform where both job providers and freelancers can thrive together.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; text-align: center;">
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              🎉 <strong>Hats off to your transparency and professionalism!</strong> 🎉
            </p>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              We're proud to have job providers like you who uphold the highest standards of business ethics.
            </p>
            <p style="color: #4CAF50; font-size: 18px; font-weight: bold; margin-bottom: 20px;">
              Thank you for making NepalKamma a better place for everyone! 🌟
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

        logger.info('Payment transparency appreciation email sent to job provider', {
            email,
            job_provider_name,
            job_seeker_name,
            job_name,
            amount,
            requestId: req.requestId
        });

    } catch (err) {
        logger.error('Payment transparency appreciation email failed', {
            error: err.message,
            email,
            requestId: req.requestId
        });
        throw new Error('Failed to send payment transparency appreciation email');
    }
};