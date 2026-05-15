import { Router } from "express";
import adminController from "../controllers/admin.controller.js";
import { runWeeklyAttendanceCron } from "../services/weeklyAttendance.service.js";

const router = Router();

// Simple admin authentication middleware
const verifyAdminAccess = (req, res, next) => {
    const adminKey = req.headers['x-admin-key'];
    const expectedKey = process.env.ADMIN_SECRET_KEY || 'admin123';
    
    if (!adminKey || adminKey !== expectedKey) {
        return res.status(403).json({ success: false, message: "Forbidden: Invalid or missing admin key." });
    }
    next();
};

router.use(verifyAdminAccess);

// Proctor management
router.get("/proctors", adminController.listProctors);
router.post("/proctors", adminController.addProctor);
router.delete("/proctors/:proctorId", adminController.removeProctor);

// Proctor-Student management
router.get("/proctors/:proctorId/students", adminController.listProctorStudents);
router.post("/proctors/:proctorId/students", adminController.assignStudent);
router.post("/proctors/:proctorId/students/bulk", adminController.assignMultipleStudents);
router.delete("/proctors/:proctorId/students/:usn", adminController.removeStudent);

// Unassigned students
router.get("/students/unassigned", adminController.listUnassignedStudents);

// Parent management
router.post("/parents", adminController.addParent);

// Stats
router.get("/stats", adminController.getStats);

// --- Manual Cron Trigger (for testing) ---
// POST /api/admin/cron/weekly-attendance
router.post("/cron/weekly-attendance", async (req, res) => {
    try {
        console.log("[Admin] Manual weekly attendance cron triggered.");
        // Run in background — don't block the HTTP response
        runWeeklyAttendanceCron().catch((err) =>
            console.error("[Admin] Manual cron error:", err.message)
        );
        res.json({
            success: true,
            message: "Weekly attendance digest triggered. Emails will be sent in the background.",
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
