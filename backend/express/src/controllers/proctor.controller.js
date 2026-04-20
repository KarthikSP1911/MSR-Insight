import proctorRepository from "../repositories/proctor.repository.js";
import prisma from "../config/db.config.js";

class ProctorController {
  async getDashboard(req, res, next) {
    try {
      const { proctorId } = req.params;
      const academicYear = req.query.academicYear || "2027";
      const studentMaps = await proctorRepository.getProctees(proctorId, academicYear);

      if (!studentMaps) {
        return res.status(404).json({
          success: false,
          message: "Proctor mapping not found",
        });
      }

      const proctees = studentMaps.map((map) => {
        const student = map.student;

        // 1. Parse details safely (handle string or object)
        let details = student.details;
        if (typeof details === 'string') {
          try { details = JSON.parse(details); } catch (e) { details = {}; }
        }
        details = (details && typeof details === 'object') ? details : {};

        // 2. Unwrap nesting if present (some scrapers wrap inside details.details)
        const innerDetails = (details.details && typeof details.details === 'object')
          ? details.details
          : details;

        const classInfo = innerDetails.class_details || details.class_details || "";
        const semMatch = classInfo.match(/SEM\s*(\d+)/i);
        const secMatch = classInfo.match(/SEC\s*(\w+)/i);

        // 3. Extract subjects array
        const subjects = Array.isArray(innerDetails.subjects)
          ? innerDetails.subjects
          : Array.isArray(innerDetails.current_semester)
            ? innerDetails.current_semester
            : [];

        // DEBUG: log raw data to confirm structure
        console.log(`[Dashboard] ${student.usn} — detail keys: [${Object.keys(innerDetails).join(', ')}]`);
        console.log(`[Dashboard] ${student.usn} — subjects count: ${subjects.length}`);
        if (subjects.length > 0) {
          console.log(`[Dashboard] ${student.usn} — first subject sample:`, JSON.stringify(subjects[0]));
        }

        // 4. Compute lowestAttendance using parseFloat for safety
        const attendanceValues = subjects
          .map(s => {
            const raw = s.attendance ?? s.attendance_details?.percentage ?? null;
            if (raw === null || raw === undefined) return null;
            const val = parseFloat(String(raw).replace('%', '').trim());
            return isNaN(val) ? null : val;
          })
          .filter(v => v !== null);

        const lowestAttendance = attendanceValues.length > 0
          ? Math.min(...attendanceValues)
          : null;

        console.log(`[Dashboard] ${student.usn} — lowestAttendance: ${lowestAttendance}`);

        return {
          usn: student.usn,
          name: student.name || student.usn,
          semester: semMatch ? `Sem ${semMatch[1]}` : `Year ${student.current_year}`,
          section: secMatch ? `Sec ${secMatch[1]}` : "N/A",
          academicYear: map.academic_year,
          lowestAttendance: lowestAttendance,
        };
      });

      return res.status(200).json({
        success: true,
        data: proctees,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProctee(req, res, next) {
    try {
      const { proctorId, studentUsn } = req.params;

      const mapEntry = await proctorRepository.getProcteeByUsn(proctorId, studentUsn);

      if (!mapEntry) {
        return res.status(404).json({
          success: false,
          message: "Student not found under this proctor for the given assignment",
        });
      }

      const student = mapEntry.student;

      return res.status(200).json({
        success: true,
        data: {
          usn: student.usn,
          name: student.name,
          dob: student.dob,
          phone: student.phone,
          email: student.email,
          current_year: student.current_year,
          academic_year: mapEntry.academic_year,
          details: student.details, // Full scraped data from JSONB
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getNotifications(req, res, next) {
    try {
      const { proctorId } = req.params;
      const academicYear = req.query.academicYear || "2027";
      const normalizedProctorId = proctorId.toUpperCase();

      console.log(`[NotificationScan] ── START ─────────────────────────`);
      console.log(`[NotificationScan] Proctor: ${normalizedProctorId} | Year: ${academicYear}`);

      // 1. Fetch all students mapped to this proctor
      const students = await prisma.student.findMany({
        where: {
          proctor_maps: {
            some: {
              proctor_id: normalizedProctorId,
              academic_year: academicYear
            }
          }
        },
        select: { usn: true, name: true, details: true }
      });

      console.log(`[NotificationScan] Students found: ${students.length}`);

      const alertsData = [];

      for (const student of students) {
        // 2. Parse details — handle both object and string (edge case)
        let details = student.details;
        if (typeof details === 'string') {
          try { details = JSON.parse(details); } catch (e) { details = {}; }
        }
        if (!details || typeof details !== 'object') { details = {}; }

        // 3. Unwrap double-nesting if present (some scrapers nest details.details)
        if (details.details && typeof details.details === 'object') {
          details = details.details;
        }

        // 4. Extract the subjects array — log what keys exist for debugging
        const keys = Object.keys(details);
        console.log(`[NotificationScan] ${student.usn} keys: [${keys.join(', ')}]`);

        const subjectsList = Array.isArray(details.subjects)
          ? details.subjects
          : Array.isArray(details.current_semester)
            ? details.current_semester
            : [];

        console.log(`[NotificationScan] ${student.usn} → ${subjectsList.length} subjects`);

        const lowAttendanceSubjects = [];

        for (const subj of subjectsList) {
          // 5. Extract raw attendance from either field
          const raw = subj.attendance ?? subj.attendance_details?.percentage ?? null;
          if (raw === null || raw === undefined) {
            console.log(`[NotificationScan]   SKIP "${subj.name}" — no attendance value`);
            continue;
          }

          const val = Number(String(raw).replace('%', '').trim());
          console.log(`[NotificationScan]   ${student.name} | "${subj.name}" → ${val}%`);

          if (!isNaN(val) && val < 75) {
            lowAttendanceSubjects.push({ name: subj.name, attendance: val });
          }
        }

        if (lowAttendanceSubjects.length > 0) {
          lowAttendanceSubjects.sort((a, b) => a.attendance - b.attendance);
          alertsData.push({
            usn: student.usn,
            student: student.name || student.usn,
            count: lowAttendanceSubjects.length,
            subjects: lowAttendanceSubjects
          });
        }
      }

      if (alertsData.length > 0) {
        alertsData.sort((a, b) => a.subjects[0].attendance - b.subjects[0].attendance);
      }

      console.log(`[NotificationScan] ── RESULT: ${alertsData.length} student alerts ──`);
      console.log(JSON.stringify(alertsData, null, 2));

      // Always return an array — never null/empty object
      return res.status(200).json({ success: true, data: alertsData });
    } catch (error) {
      console.error("[NotificationScan] FATAL ERROR:", error.message);
      return res.status(200).json({ success: true, data: [] }); // safe fallback
    }
  }

  async handleChat(req, res, next) {
    try {
      const { proctorId } = req.params;
      const { message, academicYear = "2027" } = req.body;
      const normalizedProctorId = proctorId.toUpperCase();

      if (!message) {
        return res.status(400).json({ success: false, message: "Message is required." });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ success: false, message: "Gemini API Key is not configured." });
      }

      // 1. Fetch assigned students
      const students = await prisma.student.findMany({
        where: {
          proctor_maps: {
            some: {
              proctor_id: normalizedProctorId,
              academic_year: academicYear
            }
          }
        },
        select: { usn: true, name: true, phone: true, email: true, dob: true, current_year: true, details: true }
      });

      // 2. Build a rich but compact data structure — full info, minimal tokens
      const studentLines = students.map(s => {
        let details = s.details;
        if (typeof details === 'string') {
          try { details = JSON.parse(details); } catch(e) { details = {}; }
        }
        if (details.details && typeof details.details === 'object') details = details.details;

        const subjects = Array.isArray(details.subjects) ? details.subjects :
                         Array.isArray(details.current_semester) ? details.current_semester : [];

        // Encode each subject more clearly for Local SLMs (Small Language Models)
        const subjectData = subjects.map(subj => {
          const att = parseFloat(String(subj.attendance ?? subj.attendance_details?.percentage ?? '').replace('%','').trim());
          const totalMarks = subj.marks ?? '-';
          const a = (subj.assessments || []).reduce((acc, x) => { acc[x.type] = x.obtained_marks ?? '-'; return acc; }, {});
          const shortName = (subj.name || subj.code || '?').slice(0, 22);
          
          return `[Subj: ${shortName} | Att: ${isNaN(att)?'N/A':att}% | TotalMarks: ${totalMarks} | T1=${a.T1??'-'} T2=${a.T2??'-'} AQ1=${a.AQ1??'-'} AQ2=${a.AQ2??'-'}]`;
        }).join('\n    ');

        // Semester-wise CGPA history
        const examHistory = Array.isArray(details.exam_history)
          ? details.exam_history.map(e => `Sem${e.semester||e.sem||'?'}:${e.sgpa||e.cgpa||'N/A'}`).join(', ')
          : 'N/A';

        const cgpa = details.cgpa || 'N/A';
        const classInfo = (details.class_details || '').slice(0, 30);

        return [
          `--- STUDENT RECORD: ${s.name} ---`,
          `  USN: ${s.usn} | Year: ${s.current_year||'N/A'} | Class: ${classInfo}`,
          `  Contact: Phone=${s.phone||'N/A'}, Email=${s.email||'N/A'}`,
          `  Overall CGPA: ${cgpa} | Previous Sems: ${examHistory}`,
          `  Subject Details:`,
          `    ${subjectData}`
        ].join('\n');
      });

      const studentContexttext = studentLines.length > 0
        ? studentLines.join('\n\n')
        : 'No students assigned.';

      // 4. Query-specific prompt — answer ONLY what was asked
      const consolidatedPrompt = `You are "Insight AI", a concise academic assistant for a college proctor.

RULES:
1. NEVER use markdown tables.
2. Use **bold** for student name only. Use "- " for bullet list items.
3. For section headers (CGPA, Attendance, Marks etc), write as "- SectionName:" (ending with colon).
4. ANSWER ONLY WHAT WAS ASKED. Follow these rules precisely:
   - "marks" or "CIE": show ONLY test marks (T1, T2, AQ1, AQ2) per subject.
   - "attendance": show ONLY attendance % per subject.
   - "CGPA": show ONLY CGPA and semester history.
   - "analysis" or "detailed performance": show full breakdown (CGPA, all subjects, marks, attendance, observations).
   - "performing" or "how is" or "tell me about [student]": give a SHORT SUMMARY using 5-6 bullets max:
     * CGPA
     * Average attendance (mention if any subject is below 75%)
     * Best performing subject (highest T1)
     * Any concern (0% attendance or 0 marks subjects)
     * 1-line overall verdict
   - Simple greetings: reply conversationally, no student data.
5. DECLINE general knowledge or non-academic questions.
6. T1, T2 = Internal CIE exam marks (out of 30). AQ1, AQ2 = Assignment marks.

STUDENT RECORDS:
${studentContexttext}

USER MESSAGE: ${message}

YOUR REPLY:`;

      // Importing axios using dynamic import to support ES Modules
      const { default: axios } = await import('axios');
      
      const response = await axios.post(process.env.OLLAMA_API_URL, {
        model: 'gemma4:e2b', // Using the exact tag from your Ollama models list
        prompt: consolidatedPrompt,
        stream: false
      });

      return res.status(200).json({
        success: true,
        data: { text: response.data.response }
      });

    } catch (error) {
      console.error("[Proctor Chat] Error:", error.message);
      return res.status(500).json({ success: false, message: "Failed to generate AI response." });
    }
  }
}

export default new ProctorController();
