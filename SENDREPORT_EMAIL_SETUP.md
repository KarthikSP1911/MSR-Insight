# Email Report Feature - Setup and Usage Guide

## Overview
This feature adds the ability to send student reports directly to parents' emails in PDF format. When a proctor clicks the "Send Email" button on a student's report, the system:
1. Generates a PDF from the report HTML
2. Optionally uploads to Cloudinary for backup
3. Sends the PDF to all registered parents via Resend email service

## Prerequisites & Configuration

### 1. Environment Variables (`.env` or `env.local`)

Add these variables to `backend/express/env.local`:

```env
# Email Service - Resend
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=your_sender_email@example.com

# Cloud Storage - Cloudinary (Optional)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 2. Get API Keys

#### Resend
1. Go to https://resend.com
2. Sign up/login to your account
3. Go to API keys section
4. Create a new API key
5. Copy the key to `RESEND_API_KEY`
6. Set `RESEND_FROM_EMAIL` to your verified sender email (e.g., `noreply@yourdomain.com`)

#### Cloudinary (Optional)
1. Go to https://cloudinary.com
2. Sign up/login to your account
3. Go to Dashboard
4. Note your Cloud Name, API Key, and API Secret
5. Add them to env.local

## Dependencies Installed

```json
{
  "resend": "^3.0.0",      // Email service
  "cloudinary": "^1.41.0", // Cloud storage
  "puppeteer": "^22.0.0"   // Server-side PDF generation
}
```

## Frontend Implementation

### Report Component Changes
- Added "Send Email" button next to "Download PDF" button
- New states: `sendingEmail`, `emailSent` for UX feedback
- New function: `handleSendEmail()` - calls backend API

### Button Features
- Shows loading state while sending
- Displays success message for 5 seconds
- Shows error messages if sending fails
- Disabled while sending or loading

## Backend Implementation

### New Endpoint
**POST** `/api/report/send-email`

**Request Body:**
```json
{
  "usn": "string (student USN)",
  "htmlContent": "string (HTML of the report)"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Report sent successfully to all parents",
  "data": {
    "studentUSN": "string",
    "studentName": "string",
    "totalParents": number,
    "successCount": number,
    "failureCount": number,
    "results": [
      {
        "parentEmail": "string",
        "parentName": "string",
        "relation": "string (Father/Mother/Guardian)",
        "status": "success|failed",
        "messageId": "string",
        "error": "string (only if failed)"
      }
    ]
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Error description"
}
```

### Backend Services

#### email.service.js
Three main functions:

1. **generatePDFFromHTML(htmlContent, filename)**
   - Uses Puppeteer for server-side PDF generation
   - Returns: Buffer
   - Settings: A4 format, print background enabled

2. **uploadPDFToCloudinary(pdfBuffer, publicId)**
   - Uploads PDF to Cloudinary
   - Returns: Upload response with URL
   - Optional - can be disabled in sendReportToAllParents()

3. **sendReportToAllParents(studentUSN, studentData, parents, htmlContent)**
   - Orchestrates the entire process
   - Generates PDF → Uploads to Cloudinary → Sends emails
   - Returns: Summary of all emails sent/failed

### Database Schema Used
- **Student**: usn, name, email, details (JSONB)
- **Parent**: usn (FK), email, name, relation, phone
- Relationship: One student → Many parents

## Error Handling

### Common Scenarios

| Error | Cause | Solution |
|-------|-------|----------|
| No parents found | Student has no registered parents | Add parents to the Parent table |
| Email sending failed | Invalid Resend API key | Verify RESEND_API_KEY in env.local |
| PDF generation failed | Chromium not installed | Puppeteer auto-downloads on first use |
| Cloudinary upload failed | Invalid credentials | Verify Cloudinary credentials |
| Session expired | User not authenticated | User needs to login again |

## Email Template

The email includes:
- Professional HTML template
- Student name and USN
- Date generated
- Report PDF as attachment
- Personalized greeting with parent name
- Footer with disclaimer

## Usage Flow

1. **Proctor navigates to student profile**
   - Clicks "Generate Report"

2. **View report page**
   - Review marks, AI remarks, and proctor remarks
   - Choose to Download or Send Email

3. **Click "Send Email" button**
   - Button shows "Sending..."
   - Backend generates PDF
   - Backend sends to all registered parents
   - Success message appears for 5 seconds

4. **Parents receive PDF**
   - Email arrives from configured sender
   - PDF attachment contains full report
   - Personalized with parent's name

## Testing

### Manual Testing Steps

1. **Setup test environment**
   ```bash
   cd backend/express
   npm install  # Already done
   # Verify env.local has all credentials
   ```

2. **Test with Postman/cURL**
   ```bash
   POST http://localhost:5001/api/report/send-email
   Headers: { "x-session-id": "your_session_id", "Content-Type": "application/json" }
   Body: {
     "usn": "TEST001",
     "htmlContent": "<div>Test Report</div>"
   }
   ```

3. **Check parent emails**
   - Verify email arrives at parent email addresses
   - Check PDF attachment is readable

### Troubleshooting

**Email not arriving?**
1. Check RESEND_API_KEY is correct
2. Verify parent email addresses in database
3. Check spam/junk folders
4. Check Resend dashboard for delivery logs

**PDF looks wrong?**
1. Verify htmlContent is valid HTML
2. Check for missing styles (CSS might not render)
3. Try downloading PDF for comparison

**Puppeteer errors?**
1. Allow Puppeteer to download Chromium on first run
2. Check file permissions in temp directory
3. On Linux, may need to install system dependencies

## File Changes Summary

### Backend
- `backend/express/package.json` - Added dependencies
- `backend/express/env.local` - Added email/storage config
- `backend/express/src/services/email.service.js` - NEW
- `backend/express/src/controllers/report.controller.js` - Added sendReportViaEmail()
- `backend/express/src/routes/report.routes.js` - Added POST /send-email route

### Frontend
- `frontend/src/pages/Report.jsx` - Added Send Email button and handler

## Notes

- **No database schema changes** - Uses existing Student and Parent tables
- **No other features modified** - Only additive changes
- **Backward compatible** - Download PDF feature still works
- **Secure** - Uses existing session middleware for authentication
- **Scalable** - Can handle multiple parents per student
- **Auditable** - Returns detailed results of each email send attempt

## Future Enhancements (Optional)

- Custom email templates
- Schedule sending for later
- Email delivery tracking/webhooks
- Bulk send reports for all students
- Different formats (Word, Excel)
- Email retry logic for failures
- Attachment size optimization for large reports
