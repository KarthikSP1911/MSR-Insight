import prisma from "../config/db.config.js";
import bcrypt from "bcrypt";
import studentService from "../services/studentService.js";

class AdminController {
  /**
   * GET /api/admin/proctors
   * List all proctors with their current student counts
   */
  async listProctors(req, res, next) {
    try {
      const academicYear = req.query.academicYear || "2027";
      console.log(`[AdminController] Listing proctors for year: ${academicYear}`);
      
      const proctors = await prisma.proctor.findMany({
        include: {
          student_maps: {
            where: { academic_year: academicYear },
          },
        },
      });

      const result = proctors.map((p) => ({
        proctorId: p.proctor_id,
        name: p.name,
        phone: p.phone,
        email: p.email,
        studentCount: p.student_maps.length,
      }));

      console.log(`[AdminController] Found ${proctors.length} proctors`);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/proctors
   * Add a new proctor
   */
  async addProctor(req, res, next) {
    try {
      const { proctorId, password, name, phone, email } = req.body;

      if (!proctorId || !password) {
        return res.status(400).json({
          success: false,
          message: "Proctor ID and Password are required",
        });
      }

      const normalizedId = proctorId.toUpperCase();
      const hashedPassword = await bcrypt.hash(password, 10);

      const proctor = await prisma.proctor.upsert({
        where: { proctor_id: normalizedId },
        update: {
          password_hash: hashedPassword,
          name: name || null,
          phone: phone || null,
          email: email || null,
        },
        create: {
          proctor_id: normalizedId,
          password_hash: hashedPassword,
          name: name || null,
          phone: phone || null,
          email: email || null,
        },
      });

      return res.status(201).json({
        success: true,
        message: "Proctor added/updated successfully",
        data: {
          proctorId: proctor.proctor_id,
          name: proctor.name,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/proctors/:proctorId
   */
  async removeProctor(req, res, next) {
    try {
      const { proctorId } = req.params;
      const normalizedId = proctorId.toUpperCase();

      // Delete the mapping first (Prisma cascades should be preferred but manual delete ensures logic)
      await prisma.proctorStudentMap.deleteMany({
        where: { proctor_id: normalizedId },
      });

      await prisma.proctor.delete({
        where: { proctor_id: normalizedId },
      });

      return res.status(200).json({
        success: true,
        message: "Proctor and assignments removed successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/proctors/:proctorId/students
   */
  async listProctorStudents(req, res, next) {
    try {
      const { proctorId } = req.params;
      const academicYear = req.query.academicYear || "2027";
      const normalizedId = proctorId.toUpperCase();

      const proctor = await prisma.proctor.findUnique({
        where: { proctor_id: normalizedId },
        include: {
          student_maps: {
            where: { academic_year: academicYear },
            include: {
              student: true,
            },
            orderBy: { student_id: "asc" },
          },
        },
      });

      if (!proctor) {
        return res.status(404).json({
          success: false,
          message: "Proctor not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          proctorId: proctor.proctor_id,
          name: proctor.name,
          students: proctor.student_maps.map((m) => ({
            usn: m.student.usn,
            name: m.student.name,
            dob: m.student.dob,
            academicYear: m.academic_year,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/proctors/:proctorId/students
   * Assign a student to a proctor
   */
  async assignStudent(req, res, next) {
    try {
      const { proctorId } = req.params;
      const { usn, dob, academicYear = "2027", name } = req.body;

      if (!usn) {
        return res.status(400).json({
          success: false,
          message: "Student USN is required",
        });
      }

      const normalizedProctorId = proctorId.toUpperCase();
      const normalizedUsn = usn.toUpperCase();

      // 1. Verify proctor exists
      const proctor = await prisma.proctor.findUnique({
        where: { proctor_id: normalizedProctorId },
      });

      if (!proctor) {
        return res.status(404).json({
          success: false,
          message: "Proctor not found",
        });
      }

      // 2. Upsert the student record
      const student = await prisma.student.upsert({
        where: { usn: normalizedUsn },
        update: {}, // Maintain details if exists
        create: {
          usn: normalizedUsn,
          name: name || normalizedUsn,
          dob,
          current_year: 1,
          details: {},
        },
      });

      // 3. Upsert the assignment map (unique student_id + academic_year)
      const assignment = await prisma.proctorStudentMap.upsert({
        where: {
          student_id_academic_year: {
            student_id: normalizedUsn,
            academic_year: academicYear,
          },
        },
        update: {
          proctor_id: normalizedProctorId,
        },
        create: {
          proctor_id: normalizedProctorId,
          student_id: normalizedUsn,
          academic_year: academicYear,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Student assigned to proctor successfully",
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/proctors/:proctorId/students/:usn
   */
  async removeStudent(req, res, next) {
    try {
      const { proctorId, usn } = req.params;
      const academicYear = req.query.academicYear || "2027";
      const normalizedProctorId = proctorId.toUpperCase();
      const normalizedUsn = usn.toUpperCase();

      await prisma.proctorStudentMap.delete({
        where: {
          student_id_academic_year: {
            student_id: normalizedUsn,
            academic_year: academicYear,
          },
        },
      });

      return res.status(200).json({
        success: true,
        message: "Student assignment removed successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/students/unassigned
   * List students not assigned to any proctor for a particular year
   */
  async listUnassignedStudents(req, res, next) {
    try {
      const academicYear = req.query.academicYear || "2027";
      const students = await prisma.student.findMany({
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

      return res.status(200).json({ success: true, data: students });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/stats
   * Consolidated stats for the admin dashboard
   */
  async getStats(req, res, next) {
    try {
      const academicYear = req.query.academicYear || "2027";

      const totalProctors = await prisma.proctor.count();
      const totalStudents = await prisma.student.count();
      
      const assignedCount = await prisma.proctorStudentMap.count({
        where: { academic_year: academicYear },
      });

      const unassignedCount = totalStudents - assignedCount;

      return res.status(200).json({
        success: true,
        data: {
          totalProctors,
          totalStudents,
          unassignedCount: Math.max(0, unassignedCount),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
