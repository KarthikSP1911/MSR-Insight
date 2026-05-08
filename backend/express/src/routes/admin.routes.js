import { Router } from "express";
import adminController from "../controllers/admin.controller.js";

const router = Router();

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

export default router;
