import adminService from "../services/admin.service.js";

class AdminController {
  /**
   * GET /api/admin/proctors
   */
  async listProctors(req, res, next) {
    try {
      const academicYear = req.query.academicYear || "2027";
      console.log(`[AdminController] Listing proctors for year: ${academicYear}`);
      
      const result = await adminService.getProctors(academicYear);

      console.log(`[AdminController] Found ${result.length} proctors`);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/proctors
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

      const proctor = await adminService.addOrUpdateProctor(proctorId, password, name, phone, email);

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
      
      await adminService.removeProctor(proctorId);

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

      const data = await adminService.getProctorStudents(proctorId, academicYear);

      if (!data) {
        return res.status(404).json({
          success: false,
          message: "Proctor not found",
        });
      }

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/proctors/:proctorId/students
   */
  async assignStudent(req, res, next) {
    try {
      const { proctorId } = req.params;
      const { usn, dob, academicYear = "2027", name, phone, email } = req.body;

      if (!usn) {
        return res.status(400).json({
          success: false,
          message: "Student USN is required",
        });
      }

      const assignment = await adminService.assignStudentToProctor(proctorId, {
        usn, dob, name, phone, email
      }, academicYear);

      return res.status(200).json({
        success: true,
        message: "Student assigned to proctor successfully",
        data: assignment,
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/admin/proctors/:proctorId/students/bulk
   */
  async assignMultipleStudents(req, res, next) {
    try {
      const { proctorId } = req.params;
      const { usns, academicYear = "2027" } = req.body;

      if (!usns || !Array.isArray(usns) || usns.length === 0) {
        return res.status(400).json({
          success: false,
          message: "A list of USNs is required",
        });
      }

      const assignments = await adminService.assignMultipleStudents(proctorId, usns, academicYear);

      return res.status(200).json({
        success: true,
        message: `${assignments.length} students assigned to proctor successfully`,
        data: assignments,
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  /**
   * DELETE /api/admin/proctors/:proctorId/students/:usn
   */
  async removeStudent(req, res, next) {
    try {
      const { usn } = req.params;
      const academicYear = req.query.academicYear || "2027";

      await adminService.removeStudentAssignment(usn, academicYear);

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
   */
  async listUnassignedStudents(req, res, next) {
    try {
      const academicYear = req.query.academicYear || "2027";
      const students = await adminService.getUnassignedStudents(academicYear);

      return res.status(200).json({ success: true, data: students });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/stats
   */
  async getStats(req, res, next) {
    try {
      const academicYear = req.query.academicYear || "2027";
      const data = await adminService.getDashboardStats(academicYear);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/parents
   */
  async addParent(req, res, next) {
    try {
      const { usn, relation, name, phone, email } = req.body;

      if (!usn || !relation || !name || !phone || !email) {
        return res.status(400).json({
          success: false,
          message: "USN, relation, name, phone, and email are all required",
        });
      }

      const parent = await adminService.addParent(usn, relation, name, phone, email);

      return res.status(201).json({
        success: true,
        message: "Parent details added/updated successfully",
        data: parent,
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return res.status(status).json({ success: false, message: error.message });
    }
  }
}

export default new AdminController();
