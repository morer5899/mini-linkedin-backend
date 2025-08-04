import nodemailer from "nodemailer";
import chalk from "chalk"; // For colorful console logs

const sendEmail = async (to, subject, text) => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "Gmail", // Use your email provider
      auth: {
        user: process.env.EMAIL_USER, // Sender email from .env
        pass: process.env.EMAIL_PASS, // App password or email password
      },
    });

    // Email message (HTML and text)
    const htmlMessage = `
    <div style="
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: auto;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 10px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      background: #ffffff;
    ">
      <h2 style="color: #007bff; text-align: center;">📢 ${subject}</h2>
      
      <p style="font-size: 16px; color: #333; text-align: center;">
        ${text}
      </p>
  
      <div style="text-align: center; margin: 20px 0;">
        <a href="#" style="
          display: inline-block;
          padding: 12px 24px;
          font-size: 16px;
          color: white;
          background: #007bff;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.2);
        ">Take Action</a>
      </div>
  
      <hr style="border: 0; height: 1px; background: #ddd; margin: 20px 0;"/>
  
      <p style="font-size: 14px; color: #777; text-align: center;">
        This is an automated message. Please do not reply.
      </p>
    </div>
  `;
  

    const mailOptions = {
      from: `"Your Company" <${process.env.EMAIL_USER}>`, // Custom sender name
      to:to, // Recipient email
      html: htmlMessage, // HTML message
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // Success log with colors
    console.log(chalk.green.bold("✅ Email sent successfully to:"), chalk.cyan(to));
    console.log(chalk.blue("📨 Message:"), chalk.yellow(subject));

    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    // Error logging with colors
    console.error(chalk.red.bold("❌ Email sending error:"), error.message);

    return { success: false, message: "Error sending email" };
  }
};

export default sendEmail;
