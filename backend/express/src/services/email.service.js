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

    // Inject print CSS and ensure styles are applied
    const styledHtml = `
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
            <meta charset="utf-8">
            <style>
              body {
                font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                background: #f5f5f5;
                margin: 0;
                padding: 0;
              }
              .email-container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                border-radius: 8px;
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #f97316;
                padding-bottom: 20px;
                margin-bottom: 20px;
              }
              .header h1 {
                color: #0f172a;
                margin: 0;
                font-size: 24px;
              }
              .header p {
                color: #64748b;
                margin: 5px 0 0 0;
              }
              .greeting {
                margin: 20px 0;
                color: #1e293b;
              }
              .greeting p {
                margin: 10px 0;
              }
              .info-box {
                background: #f8fafc;
                border-left: 4px solid #f97316;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .info-box h3 {
                color: #0f172a;
                margin: 0 0 10px 0;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                padding: 5px 0;
                font-size: 14px;
                color: #475569;
              }
              .info-label {
                font-weight: 600;
                color: #334155;
              }
              .pdf-attachment {
                text-align: center;
                margin: 30px 0;
                padding: 20px;
                background: #f0f9ff;
                border-radius: 6px;
                border: 2px dashed #0369a1;
              }
              .pdf-icon {
                font-size: 36px;
                margin-bottom: 10px;
              }
              .pdf-text {
                color: #0369a1;
                font-weight: 600;
                font-size: 14px;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                text-align: center;
                color: #64748b;
                font-size: 12px;
              }
              .highlight {
                color: #f97316;
                font-weight: 600;
              }
              .divider {
                height: 1px;
                background: #e2e8f0;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <h1>📊 Academic Performance Report</h1>
                <p>M S Ramaiah Institute of Technology</p>
              </div>

              <div class="greeting">
                <p>Dear <span class="highlight">${parentName}</span>,</p>
                <p>We are pleased to share the latest academic performance report for <strong>${studentName}</strong>.</p>
                <p>Please find the detailed report attached below as a PDF document.</p>
              </div>

              <div class="info-box">
                <h3>📋 Report Details</h3>
                <div class="info-row">
                  <span class="info-label">Student Name:</span>
                  <span>${studentName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">USN:</span>
                  <span>${studentUSN}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Date Generated:</span>
                  <span>${new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}</span>
                </div>
              </div>

              <div class="pdf-attachment">
                <div class="pdf-icon">📄</div>
                <div style="margin-bottom: 10px;">
                  <strong style="color: #0f172a; font-size: 15px;">Complete Report Attached</strong>
                </div>
                <div class="pdf-text">
                  Report_${studentUSN}.pdf
                </div>
              </div>

              <div class="divider"></div>

              <div>
                <p style="font-size: 14px; color: #475569; margin-bottom: 15px;">
                  <strong>What's Included in the Report:</strong>
                </p>
                <ul style="font-size: 14px; color: #475569; margin: 0; padding-left: 20px;">
                  <li>Current semester performance details</li>
                  <li>Subject-wise marks and attendance</li>
                  <li>Grade analysis and CGPA</li>
                  <li>System-generated academic remarks</li>
                  <li>Proctor observations and feedback</li>
                </ul>
              </div>

              <p style="margin-top: 20px; font-size: 14px; color: #475569;">
                If you have any questions regarding this report or need further clarification, please don't hesitate to contact the proctor or the institution.
              </p>

              <div class="footer">
                <p style="margin: 0 0 10px 0;">
                  ✉️ <strong>Smart Report Generator</strong>
                </p>
                <p style="margin: 0;">
                  This is an automated email from the Smart Report Generator system.
                </p>
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
    // const cloudinaryResponse = await uploadPDFToCloudinary(pdfBuffer, cloudinaryPublicId);

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
