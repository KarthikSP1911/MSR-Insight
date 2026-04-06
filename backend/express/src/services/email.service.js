import puppeteer from "puppeteer";
import { Resend } from "resend";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Generate PDF from HTML content using Puppeteer
 * @param {string} htmlContent - HTML content to convert to PDF
 * @param {string} filename - Optional filename for temporary storage
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generatePDFFromHTML = async (
  htmlContent,
  filename = "report.pdf",
) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Set viewport to A4 size for better rendering
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 2,
    });

    // Load the logo as a base64 URI for backend PDF rendering
    const logoPath = path.resolve(
      __dirname,
      "../../../../frontend/public/logo.png",
    );
    let logoDataUri = null;
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoDataUri = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    }

    // Inject print CSS and ensure styles are applied
    let styledHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: white;
              color: #1e293b;
              padding: 20px;
            }

            .pdf-wrapper {
              background: white;
              padding: 20px;
              box-sizing: border-box;
              min-height: 100%;
            }
            
            .a4-sheet {
              background: white;
              width: 794px;
              min-height: 1123px;
              padding: 50px 60px;
              color: #1e293b;
              margin: 0 auto;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
            }

            .sheet-header {
              display: flex;
              align-items: center;
              width: 100%;
              gap: 14px;
              margin-bottom: 10px;
            }

            .college-logo-img {
              height: 75px;
              width: auto;
              object-fit: contain;
              flex-shrink: 0;
              margin-right: 12px;
            }

            .college-info h1 {
              font-size: 1.25rem;
              margin: 0;
              color: #0f172a;
              letter-spacing: 0.02em;
              font-weight: 700;
            }

            .college-info h2 {
              font-size: 0.85rem;
              color: #64748b;
              margin: 1px 0 4px 0;
              font-weight: 500;
            }

            .student-meta {
              font-size: 0.75rem;
              color: #475569;
              font-weight: 500;
              margin: 2px 0;
              letter-spacing: 0.01em;
            }

            .divider {
              border: none;
              border-top: 1.5px solid #e2e8f0;
              margin: 8px 0 12px 0;
            }

            .table-section {
              margin-bottom: 20px;
            }

            .table-section h3 {
              font-size: 0.8rem;
              margin-bottom: 6px;
              color: #334155;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              font-weight: 700;
            }

            .marks-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 8px;
              border: 1px solid #94a3b8;
              font-size: 0.75rem;
            }

            .marks-table th,
            .marks-table td {
              border: 1px solid #94a3b8;
              padding: 5px 10px;
              text-align: left;
            }

            .marks-table th {
              background: #f1f5f9;
              color: #475569;
              font-size: 0.68rem;
              text-transform: uppercase;
              font-weight: 700;
              letter-spacing: 0.04em;
            }

            .marks-table td {
              font-size: 0.78rem;
              color: #334155;
            }

            .grade-badge {
              padding: 2px 7px;
              border-radius: 3px;
              font-weight: 700;
              font-size: 0.65rem;
              letter-spacing: 0.03em;
              display: inline-block;
            }

            .grade-badge.o,
            .grade-badge.aplus,
            .grade-badge.a\\+ {
              background: #dcfce7;
              color: #166534;
            }

            .grade-badge.a {
              background: #f0f9ff;
              color: #0369a1;
            }

            .grade-badge.b\\+ {
              background: #fef9c3;
              color: #854d0e;
            }

            .grade-badge.b {
              background: #fff7ed;
              color: #9a3412;
            }

            .grade-badge.f {
              background: #fef2f2;
              color: #dc2626;
            }

            .remarks-section {
              display: flex;
              flex-direction: column;
              gap: 10px;
              margin-top: 16px;
              margin-bottom: 24px;
            }

            .editable-remarks-container h4 {
              font-size: 0.75rem;
              color: #000000;
              margin-bottom: 4px;
              text-transform: uppercase;
              letter-spacing: 0.04em;
              font-weight: 700;
            }

            .tiptap-editor-container {
              border: 2px solid #334155;
              border-radius: 8px;
              overflow: hidden;
              background: #ffffff;
            }

            .tiptap-content {
              padding: 10px;
              min-height: 80px;
              font-size: 0.85rem;
              line-height: 1.5;
              color: #000000;
            }

            .tiptap-content p {
              color: #000000;
              margin: 0 0 8px 0;
            }

            .tiptap-content p:last-child {
              margin-bottom: 0;
            }

            .tiptap-content ul {
              padding-left: 18px;
              margin-bottom: 8px;
              color: #000000;
            }

            .tiptap-content li {
              color: #000000;
              margin-bottom: 4px;
            }

            .sheet-footer {
              margin-top: 40px;
              display: flex;
              flex-direction: row;
              justify-content: space-between;
              align-items: flex-end;
              padding: 40px 0 0 0;
              width: 100%;
              gap: 10px;
            }

            .footer-meta {
              text-align: center;
              flex: 1;
              font-size: 0.75rem;
              color: #64748b;
            }

            .footer-meta small {
              display: block;
            }

            .signature-area {
              text-align: center;
              flex: 1;
            }

            .signature-line {
              width: 100%;
              max-width: 180px;
              border-top: 1.5px solid #334155;
              margin: 0 auto 8px auto;
            }

            .signature-area p {
              font-size: 0.8rem;
              color: #64748b;
              margin: 0;
            }

            /* Print styles */
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .a4-sheet {
                width: 100%;
                min-height: 100vh;
                margin: 0;
                padding: 20mm;
                box-shadow: none;
                page-break-after: always;
              }
            }
          </style>
        </head>
        <body>
          <div class="pdf-wrapper">
            ${htmlContent}
          </div>
        </body>
      </html>
    `;

    if (logoDataUri) {
      styledHtml = styledHtml.replace(
        /src="\/logo\.png"/g,
        `src="${logoDataUri}"`,
      );
      styledHtml = styledHtml.replace(
        /src='\/logo\.png'/g,
        `src='${logoDataUri}'`,
      );
    }

    await page.setContent(styledHtml, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "15mm",
        right: "15mm",
        bottom: "15mm",
        left: "15mm",
      },
      scale: 1,
    });

    await browser.close();
    return pdfBuffer;
  } catch (error) {
    if (browser) await browser.close();
    throw new Error(`PDF generation failed: ${error.message}`);
  }
};

/**
 * Upload PDF to Cloudinary
 * @param {Buffer} pdfBuffer - PDF buffer
 * @param {string} publicId - Public ID for the resource on Cloudinary
 * @returns {Promise<Object>} Cloudinary upload response
 */
export const uploadPDFToCloudinary = async (pdfBuffer, publicId) => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          public_id: publicId,
          format: "pdf",
          overwrite: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );

      uploadStream.end(pdfBuffer);
    });
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Send email with PDF attachment via Resend
 * @param {string} recipientEmail - Recipient email address
 * @param {string} studentName - Student name for email content
 * @param {string} studentUSN - Student USN for email content
 * @param {Buffer} pdfBuffer - PDF buffer to attach
 * @param {string} parentName - Parent name for personalization
 * @returns {Promise<Object>} Resend response
 */
export const sendReportEmailViaResend = async (
  recipientEmail,
  studentName,
  studentUSN,
  pdfBuffer,
  parentName,
) => {
  try {
    // Convert buffer to base64 for attachment
    const base64PDF = pdfBuffer.toString("base64");

    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: recipientEmail,
      subject: `🎓 Student Report - ${studentName} (${studentUSN})`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #334155;
              margin: 0;
              padding: 0;
              background-color: #f8fafc;
            }
            .email-wrapper {
              width: 100%;
              padding: 40px 0;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .header {
              background-color: #0f172a;
              color: #ffffff;
              padding: 32px 40px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 22px;
              letter-spacing: 1px;
              text-transform: uppercase;
            }
            .header p {
              margin: 8px 0 0;
              font-size: 14px;
              opacity: 0.9;
            }
            .content {
              padding: 40px;
            }
            .greeting {
              font-size: 16px;
              margin-bottom: 24px;
            }
            .highlight {
              color: #0f172a;
              font-weight: 600;
            }
            .info-box {
              background-color: #f1f5f9;
              border-radius: 6px;
              padding: 24px;
              margin: 24px 0;
            }
            
            .info-box table {
              width: 100%;
              border-collapse: collapse;
            }
            .info-box td {
              padding: 10px 0;
              border-bottom: 1px solid #e2e8f0;
              font-size: 14px;
            }
            .info-box tr:last-child td {
              border-bottom: none;
            }
            .info-label {
              font-weight: 600;
              color: #475569;
              text-align: left;
            }
            .info-value {
              text-align: right;
              color: #334155;
            }
            .attachment-card {
              display: flex;
              align-items: center;
              padding: 16px;
              border: 2px dashed #cbd5e1;
              border-radius: 8px;
              background-color: #ffffff;
              text-decoration: none;
              margin-top: 30px;
            }
            .pdf-icon {
              font-size: 32px;
              margin-right: 16px;
            }
            .attachment-details strong {
              display: block;
              color: #0f172a;
              font-size: 14px;
            }
            .attachment-details span {
              font-size: 12px;
              color: #64748b;
            }
            .summary-list {
              margin-top: 32px;
              padding-top: 24px;
              border-top: 1px solid #e2e8f0;
            }
            .summary-list h4 {
              font-size: 15px;
              margin-bottom: 12px;
              color: #0f172a;
            }
            .footer {
              background-color: #f8fafc;
              padding: 32px 40px;
              text-align: center;
              font-size: 12px;
              color: #94a3b8;
            }
            .footer strong {
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              <div class="header">
                <h1>Official Academic Transcript</h1>
                <p>M S Ramaiah Institute of Technology</p>
              </div>

              <div class="content">
                <div class="greeting">
                  <p>Dear <span class="highlight">${parentName}</span>,</p>
                  <p>We are writing to formally share the academic performance evaluation for <strong>${studentName}</strong> for the current term.</p>
                  <p>The institute remains committed to maintaining transparency regarding student progress and fostering a collaborative environment between educators and guardians.</p>
                </div>

                <div class="info-box">
                <h3>Academic Record Details</h3>
                <table>
                  <tr>
                    <td class="info-label">Student Name</td>
                    <td class="info-value">${studentName}</td>
                  </tr>
                  <tr>
                    <td class="info-label">University Seat No (USN)</td>
                    <td class="info-value">${studentUSN}</td>
                  </tr>
                  <tr>
                    <td class="info-label">Issue Date</td>
                    <td class="info-value">
                      ${new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                </table>
              </div>

                <div class="attachment-card">
                  <div class="pdf-icon">📄</div>
                  <div class="attachment-details">
                    <strong>Performance_Report.pdf</strong>
                    <span>Secure PDF Document • ${studentUSN}</span>
                  </div>
                </div>

                <div class="summary-list">
                  <h4>Report Components:</h4>
                  <ul style="font-size: 14px; color: #475569; padding-left: 20px;">
                    <li>Semester GPA and Credit Analysis</li>
                    <li>Course-wise Attendance Statistics</li>
                    <li>Internal Assessment Benchmarking</li>
                    <li>Faculty Proctor Observations</li>
                  </ul>
                </div>

                <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
                  Should you require a formal discussion regarding these results, please contact the Department Office or the assigned Faculty Proctor during campus hours.
                </p>
              </div>

              <div class="footer">
                <p>
                  ✉️ <strong>Smart Report Management System</strong><br>
                  M S Ramaiah Institute of Technology, Bangalore<br>
                  <em>This is an automated institutional notification. Please do not reply directly to this email.</em>
                </p>
                <p style="margin-top: 20px;">
                  &copy; 2026 MSRIT. All Rights Reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `Report_${studentUSN}.pdf`,
          content: base64PDF,
        },
      ],
    });

    return response;
  } catch (error) {
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

/**
 * Send report to all parents of a student
 * @param {string} studentUSN - Student USN
 * @param {Object} studentData - Student data including name
 * @param {Array} parents - Array of parent objects with email, name, relation
 * @param {string} htmlContent - HTML content of the report
 * @returns {Promise<Object>} Results of email sending to all parents
 */
export const sendReportToAllParents = async (
  studentUSN,
  studentData,
  parents,
  htmlContent,
) => {
  try {
    // Generate PDF from HTML
    const pdfBuffer = await generatePDFFromHTML(htmlContent);

    // Upload to Cloudinary (optional but useful for record keeping)
    const cloudinaryPublicId = `reports/${studentUSN}_${Date.now()}`;
    // Uncomment if you want to store on Cloudinary
    const cloudinaryResponse = await uploadPDFToCloudinary(
      pdfBuffer,
      cloudinaryPublicId,
    );

    // Send to all parents
    const emailResults = [];
    for (const parent of parents) {
      try {
        const result = await sendReportEmailViaResend(
          parent.email,
          studentData.name,
          studentUSN,
          pdfBuffer,
          parent.name,
        );
        emailResults.push({
          parentEmail: parent.email,
          parentName: parent.name,
          relation: parent.relation,
          status: "success",
          messageId: result.id,
        });
      } catch (error) {
        emailResults.push({
          parentEmail: parent.email,
          parentName: parent.name,
          relation: parent.relation,
          status: "failed",
          error: error.message,
        });
      }
    }

    return {
      studentUSN,
      studentName: studentData.name,
      totalParents: parents.length,
      successCount: emailResults.filter((r) => r.status === "success").length,
      failureCount: emailResults.filter((r) => r.status === "failed").length,
      results: emailResults,
    };
  } catch (error) {
    throw new Error(`Failed to send report to parents: ${error.message}`);
  }
};
