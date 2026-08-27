import { extractReportInputData } from "./studentDataParser.js";

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);

const getGrade = (score) => {
  if (score >= 90) return "O";
  if (score >= 80) return "A+";
  if (score >= 70) return "A";
  if (score >= 60) return "B+";
  if (score >= 50) return "B";
  return "F";
};

const parseSemester = (classDetails) => {
  if (!classDetails) return "";
  const match = classDetails.match(/SEM\s*(\d+)/i);
  return match ? `Semester ${match[1]}` : classDetails;
};

const parseDept = (classDetails) => {
  if (!classDetails) return "IS";
  const match = classDetails.match(/B\.E-(\w+)/i);
  return match ? match[1] : "IS";
};

/**
 * Builds the same .a4-sheet markup ReportComponent.tsx renders in-browser,
 * but server-side from raw `details` JSONB -- used for batch PDF generation
 * where there is no per-student page render to scrape innerHTML from.
 * Deliberately skips AI/proctor remarks (no live Groq calls for a bulk job)
 * and instead surfaces `details.remarks` verbatim if the proctor already
 * saved one.
 */
export const buildStudentReportHtml = (studentRecord) => {
  const reportData = extractReportInputData(studentRecord) || {};
  const usn = escapeHtml(reportData.usn || studentRecord.usn || "");
  const name = escapeHtml(reportData.name || studentRecord.name || "");
  const classDetails = reportData.class_details || "";
  const cgpa = escapeHtml(reportData.cgpa || "—");
  const lastUpdated = escapeHtml(reportData.last_updated || "—");
  const subjects = Array.isArray(reportData.subjects)
    ? reportData.subjects
    : Array.isArray(reportData.current_semester)
      ? reportData.current_semester
      : [];

  const rows = subjects.length > 0
    ? subjects.map((subject, index) => {
        const score = subject.marks || 0;
        const attendance = Math.round(
          subject.attendance ?? subject.attendance_details?.percentage ?? 0,
        );
        const maxMarks = score > 50 ? 100 : 50;
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(subject.name || "Unknown")}</td>
            <td class="${attendance < 75 ? "low-attendance" : ""}">${attendance}%</td>
            <td>${score} / ${maxMarks} (${getGrade(subject.marks || 0)})</td>
          </tr>`;
      }).join("")
    : `<tr><td colspan="4" style="text-align:center;padding:20px;color:#94a3b8;">No academic data available for the current semester.</td></tr>`;

  const remarks = reportData.remarks
    ? `
      <section class="remarks-section">
        <div class="editable-remarks-container">
          <h4>Proctor Remarks</h4>
          <div class="tiptap-editor-container"><div class="tiptap-content">${reportData.remarks}</div></div>
        </div>
      </section>`
    : "";

  return `
    <div class="a4-sheet">
      <header class="sheet-header">
        <div class="college-logo">
          <img src="/logo.png" alt="MSRIT Logo" class="college-logo-img" />
        </div>
        <div class="college-info">
          <h1>M S RAMAIAH INSTITUTE OF TECHNOLOGY</h1>
          <h2>Academic Performance Report</h2>
          <p class="student-meta">
            USN: ${usn} &nbsp;|&nbsp; ${escapeHtml(parseSemester(classDetails))} &nbsp;|&nbsp; Dept: ${escapeHtml(parseDept(classDetails))} &nbsp;|&nbsp; CGPA: ${cgpa}
          </p>
          <p class="student-meta" style="font-weight:600;">${name}</p>
        </div>
      </header>

      <hr class="divider" />

      <section class="table-section">
        <h3>Current Semester Performance</h3>
        <table class="marks-table">
          <thead>
            <tr>
              <th></th>
              <th>Subject Name</th>
              <th>Attendance (%)</th>
              <th>Score (CIE)</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </section>

      ${remarks}

      <div style="flex-grow:1;"></div>

      <footer class="sheet-footer">
        <div class="signature-area">
          <div class="signature-line"></div>
          <p>Principal Signature</p>
        </div>
        <div class="footer-meta">
          <small>Last Updated: ${lastUpdated}</small>
        </div>
        <div class="signature-area">
          <div class="signature-line"></div>
          <p>Proctor Signature</p>
        </div>
      </footer>
    </div>`;
};
