// controllers/applicationController.js
import fs from "fs";
import path from "path";
import validator from "validator";
import transporter from "../config/nodemailer.js";

export const submitJobApplication = async (req, res) => {
  try {
    // ---- 0) Early env checks (avoids opaque 500s) ----
    const FROM_EMAIL = process.env.GMAIL;
    const HR_EMAIL   = process.env.HR_EMAIL || "hr@gyannidhi.in";
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

    if (!FROM_EMAIL) {
      console.error("❌ GMAIL env missing. Set GMAIL and GMAIL_APP_PASS in server .env");
      return res.status(500).json({ success: false, message: "Email sender not configured" });
    }

    // ---- 1) Read & validate input ----
    const { fullName, email, phone, comments, jobId, jobTitle } = req.body;
    const resumePath = req.file ? req.file.path : null;

    console.log("📩 Received body:", req.body);
    console.log("📎 Received file:", req.file);
    console.log("🔧 Email vars:", { FROM_EMAIL, HR_EMAIL, ADMIN_EMAIL });

    const required = [
      { field: fullName, name: "Full Name" },
      { field: email,    name: "Email Address" },
      { field: phone,    name: "Phone Number" },
      { field: comments, name: "Comments / Reason" },
    ];
    for (const r of required) {
      if (!r.field || String(r.field).trim() === "") {
        return res.status(400).json({ success: false, message: `${r.name} is required.` });
      }
    }
    if (!resumePath) {
      return res.status(400).json({ success: false, message: "Resume file is missing." });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address." });
    }
    if (!validator.isMobilePhone(phone, "any")) {
      return res.status(400).json({ success: false, message: "Enter a valid phone number." });
    }

    // Guard against undefined originalname even if resume exists
    const safeOriginalName = (req.file?.originalname && String(req.file.originalname).trim())
      ? req.file.originalname
      : path.basename(resumePath);

    // Helpful timestamp that actually includes time
    const submittedAt = new Date().toLocaleString("en-IN", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    });

    // ---- 2) Build emails ----
    const hrMailOptions = {
      from: FROM_EMAIL,                // must match authenticated account for Gmail
      to: HR_EMAIL,
      cc: ADMIN_EMAIL || undefined,
      subject: `📩 New Job Application – ${jobTitle || "Untitled Job"} (ID: ${jobId || "N/A"})`,
      html: `
        <h2>New Job Application Received</h2>
        <p><b>Job Title:</b> ${jobTitle || "Not specified"}</p>
        <p><b>Job ID:</b> ${jobId || "N/A"}</p>
        <p><b>Submitted On:</b> ${submittedAt}</p>
        <hr/>
        <p><b>Applicant Details:</b></p>
        <ul>
          <li><b>Name:</b> ${fullName}</li>
          <li><b>Email:</b> ${email}</li>
          <li><b>Phone:</b> ${phone}</li>
        </ul>
        <p><b>Applicant Message:</b></p>
        <blockquote style="border-left:4px solid #ccc;padding-left:10px;white-space:pre-wrap;">${comments}</blockquote>
        <p><b>Resume:</b> Attached below.</p>
        <br/>
        <p>Best regards,<br/><b>GyanNidhi Careers Portal</b></p>
      `,
      attachments: [{ filename: safeOriginalName, path: resumePath }],
    };

    const applicantMailOptions = {
      from: FROM_EMAIL,
      to: email,
      subject: `✅ Application Received – ${jobTitle || "Untitled Job"} at GyanNidhi`,
      html: `
        <h2>Thank You for Your Application!</h2>
        <p>Hi ${fullName},</p>
        <p>We have successfully received your application for the <b>${jobTitle || "position"}</b>.</p>
        <ul>
          <li><b>Job Title:</b> ${jobTitle || "Not specified"}</li>
          <li><b>Submitted On:</b> ${submittedAt}</li>
        </ul>
        <p>Our HR team will review your application and contact you within 3–5 business days.</p>
        <p>Best regards,<br/><b>GyanNidhi Careers Team</b></p>
        <hr/>
        <p style="font-size:12px;color:#999;">This is an automated email. Please do not reply.</p>
      `,
    };

    // ---- 3) Send emails in parallel ----
    try {
      const [hrInfo, applicantInfo] = await Promise.all([
        transporter.sendMail(hrMailOptions),
        transporter.sendMail(applicantMailOptions),
      ]);
      console.log("✅ HR email sent:", hrInfo.messageId);
      console.log("✅ Applicant confirmation email sent:", applicantInfo.messageId);
    } catch (emailError) {
      console.error("❌ Failed to send email:", emailError?.message);
      // include SMTP response for fast debugging
      if (emailError?.response) console.error("SMTP response:", emailError.response);
      return res.status(500).json({ success: false, message: "Failed to send email. Please try again later." });
    }

    // ---- 4) Clean up file after a short delay ----
    setTimeout(() => {
      try {
        if (resumePath && fs.existsSync(resumePath)) {
          fs.unlinkSync(resumePath);
          console.log("🗑️ Resume file deleted:", resumePath);
        }
      } catch (err) {
        console.error("Error deleting resume file:", err);
      }
    }, 10000);

    return res.status(200).json({
      success: true,
      message: "Application submitted successfully! Check your email for confirmation.",
    });

  } catch (err) {
    console.error("❌ Error in submitJobApplication:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while submitting the application.",
      error: err.message,
    });
  }
};
