// config/nodemailer.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL,           // e.g. careers@gyannidhi.in
    pass: process.env.GMAIL_APP_PASS,  // Use App Password (NOT Gmail login password)
  },
});

/**
 * Verify transporter connection on startup
 * Helps catch Gmail auth or less-secure-app issues early.
 */
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Nodemailer setup failed:", error.message);
  } else {
    console.log("✅ Nodemailer transporter ready to send emails");
  }
});

export default transporter;
