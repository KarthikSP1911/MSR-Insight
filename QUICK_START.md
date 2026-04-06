# 🚀 Quick Start Guide - Send Report via Email Feature

## 5-Minute Setup

### 1️⃣ Get Resend Credentials (2 min)

```
1. Go to https://resend.com
2. Sign up (free account)
3. Copy your API Key from Dashboard
4. Verify a sender email (default: onboarding@resend.dev, or use your own)
```

### 2️⃣ Update Environment Variables (1 min)

Edit `backend/express/env.local`:

```env
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
```

### 3️⃣ Dependencies Already Installed ✅

```bash
cd backend/express
npm list resend cloudinary puppeteer
# All three packages should be listed
```

### 4️⃣ Verify Database Setup (1 min)

Check your database has:

- ✅ Student table with `usn`, `name`
- ✅ Parent table with `usn` (FK), `email`, `name`, `relation`

Query to check:

```sql
SELECT * FROM parents WHERE usn = 'TEST001';
-- Should return parent records with emails
```

### 5️⃣ Test the Feature (1 min)

1. Start your backend: `npm start`
2. In app: Go to Proctor Dashboard
3. Select a student → Click "Generate Report"
4. Click new "Send Email" button
5. Check parent's email inbox for PDF attachment ✅

---

## 🎯 Expected Behavior

### Button States

- **Normal**: "📧 Send Email" (blue button)
- **Sending**: "📧 Sending..." (disabled, loading)
- **Success**: "✓ Email sent successfully to all parents!" (green notification, 5s)
- **Error**: "⚠️ Error message" (red notification, 5s)

### Email Details

- **From**: Your configured RESEND_FROM_EMAIL
- **To**: All parent emails from Parent table
- **Subject**: "Student Report - {Name} ({USN})"
- **Attachment**: Report\_{USN}.pdf (auto-generated)

---

## 🐛 Troubleshooting

### ❌ "Failed to send email to parents"

**Cause**: Invalid Resend API key  
**Fix**:

1. Copy API key again from https://resend.com/api-keys
2. Update RESEND_API_KEY in env.local
3. Restart backend server

### ❌ "No parents found for this student"

**Cause**: Student has no registered parents  
**Fix**: Add parent records to database:

```sql
INSERT INTO parents (usn, relation, name, phone, email)
VALUES ('TEST001', 'Father', 'John', '9999999999', 'john@email.com');
```

### ❌ Email not arriving in inbox

**Cause**: Check spam/junk folder first  
**Fix**:

1. Check parent email addresses in database
2. Verify sender email is verified in Resend dashboard
3. Check Resend logs at https://resend.com/dashboard

### ❌ Puppeteer error on first use

**Cause**: Normal - Puppeteer downloads Chromium (~200MB)  
**Fix**: Wait for first run to complete, then it's cached

---

## 📊 Success Criteria Checklist

- [ ] Report button appears in Report viewer
- [ ] Button shows loading state when clicked
- [ ] Success message appears after 10-30 seconds
- [ ] Email appears in parent's inbox
- [ ] PDF opens and displays correctly
- [ ] Parent name is personalized in email body
- [ ] Student marks and details are in PDF
- [ ] Download PDF button still works

---

## 🔧 Optional: Cloudinary Setup (for backup storage)

```env
# Add to env.local if you want cloud storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Then uncomment in email.service.js:

```javascript
// Uncomment to enable Cloudinary storage
// const cloudinaryResponse = await uploadPDFToCloudinary(pdfBuffer, cloudinaryPublicId);
```

---

## 📞 What's New?

### Backend

- ✅ New endpoint: `POST /api/report/send-email`
- ✅ New service: `email.service.js` (PDF + Email logic)
- ✅ New dependencies: resend, cloudinary, puppeteer

### Frontend

- ✅ New button: "Send Email" in Report toolbar
- ✅ New handler: `handleSendEmail()` function
- ✅ Notifications: Success/error messages

### No Changes To

- ✅ Database schema (same tables and fields)
- ✅ Download PDF feature (still works)
- ✅ Authentication (uses existing session)
- ✅ Other features (nothing else modified)

---

## 📝 Testing Checklist

| Test                 | Steps          | Expected                      | ✓   |
| -------------------- | -------------- | ----------------------------- | --- |
| Button visible       | Open report    | "Send Email" button shows     |     |
| Loading state        | Click button   | Shows "Sending..." for 10-30s |     |
| Success flow         | Wait for email | Get success notification      |     |
| Email received       | Check inbox    | Find email with PDF           |     |
| PDF quality          | Open PDF       | Report displays correctly     |     |
| Error handling       | No parent data | Shows specific error message  |     |
| Multiple parents     | 2+ parents     | Email sent to all             |     |
| Download still works | Click Download | PDF downloads locally         |     |

---

## 💡 Pro Tips

1. **First send is slower** (Puppeteer downloads ~200MB)
   - Subsequent sends are much faster (cached)

2. **Use test email address first**
   - Create a test parent record with your email
   - Verify it works before sending to real parents

3. **Check Resend dashboard**
   - https://resend.com/dashboard for delivery logs
   - Useful for debugging email issues

4. **Terminal logs show details**
   - Check backend console for error messages
   - Watch `[ReportController]` logs

5. **Session must be valid**
   - User must be logged in as proctor
   - Session expires → user must login again

---

## 🎓 API Reference

### Send Report Email

**Endpoint**: `POST /api/report/send-email`

**Headers Required**:

```
x-session-id: your_session_id
Content-Type: application/json
```

**Request Body**:

```json
{
  "usn": "TEST001",
  "htmlContent": "<div class='report'>...</div>"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Report sent successfully to all parents",
  "data": {
    "studentUSN": "TEST001",
    "studentName": "John Doe",
    "totalParents": 2,
    "successCount": 2,
    "failureCount": 0,
    "results": [...]
  }
}
```

**Error Response** (400/404):

```json
{
  "success": false,
  "message": "Student not found"
}
```

---

## 🎬 End-to-End Flow

```
User navigates to Report
          ↓
Sees new "Send Email" button
          ↓
Clicks button
          ↓
Backend generates PDF from HTML
          ↓
Backend sends PDF via Resend to all parents
          ↓
Frontend shows "✓ Email sent successfully"
          ↓
Parents receive email with PDF attachment
          ↓
Done! ✅
```

---

## ❓ FAQ

**Q: Can I customize the email template?**  
A: Yes! Edit `email.service.js` → `sendReportEmailViaResend()` function

**Q: Can I send to specific parents only?**  
A: Current implementation sends to all. Can be modified in future.

**Q: Does it work without Cloudinary?**  
A: Yes! Cloudinary is optional. Comment out that line.

**Q: How many emails per minute can I send?**  
A: Depends on Resend plan. Free tier: ~5/min. Check https://resend.com/pricing

**Q: Can students send reports?**  
A: Current implementation is for proctors. Can extend if needed.

**Q: Is PDF generation instant?**  
A: First time: 10-15s (Puppeteer setup). Subsequent: 2-3s (cached)

---

## 📚 Documentation Files

1. **IMPLEMENTATION_SUMMARY.md** - Complete implementation details
2. **SENDREPORT_EMAIL_SETUP.md** - Detailed setup guide
3. **This file** - Quick start guide

---

## ✅ Verification Steps

Run these to verify everything is set up:

```bash
# 1. Check dependencies
cd backend/express && npm list resend cloudinary puppeteer

# 2. Check env file has required keys
cat env.local | grep RESEND

# 3. Check file exists
ls -la src/services/email.service.js

# 4. Check routes added
grep "send-email" src/routes/report.routes.js

# 5. Start backend
npm start

# Then in browser: Navigate to Report → Look for "Send Email" button
```

---

## 🎉 You're All Set!

The feature is now ready to use. Follow the **5-Minute Setup** to get started.

**Questions?** Check the FAQ or detailed docs above.

**Ready to test?** Go to your app now:

1. Login as proctor
2. Select a student
3. Generate report
4. Click "Send Email"
5. Check parent's inbox ✅
