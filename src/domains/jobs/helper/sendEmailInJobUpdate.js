import nodemailer from "nodemailer";
import logger from "../../../utils/logger.js";
import dotenv from "dotenv";
dotenv.config();

export const sendEmailInJobUpdatePending = async ({
    email,
    job_seeker_name,
    job_name,
    job_provider_name,
    job_provider_email,
    job_provider_phone
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
            subject: `Congratulations! You've been assigned to ${job_name}`,
            text: `Congratulations ${job_seeker_name}! You have been assigned to the job ${job_name} by ${job_provider_name}.`,
            html: `<div style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4CAF50; margin-bottom: 10px;">🎉 Congratulations!</h1>
            <h2 style="color: #333333; font-size: 24px; margin: 0;">Job Assignment Confirmation</h2>
          </div>
          
          <!-- Main Content -->
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
            <p style="color: #333333; font-size: 18px; line-height: 1.6; margin-bottom: 15px;">
              Dear <strong>${job_seeker_name}</strong>,
            </p>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              We are pleased to inform you that you have been successfully assigned to the 
              <strong style="color: #4CAF50;">${job_name}</strong> by <strong>${job_provider_name}</strong>.
            </p>
            <p style="color: #333333; font-size: 16px; line-height: 1.6;">
              This is a fantastic opportunity to showcase your skills and make a lasting impression. 
              We believe in your potential and encourage you to bring your best effort to this role. 
              Your dedication and professionalism will not only contribute to the success of this project 
              but also open doors for future opportunities with the job provider.
            </p>
          </div>
          
          <!-- Motivational Message -->
          <div style="background-color: #e8f5e8; padding: 20px; border-left: 4px solid #4CAF50; margin-bottom: 25px;">
            <h3 style="color: #2e7d2e; margin-top: 0; margin-bottom: 15px;">💪 Your Path to Success</h3>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
              Remember, every great career is built on consistent excellence and professional relationships. 
              This assignment is your chance to:
            </p>
            <ul style="color: #333333; font-size: 16px; line-height: 1.6; padding-left: 20px;">
              <li>Demonstrate your expertise and reliability</li>
              <li>Build a strong professional network</li>
              <li>Create opportunities for long-term collaboration</li>
              <li>Establish yourself as a trusted professional in your field</li>
            </ul>
            <p style="color: #2e7d2e; font-style: italic; font-size: 16px; margin-top: 15px; margin-bottom: 0;">
              "Excellence is not a skill, it's an attitude. Make every task count!"
            </p>
          </div>
          
          <!-- Job Provider Details -->
          <div style="background-color: #ffffff; border: 1px solid #e0e0e0; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
            <h3 style="color: #333333; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
              📋 Job Provider Details
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666666; font-weight: bold; width: 30%;">Name:</td>
                <td style="padding: 8px 0; color: #333333;">${job_provider_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666; font-weight: bold;">Email:</td>
                <td style="padding: 8px 0; color: #333333;">
                  <a href="mailto:${job_provider_email}" style="color: #4CAF50; text-decoration: none;">
                    ${job_provider_email}
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666; font-weight: bold;">Phone:</td>
                <td style="padding: 8px 0; color: #333333;">
                  <a href="tel:${job_provider_phone}" style="color: #4CAF50; text-decoration: none;">
                    ${job_provider_phone}
                  </a>
                </td>
              </tr>
            </table>
          </div>
          
          <!-- Next Steps -->
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 6px; border-left: 4px solid #ffc107; margin-bottom: 25px;">
            <h3 style="color: #856404; margin-top: 0; margin-bottom: 15px;">📝 Next Steps</h3>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
              We recommend reaching out to your job provider as soon as possible to:
            </p>
            <ul style="color: #333333; font-size: 16px; line-height: 1.6; padding-left: 20px; margin-bottom: 0;">
              <li>Confirm your availability and start date</li>
              <li>Discuss project requirements and expectations</li>
              <li>Establish communication preferences</li>
              <li>Clarify any questions you may have about the role</li>
            </ul>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="mailto:${job_provider_email}?subject=Job Assignment Confirmation - ${job_name}" 
               style="display: inline-block; background-color: #4CAF50; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; 
                      box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              Contact Job Provider
            </a>
          </div>
          
          <!-- Footer -->
          <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; text-align: center;">
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Best of luck with your new assignment! We're here to support you every step of the way.
            </p>
            <p style="color: #4CAF50; font-size: 18px; font-weight: bold; margin-bottom: 20px;">
              Welcome to your next career milestone with NepalKamma!
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

        logger.info('Job assignment email sent successfully', {
            email,
            job_seeker_name,
            job_name,
            job_provider_name,
            requestId: req.requestId
        });

    } catch (err) {
        logger.error('Job assignment email failed', {
            error: err.message,
            email,
            requestId: req.requestId
        });
        throw new Error('Failed to send job assignment email');
    }
};

/**
 * @function sendJobCompletionEmail
 * @description This function sends an email to the job seeker when they complete a job.
 */
export const sendJobCompletionEmail = async ({
    email,
    job_seeker_name,
    job_name,
    job_provider_name,
    job_provider_email,
    job_provider_phone
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
            subject: `🎉 Congratulations! You've Successfully Completed ${job_name}`,
            text: `Congratulations ${job_seeker_name}! You have successfully completed the job ${job_name}. Please wait for payment confirmation from ${job_provider_name}.`,
            html: `<div style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4CAF50; margin-bottom: 10px;">🎉 Outstanding Achievement!</h1>
            <h2 style="color: #333333; font-size: 24px; margin: 0;">Job Successfully Completed</h2>
          </div>
          
          <!-- Main Content -->
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
            <p style="color: #333333; font-size: 18px; line-height: 1.6; margin-bottom: 15px;">
              Dear <strong>${job_seeker_name}</strong>,
            </p>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              🌟 <strong>Congratulations!</strong> You have successfully completed the 
              <strong style="color: #4CAF50;">${job_name}</strong> for <strong>${job_provider_name}</strong>.
            </p>
            <p style="color: #333333; font-size: 16px; line-height: 1.6;">
              Your dedication, professionalism, and hard work have shone through once again. 
              Completing this job is not just a task finished—it's another step forward in building 
              your reputation as a reliable and skilled professional. Well done!
            </p>
          </div>
          
          <!-- Congratulatory Message -->
          <div style="background-color: #e8f5e8; padding: 20px; border-left: 4px solid #4CAF50; margin-bottom: 25px;">
            <h3 style="color: #2e7d2e; margin-top: 0; margin-bottom: 15px;">🏆 You Should Be Proud!</h3>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
              Every completed job is a testament to your capabilities and commitment. This achievement represents:
            </p>
            <ul style="color: #333333; font-size: 16px; line-height: 1.6; padding-left: 20px;">
              <li>Your expertise and skill in delivering quality work</li>
              <li>Your reliability and trustworthiness as a professional</li>
              <li>Another satisfied client in your growing network</li>
              <li>Enhanced reputation that opens doors to future opportunities</li>
            </ul>
            <p style="color: #2e7d2e; font-style: italic; font-size: 16px; margin-top: 15px; margin-bottom: 0;">
              "Success is not the destination, it's the journey of consistent excellence. Keep up the amazing work!"
            </p>
          </div>
          
          <!-- Motivational Message -->
          <div style="background-color: #fff9e6; padding: 20px; border-left: 4px solid #ffc107; margin-bottom: 25px;">
            <h3 style="color: #b8860b; margin-top: 0; margin-bottom: 15px;">💪 Keep Building Your Success Story</h3>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
              Each completed job is a building block in your career foundation. You're not just earning—you're growing, 
              learning, and establishing yourself as a go-to professional in your field.
            </p>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
              Remember, satisfied clients become your best advocates. The quality work you've delivered today 
              might lead to repeat business, referrals, and long-term professional relationships.
            </p>
            <p style="color: #b8860b; font-weight: bold; font-size: 16px; margin-top: 15px; margin-bottom: 0;">
              Your success story continues to unfold with each job well done!
            </p>
          </div>
          
          <!-- Payment Information -->
          <div style="background-color: #e3f2fd; padding: 20px; border-left: 4px solid #2196F3; margin-bottom: 25px;">
            <h3 style="color: #1976d2; margin-top: 0; margin-bottom: 15px;">💰 Payment Information</h3>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              Now it's time to await your well-deserved payment! Here's what happens next:
            </p>
            <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
                ✅ <strong>Job Status:</strong> Completed<br>
                ⏳ <strong>Payment Status:</strong> Pending confirmation from job provider<br>
                📧 <strong>Notification:</strong> You'll receive an email once payment is processed
              </p>
            </div>
            <p style="color: #1976d2; font-size: 16px; line-height: 1.6; margin: 0;">
              <strong>Don't worry!</strong> We'll send you an immediate email notification as soon as 
              <strong>${job_provider_name}</strong> processes your payment.
            </p>
          </div>
          
          <!-- Job Provider Details -->
          <div style="background-color: #ffffff; border: 1px solid #e0e0e0; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
            <h3 style="color: #333333; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
              📋 Job Provider Details
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666666; font-weight: bold; width: 30%;">Name:</td>
                <td style="padding: 8px 0; color: #333333;">${job_provider_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666; font-weight: bold;">Email:</td>
                <td style="padding: 8px 0; color: #333333;">
                  <a href="mailto:${job_provider_email}" style="color: #4CAF50; text-decoration: none;">
                    ${job_provider_email}
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666666; font-weight: bold;">Phone:</td>
                <td style="padding: 8px 0; color: #333333;">
                  <a href="tel:${job_provider_phone}" style="color: #4CAF50; text-decoration: none;">
                    ${job_provider_phone}
                  </a>
                </td>
              </tr>
            </table>
          </div>
          
          <!-- What's Next -->
          <div style="background-color: #f3e5f5; padding: 20px; border-radius: 6px; border-left: 4px solid #9c27b0; margin-bottom: 25px;">
            <h3 style="color: #7b1fa2; margin-top: 0; margin-bottom: 15px;">🚀 What's Next?</h3>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
              While you wait for payment confirmation:
            </p>
            <ul style="color: #333333; font-size: 16px; line-height: 1.6; padding-left: 20px; margin-bottom: 15px;">
              <li>Take a moment to celebrate this achievement</li>
              <li>Update your portfolio with this successful completion</li>
              <li>Consider asking for a testimonial or review</li>
              <li>Browse new job opportunities on NepalKamma</li>
            </ul>
            <p style="color: #7b1fa2; font-style: italic; font-size: 16px; margin: 0;">
              "Every ending is a new beginning. Ready for your next success story?"
            </p>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="mailto:${job_provider_email}?subject=Job Completion Confirmation - ${job_name}" 
               style="display: inline-block; background-color: #4CAF50; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; 
                      box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-right: 10px;">
              Thank Job Provider
            </a>
            <a href="#" 
               style="display: inline-block; background-color: #2196F3; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; 
                      box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              Find More Jobs
            </a>
          </div>
          
          <!-- Footer -->
          <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; text-align: center;">
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              🌟 <strong>Congratulations once again on your outstanding work!</strong> 🌟
            </p>
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
              We'll notify you immediately once your payment is processed. Keep up the excellent work!
            </p>
            <p style="color: #4CAF50; font-size: 18px; font-weight: bold; margin-bottom: 20px;">
              Celebrating your success with NepalKamma! 🎉
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

        logger.info('Job completion email sent successfully', {
            email,
            job_seeker_name,
            job_name,
            job_provider_name,
            requestId: req.requestId
        });

    } catch (err) {
        logger.error('Job completion email failed', {
            error: err.message,
            email,
            requestId: req.requestId
        });
        throw new Error('Failed to send job completion email');
    }
};