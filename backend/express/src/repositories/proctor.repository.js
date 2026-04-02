import prisma from "../config/db.config.js";

class ProctorRepository {
  async findByProctorId(proctorId) {
    return await prisma.proctor.findUnique({
      where: { proctor_id: proctorId.toUpperCase() },
    });
  }

  async create(data) {
    return await prisma.proctor.create({
      data: {
        ...data,
        proctor_id: data.proctor_id.toUpperCase(),
      },
    });
  }

  async getProctees(proctorId, academicYear = "2027") {
    const normalizedId = proctorId.toUpperCase();
    console.log(`[ProctorRepository] Fetching proctees for ID: ${normalizedId}, Year: ${academicYear}`);
    
    const results = await prisma.proctorStudentMap.findMany({
      where: {
        proctor_id: normalizedId,
        academic_year: academicYear,
      },
      include: {
        student: {
          select: {
            usn: true,
            name: true,
            dob: true,
            current_year: true,
            details: true,
          },
        },
      },
    });

    console.log(`[ProctorRepository] Found ${results.length} students assigned.`);
    if (results.length > 0) {
        console.log(`[ProctorRepository] Sample Mapping:`, results[0].student_id, "->", results[0].academic_year);
    }
    
    return results;
  }

  async getProcteeByUsn(proctorId, usn) {
    const normalizedProctorId = proctorId.toUpperCase();
    const normalizedUsn = usn.toUpperCase();
    return await prisma.proctorStudentMap.findFirst({
      where: {
        student_id: normalizedUsn,
        proctor_id: normalizedProctorId,
      },
      include: {
        student: true,
      },
    });
  }

  async assignStudent(proctorId, usn, academicYear) {
    return await prisma.proctorStudentMap.upsert({
      where: {
        student_id_academic_year: {
          student_id: usn.toUpperCase(),
          academic_year: academicYear,
        },
      },
      update: {
        proctor_id: proctorId.toUpperCase(),
      },
      create: {
        proctor_id: proctorId.toUpperCase(),
        student_id: usn.toUpperCase(),
        academic_year: academicYear,
      },
    });
  }
}

export default new ProctorRepository();
