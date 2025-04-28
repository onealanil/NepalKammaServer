import nodemailer from "nodemailer";

export const sendEmail = async ({ email }, res) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
          user: 'berneice.hamill@ethereal.email',
          pass: 'dj5MDvtar1nZMzF1Hr'
      }
  });

    let mailOptions = {
      from: "smtp.ethereal.email",
      to: "lue.daniel59@ethereal.email",
      subject: "Document Successfully verified!",
      text: "Document verified!",
      html: `<div style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
          <h1 style="color: #4CAF50;">Welcome to NepalKamma!</h1>
          <p style="color: #333333; line-height: 1.6;">Now you can use full features of the NepalKamma:</p>
          <p style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">Your document is successfully verified</p>
          <div style="margin-top: 20px; text-align: center; color: #999999; font-size: 12px;">
            <p>This email was sent to you by NepalKamma</p>
          </div>
        </div>
      </div>`,
    };

    transporter.sendMail(mailOptions);
    console.log("Email sent");
  } catch (err) {
    res.json({
      status: "failed",
      message: "Something went wrong",
    });
  }
};
