import adminRepository from "../repositories/admin.repository.js";
import bcrypt from "bcrypt";

class AdminService {
  async getProctors(academicYear) {
    const proctors = await adminRepository.getProctorsWithStudentCount(academicYear);
    return proctors.map((p) => ({
      proctorId: p.proctor_id,
      name: p.name,
      phone: p.phone,
      email: p.email,
      studentCount: p.student_maps.length,
    }));
  }

  async addOrUpdateProctor(proctorId, password, name, phone, email) {
    const normalizedId = proctorId.toUpperCase();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return adminRepository.upsertProctor(normalizedId, {
      password_hash: hashedPassword,
      name: name || null,
      phone: phone || null,
      email: email || null,
    });
  }

  async removeProctor(proctorId) {
    const normalizedId = proctorId.toUpperCase();
    await adminRepository.deleteProctorMappings(normalizedId);
    await adminRepository.deleteProctor(normalizedId);
  }

  async getProctorStudents(proctorId, academicYear) {
    const normalizedId = proctorId.toUpperCase();
    const proctor = await adminRepository.getProctorStudents(normalizedId, academicYear);

    if (!proctor) return null;

    return {
      proctorId: proctor.proctor_id,
      name: proctor.name,
      students: proctor.student_maps.map((m) => ({
        usn: m.student.usn,
        name: m.student.name,
        dob: m.student.dob,
        academicYear: m.academic_year,
      })),
    };
  }

  async assignStudentToProctor(proctorId, studentData, academicYear) {
    const normalizedProctorId = proctorId.toUpperCase();
    const normalizedUsn = studentData.usn.toUpperCase();

    const proctor = await adminRepository.getProctorById(normalizedProctorId);
    if (!proctor) {
      const err = new Error("Proctor not found");
      err.statusCode = 404;
      throw err;
    }

    await adminRepository.upsertStudent(normalizedUsn, studentData);
    
    return adminRepository.upsertProctorStudentMap(normalizedProctorId, normalizedUsn, academicYear);
  }

  async assignMultipleStudents(proctorId, usns, academicYear) {
    const normalizedProctorId = proctorId.toUpperCase();
    
    const proctor = await adminRepository.getProctorById(normalizedProctorId);
    if (!proctor) {
      const err = new Error("Proctor not found");
      err.statusCode = 404;
      throw err;
    }

    const assignments = [];
    for (const usn of usns) {
      const normalizedUsn = usn.toUpperCase();
      const assignment = await adminRepository.upsertProctorStudentMap(normalizedProctorId, normalizedUsn, academicYear);
      assignments.push(assignment);
    }
    return assignments;
  }

  async removeStudentAssignment(usn, academicYear) {
    const normalizedUsn = usn.toUpperCase();
    await adminRepository.deleteProctorStudentMap(normalizedUsn, academicYear);
  }

  async getUnassignedStudents(academicYear) {
    return adminRepository.getUnassignedStudents(academicYear);
  }

  async getDashboardStats(academicYear) {
    const { totalProctors, totalStudents, assignedCount } = await adminRepository.getCounts(academicYear);
    const unassignedCount = totalStudents - assignedCount;

    return {
      totalProctors,
      totalStudents,
      unassignedCount: Math.max(0, unassignedCount),
    };
  }

  async addParent(usn, relation, name, phone, email) {
    const normalizedUsn = usn.toUpperCase();

    const student = await adminRepository.getStudentByUsn(normalizedUsn);
    if (!student) {
      const err = new Error(`Student with USN ${normalizedUsn} not found in the database. Please add the student first or wait for them to register.`);
      err.statusCode = 404;
      throw err;
    }

    return adminRepository.upsertParent(normalizedUsn, relation.trim(), {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
    });
  }
}

export default new AdminService();
