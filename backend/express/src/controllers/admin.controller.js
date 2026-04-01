import prisma from "../config/db.config.js";
import bcrypt from "bcrypt";

class AdminController {
  /**
   * GET /api/admin/proctors
   * List all proctors with their student counts
   */
  async listProctors(req, res, next) {
    try {
      const proctors = await prisma.proctor.findMany({
        include: {
          students: {
            select: {
              id: true,
              usn: true,
              dob: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const result = proctors.map((p) => ({
        id: p.id,
        proctorId: p.proctorId,
        name: p.name,
        studentCount: p.students.length,
        createdAt: p.createdAt,
      }));

      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/proctors
   * Add a new proctor
   * Body: { proctorId, password, name? }
   */
  async addProctor(req, res, next) {
    try {
      const { proctorId, password, name } = req.body;

      if (!proctorId || !password) {
        return res.status(400).json({
          success: false,
          message: "Proctor ID and Password are required",
        });
      }

      const normalizedId = proctorId.toUpperCase();

      // Check for duplicates
      const existing = await prisma.proctor.findUnique({
        where: { proctorId: normalizedId },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Proctor with this ID already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const proctor = await prisma.proctor.create({
        data: {
          proctorId: normalizedId,
          password: hashedPassword,
          name: name || null,
        },
      });

      return res.status(201).json({
        success: true,
        message: "Proctor added successfully",
        data: {
          id: proctor.id,
          proctorId: proctor.proctorId,
          name: proctor.name,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/proctors/:proctorId
   * Remove a proctor (unlinks all students first)
   */
  async removeProctor(req, res, next) {
    try {
      const { proctorId } = req.params;
      const normalizedId = proctorId.toUpperCase();

      const proctor = await prisma.proctor.findUnique({
        where: { proctorId: normalizedId },
      });

      if (!proctor) {
        return res.status(404).json({
          success: false,
          message: "Proctor not found",
        });
      }

      // Unlink all students from this proctor first
      await prisma.user.updateMany({
        where: { proctorId: proctor.id },
        data: { proctorId: null },
      });

      // Delete the proctor
      await prisma.proctor.delete({
        where: { proctorId: normalizedId },
      });

      return res.status(200).json({
        success: true,
        message: "Proctor removed successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/proctors/:proctorId/students
   * List students assigned to a proctor
   */
  async listProctorStudents(req, res, next) {
    try {
      const { proctorId } = req.params;
      const normalizedId = proctorId.toUpperCase();

      const proctor = await prisma.proctor.findUnique({
        where: { proctorId: normalizedId },
        include: {
          students: {
            select: {
              id: true,
              usn: true,
              dob: true,
              createdAt: true,
            },
            orderBy: { usn: "asc" },
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
          proctorId: proctor.proctorId,
          name: proctor.name,
          students: proctor.students,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/proctors/:proctorId/students
   * Assign a student to a proctor
   * Body: { usn, dob? }
   * If student doesn't exist and dob is provided, auto-creates the student
   */
  async assignStudent(req, res, next) {
    try {
      const { proctorId } = req.params;
      const { usn, dob } = req.body;

      if (!usn) {
        return res.status(400).json({
          success: false,
          message: "Student USN is required",
        });
      }

      const normalizedProctorId = proctorId.toUpperCase();
      const normalizedUsn = usn.toLowerCase();

      // Verify proctor exists
      const proctor = await prisma.proctor.findUnique({
        where: { proctorId: normalizedProctorId },
      });

      if (!proctor) {
        return res.status(404).json({
          success: false,
          message: "Proctor not found",
        });
      }

      // Find or create the student
      let student = await prisma.user.findFirst({
        where: { usn: { equals: normalizedUsn, mode: "insensitive" } },
      });

      if (!student) {
        // Auto-create if dob is provided
        if (!dob) {
          return res.status(404).json({
            success: false,
            message:
              "Student not found. Provide DOB to auto-create the student.",
          });
        }

        student = await prisma.user.create({
          data: {
            usn: normalizedUsn,
            dob,
            proctorId: proctor.id,
          },
        });

        return res.status(201).json({
          success: true,
          message: "Student created and assigned to proctor",
          data: { id: student.id, usn: student.usn },
        });
      }

      // Check if already assigned to this proctor
      if (student.proctorId === proctor.id) {
        return res.status(409).json({
          success: false,
          message: "Student is already assigned to this proctor",
        });
      }

      // Assign student to proctor
      await prisma.user.update({
        where: { id: student.id },
        data: { proctorId: proctor.id },
      });

      return res.status(200).json({
        success: true,
        message: "Student assigned to proctor successfully",
        data: { id: student.id, usn: student.usn },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/proctors/:proctorId/students/:usn
   * Remove a student from a proctor (unlinks, does not delete)
   */
  async removeStudent(req, res, next) {
    try {
      const { proctorId, usn } = req.params;
      const normalizedProctorId = proctorId.toUpperCase();

      const proctor = await prisma.proctor.findUnique({
        where: { proctorId: normalizedProctorId },
      });

      if (!proctor) {
        return res.status(404).json({
          success: false,
          message: "Proctor not found",
        });
      }

      const student = await prisma.user.findFirst({
        where: {
          usn: { equals: usn, mode: "insensitive" },
          proctorId: proctor.id,
        },
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found under this proctor",
        });
      }

      // Unlink student from proctor (set proctorId to null)
      await prisma.user.update({
        where: { id: student.id },
        data: { proctorId: null },
      });

      return res.status(200).json({
        success: true,
        message: "Student removed from proctor",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/students/unassigned
   * List students not assigned to any proctor
   */
  async listUnassignedStudents(req, res, next) {
    try {
      const students = await prisma.user.findMany({
        where: { proctorId: null },
        select: {
          id: true,
          usn: true,
          dob: true,
          createdAt: true,
        },
        orderBy: { usn: "asc" },
      });

      return res.status(200).json({ success: true, data: students });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
