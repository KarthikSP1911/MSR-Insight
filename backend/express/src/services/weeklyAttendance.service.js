import prisma from "../config/db.config.js";
import { generatePDFFromHTML, sendReportEmailViaResend } from "./email.service.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Build an attendance-only HTML report for a student.
 * No system-generated remarks, no proctor observations.
 */
const buildAttendanceReportHTML = (student, logoDataUri) => {
  const details = student.details || {};
  const subjects = details.subjects || details.current_semester || [];
  const classDetails = details.class_details || "";

  // Parse semester and department from class_details string
  const semMatch = classDetails.match(/SEM\s*(\d+)/i);
  const semester = semMatch ? `Semester ${semMatch[1]}` : classDetails;
  const deptMatch = classDetails.match(/B\.E-(\w+)/i);
  const dept = deptMatch ? deptMatch[1] : "—";

  const rows = subjects
    .map(
      (s, idx) => {
        const attendance = Math.round(s.attendance || 0);
        const isLow = attendance < 75;
        return `
          <tr ${isLow ? 'class="low-attendance"' : ""}>
            <td>${idx + 1}</td>
            <td>${s.name || "Unknown Subject"}</td>
            <td style="text-align:center; ${isLow ? "background:#fee2e2; color:#991b1b; font-weight:600;" : ""}">
              ${attendance}%
            </td>
          </tr>`;
      }
    )
    .join("");

  const noDataRow = `
    <tr>
      <td colspan="3" style="text-align:center; padding:20px; color:#94a3b8;">
        No attendance data available for this semester.
      </td>
    </tr>`;

  const now = new Date();
  const weekLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const logoTag = logoDataUri
    ? `<img src="${logoDataUri}" alt="MSRIT Logo" class="college-logo-img" />`
    : "";

  return `
    <div id="report-sheet" class="a4-sheet">
      <header class="sheet-header">
        <div class="college-logo">${logoTag}</div>
        <div class="college-info">
          <h1>M S RAMAIAH INSTITUTE OF TECHNOLOGY</h1>
          <h2>Weekly Attendance Report</h2>
          <p class="student-meta">
            USN: ${student.usn} &nbsp;|&nbsp; ${semester} &nbsp;|&nbsp; Dept: ${dept}
          </p>
          <p class="student-meta" style="font-weight:600;">${student.name || ""}</p>
          <p class="student-meta">Week of: ${weekLabel}</p>
        </div>
      </header>

      <hr class="divider" />

      <section class="table-section">
        <h3>Current Semester — Attendance Summary</h3>
        <table class="marks-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Subject Name</th>
              <th style="text-align:center;">Attendance (%)</th>
            </tr>
          </thead>
          <tbody>
            ${rows.length > 0 ? rows : noDataRow}
          </tbody>
        </table>
        <p style="font-size:0.7rem; color:#64748b; margin-top:8px;">
          * Subjects marked in red have attendance below the 75% threshold.
        </p>
      </section>

      <div style="flex-grow:1;"></div>

      <footer class="sheet-footer">
        <div class="footer-meta">
          <small>Generated: ${new Date().toLocaleString()}</small>
          <small>MSR Insight — Automated Weekly Digest</small>
        </div>
      </footer>
    </div>
  `;
};

/**
 * Load logo as base64 for embedding in Puppeteer-rendered HTML
 */
const getLogoDataUri = () => {
  try {
    const logoPath = path.resolve(
      __dirname,
      "../../../../frontend/public/logo.png"
    );
    if (fs.existsSync(logoPath)) {
      const buffer = fs.readFileSync(logoPath);
      return `data:image/png;base64,${buffer.toString("base64")}`;
    }
  } catch {
    // Logo unavailable — not critical
  }
  return null;
};

/**
 * Send weekly attendance report to all parents of a given student.
 * @param {Object} student - Prisma Student record
 * @param {string} logoDataUri - Base64 logo URI
 * @returns {Object} Send results
 */
const sendWeeklyReportForStudent = async (student, logoDataUri) => {
  const parents = student.parents || [];

  if (parents.length === 0) {
    console.log(
      `[WeeklyCron] No parents found for ${student.usn} — skipping.`
    );
    return { usn: student.usn, skipped: true, reason: "no_parents" };
  }

  const htmlContent = buildAttendanceReportHTML(student, logoDataUri);

  let pdfBuffer;
  try {
    pdfBuffer = await generatePDFFromHTML(
      htmlContent,
      `weekly_${student.usn}.pdf`
    );
  } catch (err) {
    console.error(`[WeeklyCron] PDF generation failed for ${student.usn}:`, err.message);
    return { usn: student.usn, error: err.message };
  }

  const results = [];
  for (const parent of parents) {
    if (!parent.email) continue;
    try {
      await sendWeeklyAttendanceEmail(
        parent.email,
        student.name,
        student.usn,
        pdfBuffer,
        parent.name || "Parent/Guardian"
      );
      results.push({ parentEmail: parent.email, status: "success" });
      console.log(
        `[WeeklyCron] ✓ Sent to ${parent.email} for ${student.usn}`
      );
    } catch (err) {
      results.push({ parentEmail: parent.email, status: "failed", error: err.message });
      console.error(
        `[WeeklyCron] ✗ Failed for ${parent.email} (${student.usn}):`,
        err.message
      );
    }
  }

  return { usn: student.usn, name: student.name, results };
};

/**
 * Weekly attendance-only email template.
 * Clean, minimal — no remarks or proctor notes.
 */
const sendWeeklyAttendanceEmail = async (
  recipientEmail,
  studentName,
  studentUSN,
  pdfBuffer,
  parentName
) => {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const base64PDF = pdfBuffer.toString("base64");
  const weekLabel = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: recipientEmail,
    subject: `📋 Weekly Attendance Update — ${studentName} (${studentUSN})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background: #f8fafc; color: #334155; margin: 0; padding: 0; }
          .wrapper { padding: 40px 0; }
          .container { max-width: 580px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
          .header { background: #0f172a; color: #fff; padding: 28px 36px; }
          .header h1 { margin: 0; font-size: 18px; letter-spacing: 0.5px; }
          .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.75; }
          .content { padding: 32px 36px; }
          .greeting { font-size: 15px; margin-bottom: 20px; line-height: 1.6; }
          .week-badge {
            display: inline-block; background: #f0f9ff; border: 1px solid #bae6fd;
            border-radius: 6px; padding: 8px 16px; font-size: 13px; font-weight: 600;
            color: #0369a1; margin-bottom: 24px;
          }
          .info-box { background: #f8fafc; border-radius: 6px; padding: 20px 24px; margin: 20px 0; font-size: 14px; }
          .info-box table { width: 100%; border-collapse: collapse; }
          .info-box td { padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
          .info-box tr:last-child td { border-bottom: none; }
          .info-label { font-weight: 600; color: #475569; }
          .info-value { text-align: right; color: #1e293b; }
          .attachment { display: flex; align-items: center; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 14px 18px; margin-top: 24px; gap: 14px; }
          .attachment .icon { font-size: 28px; }
          .attachment .meta strong { display: block; font-size: 14px; color: #0f172a; }
          .attachment .meta span { font-size: 12px; color: #64748b; }
          .note { font-size: 13px; color: #64748b; margin-top: 20px; line-height: 1.6; }
          .footer { background: #f8fafc; padding: 24px 36px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <h1>Weekly Attendance Report</h1>
              <p>M S Ramaiah Institute of Technology — MSR Insight</p>
            </div>
            <div class="content">
              <p class="greeting">Dear <strong>${parentName}</strong>,</p>
              <p class="greeting">Please find attached the weekly attendance summary for <strong>${studentName}</strong>. This automated digest is sent every week to keep you informed of your ward's class attendance.</p>

              <div class="week-badge">📅 Week of ${weekLabel}</div>

              <div class="info-box">
                <table>
                  <tr>
                    <td class="info-label">Student Name</td>
                    <td class="info-value">${studentName}</td>
                  </tr>
                  <tr>
                    <td class="info-label">USN</td>
                    <td class="info-value">${studentUSN}</td>
                  </tr>
                  <tr>
                    <td class="info-label">Report Type</td>
                    <td class="info-value">Weekly Attendance Digest</td>
                  </tr>
                </table>
              </div>

              <div class="attachment">
                <div class="icon">📎</div>
                <div class="meta">
                  <strong>Weekly_Attendance_${studentUSN}.pdf</strong>
                  <span>Subject-wise attendance breakdown • Current Semester</span>
                </div>
              </div>

              <p class="note">
                ⚠️ <strong>Note:</strong> Subjects with attendance below <strong>75%</strong> are highlighted in the attached report. Please contact the Department Office if you have any concerns.
              </p>
            </div>
            <div class="footer">
              <p>✉️ <strong>MSR Insight</strong> — Automated Weekly Attendance Digest<br/>
              M S Ramaiah Institute of Technology, Bangalore<br/>
              <em>This is an automated notification. Please do not reply to this email.</em></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: `Weekly_Attendance_${studentUSN}.pdf`,
        content: base64PDF,
      },
    ],
  });
};

/**
 * Main cron job runner — fetches ALL students and sends attendance digests.
 */
export const runWeeklyAttendanceCron = async () => {
  console.log("[WeeklyCron] ▶ Starting weekly attendance digest...");
  const startTime = Date.now();

  const logoDataUri = getLogoDataUri();

  let students;
  try {
    students = await prisma.student.findMany({
      select: {
        usn: true,
        name: true,
        details: true,
        parents: {
          select: {
            name: true,
            email: true,
            relation: true,
            phone: true,
          },
        },
      },
    });
  } catch (err) {
    console.error("[WeeklyCron] ✗ Failed to fetch students from DB:", err.message);
    return;
  }

  console.log(`[WeeklyCron] Processing ${students.length} students...`);

  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;

  for (const student of students) {
    try {
      const result = await sendWeeklyReportForStudent(student, logoDataUri);
      if (result.skipped) {
        skippedCount++;
      } else if (result.error) {
        failureCount++;
      } else {
        const allSent = result.results?.every((r) => r.status === "success");
        allSent ? successCount++ : failureCount++;
      }
    } catch (err) {
      console.error(`[WeeklyCron] Unhandled error for ${student.usn}:`, err.message);
      failureCount++;
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `[WeeklyCron] ✅ Done in ${elapsed}s — Success: ${successCount}, Failed: ${failureCount}, Skipped: ${skippedCount}`
  );
};
