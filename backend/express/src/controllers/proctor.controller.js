import proctorRepository from "../repositories/proctor.repository.js";

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
        const details = student.details || {};
        const classInfo = details.class_details || "";

        // Parse sem/sec for display from the JSONB blob
        const semMatch = classInfo.match(/SEM\s*(\d+)/i);
        const secMatch = classInfo.match(/SEC\s*(\w+)/i);

        return {
          usn: student.usn,
          name: student.name || student.usn,
          semester: semMatch ? `Sem ${semMatch[1]}` : `Year ${student.current_year}`,
          section: secMatch ? `Sec ${secMatch[1]}` : "N/A",
          academicYear: map.academic_year,
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
}

export default new ProctorController();
