# HR Dashboard Setup & Fixes

## Issues Fixed

### 1. ✅ `/api/jobs/:id/publish` returning 404
**Problem:** ManageJobs was calling the wrong endpoint.
**Solution:** Changed from `/api/jobs/:id/publish` → `/api/jobs/:id/status` 
- File: `client/src/pages/ManageJobs.jsx` (line 126)
- Now sends: `{ status: "Open" | "Closed" }` instead of `{ published: boolean }`

### 2. ✅ `/api/apply/submit` returning 500
**Problem:** Email functionality not working.
**Solution:** 
- Added `nodemailer` and `validator` packages (already in package.json)
- Created application controller with email logic
- Added debugging to see what's happening

## Environment Variables Required

Your `.env` in `/server` already has:
```
PORT=5000
MONGO_URI=your-mongodb-uri
GMAIL=pratham@gyannidhi.in
GMAIL_PASSWORD=your-16-digit-app-password
HR_EMAIL=prathamkamidri@gmail.com
ADMIN_EMAIL=admin@gyannidhi.in
```

**Important:** The `GMAIL_PASSWORD` must be a **16-digit app-specific password**, not your main Gmail password.

## How to Test Application Submission

1. **Open Job Details Page** → Fill the form:
   - Full Name
   - Email
   - Phone (10 digits)
   - Comments
   - Upload Resume (PDF/DOC/DOCX)

2. **Click "Submit Application"**

3. **Check the server logs** for:
   ```
   📩 Received body: { fullName, email, phone, comments, jobId, jobTitle }
   📎 Received file: { filename, originalname, size, path, ... }
   🔧 Nodemailer config - GMAIL: ... HR_EMAIL: ...
   ✅ HR email sent: <message-id>
   ✅ Applicant confirmation email sent: <message-id>
   ```

4. **Check your emails:**
   - **HR_EMAIL** (prathamkamidri@gmail.com) receives application with resume
   - **Applicant's email** receives confirmation message

## Files Changed

### Server
- `server/package.json` → Added nodemailer, validator
- `server/config/nodemailer.js` → Created (Gmail transporter)
- `server/controllers/applicationController.js` → Created (email logic)
- `server/routes/applyRoutes.js` → Added `/submit` route with email functionality

### Client
- `client/src/pages/JobDetails.jsx` → Changed endpoint from `/api/apply` → `/api/apply/submit`
- `client/src/pages/ManageJobs.jsx` → Changed endpoint from `/api/jobs/:id/publish` → `/api/jobs/:id/status`

## Troubleshooting

**Issue: Server shows 500 error on `/api/apply/submit`**
1. Check `.env` file has GMAIL and GMAIL_PASSWORD
2. Look at server console for error message
3. Verify Gmail app password (Settings → Security → App passwords)
4. Check `/server/uploads/resumes/` folder exists

**Issue: "Cannot send email"**
- Gmail account may have blocked the attempt
- Check Gmail security settings for "Less secure app access"
- Or regenerate a new app password

**Issue: Resume not uploading**
- File must be: PDF, DOC, or DOCX
- Max file size: 5 MB
- Check folder permissions on `/server/uploads/`

## Next Steps (Optional)

- Store applications in MongoDB (create Applications model)
- Add applicant dashboard to view submitted applications
- Add email template customization
- Add retry logic for failed emails
