import prisma from "../config/db.config.js";

class AdminRepository {
  async getProctorsWithStudentCount(academicYear) {
    return prisma.proctor.findMany({
      include: {
        student_maps: {
          where: { academic_year: academicYear },
        },
      },
    });
  }

  async upsertProctor(proctorId, data) {
    return prisma.proctor.upsert({
      where: { proctor_id: proctorId },
      update: data,
      create: { proctor_id: proctorId, ...data },
    });
  }

  async deleteProctorMappings(proctorId) {
    return prisma.proctorStudentMap.deleteMany({
      where: { proctor_id: proctorId },
    });
  }

  async deleteProctor(proctorId) {
    return prisma.proctor.delete({
      where: { proctor_id: proctorId },
    });
  }

  async getProctorStudents(proctorId, academicYear) {
    return prisma.proctor.findUnique({
      where: { proctor_id: proctorId },
      include: {
        student_maps: {
          where: { academic_year: academicYear },
          include: { student: true },
          orderBy: { student_id: "asc" },
        },
      },
    });
  }

  async getProctorById(proctorId) {
    return prisma.proctor.findUnique({
      where: { proctor_id: proctorId },
    });
  }

  async getStudentByUsn(usn) {
    return prisma.student.findUnique({
      where: { usn },
    });
  }

  async upsertStudent(usn, data) {
    const { name, dob, phone, email, details, current_year } = data;
    return prisma.student.upsert({
      where: { usn },
      update: {
        phone: phone || undefined,
        email: email || undefined,
      },
      create: {
        usn,
        name: name || usn,
        dob,
        phone: phone || null,
        email: email || null,
        current_year: current_year || 1,
        details: details || {},
      },
    });
  }

  async upsertProctorStudentMap(proctorId, usn, academicYear) {
    return prisma.proctorStudentMap.upsert({
      where: {
        student_id_academic_year: {
          student_id: usn,
          academic_year: academicYear,
        },
      },
      update: {
        proctor_id: proctorId,
      },
      create: {
        proctor_id: proctorId,
        student_id: usn,
        academic_year: academicYear,
      },
    });
  }

  async deleteProctorStudentMap(usn, academicYear) {
    return prisma.proctorStudentMap.delete({
      where: {
        student_id_academic_year: {
          student_id: usn,
          academic_year: academicYear,
        },
      },
    });
  }

  async getUnassignedStudents(academicYear) {
    return prisma.student.findMany({
      where: {
        proctor_maps: {
          none: { academic_year: academicYear },
        },
      },
      select: {
        usn: true,
        name: true,
        dob: true,
      },
      orderBy: { usn: "asc" },
    });
  }

  async getCounts(academicYear) {
    const totalProctors = await prisma.proctor.count();
    const totalStudents = await prisma.student.count();
    const assignedCount = await prisma.proctorStudentMap.count({
      where: { academic_year: academicYear },
    });
    return { totalProctors, totalStudents, assignedCount };
  }

  async upsertParent(usn, relation, data) {
    return prisma.parent.upsert({
      where: {
        usn_relation: {
          usn,
          relation: relation,
        },
      },
      update: data,
      create: {
        usn,
        relation,
        ...data
      },
    });
  }
}

export default new AdminRepository();
