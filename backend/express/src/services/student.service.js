import prisma from "../config/db.config.js";

class StudentService {
  /**
   * Reads a student's full data record including the JSONB details field.
   * Standardizes the returned structure for the frontend dashboard.
   * @param {string} usn
   * @returns {Promise<Object|null>} Student record with details
   */
  async getStudentDashboard(usn) {
    const normalizedUsn = usn.toUpperCase();

    const student = await prisma.student.findUnique({
      where: { usn: normalizedUsn },
      select: {
          usn: true,
          name: true,
          dob: true,
          phone: true,
          email: true,
          current_year: true,
          details: true, // The JSONB blob containing subjects, attendance, etc.
      }
    });

    if (!student) {
      return null;
    }

    // Return the combined object so frontend has both top-level and nested data
    return student;
  }

  /**
   * Syncs student data from FastAPI as a single JSON blob into the Student details field.
   * This handles the UPSERT logic directly into PostgreSQL.
   */
  async syncStudents(studentsData) {
    const results = {
      success: [],
      errors: [],
    };

    for (const usn in studentsData) {
      const studentData = studentsData[usn];
      const normalizedUsn = usn.toUpperCase();

      try {
        // JSONB holds only academic payload — usn, name, current_year live on Student columns (no duplicate fields).
        const detailsPayload = {
          cgpa: studentData.cgpa,
          class_details: studentData.class_details,
          last_updated: studentData.last_updated,
          subjects: studentData.subjects,
          exam_history: studentData.exam_history || [],
        };

        await prisma.student.upsert({
          where: { usn: normalizedUsn },
          update: {
            name: studentData.name,
            dob: studentData.dob,
            details: detailsPayload,
            current_year: studentData.current_year || 0,
          },
          create: {
            usn: normalizedUsn,
            name: studentData.name,
            dob: studentData.dob,
            details: detailsPayload,
            current_year: studentData.current_year || 0,
          },
        });
        results.success.push(normalizedUsn);
      } catch (error) {
        console.error(`Error syncing student ${normalizedUsn}:`, error.message);
        results.errors.push({ usn: normalizedUsn, error: error.message });
      }
    }

    return results;
  }
}

const studentService = new StudentService();
export const syncStudents = (data) => studentService.syncStudents(data);
export default studentService;
