import { Router } from "express";
import proctorController from "../controllers/proctor.controller.js";
import { verifyProctorAccess } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply proctor verification
router.use(verifyProctorAccess);

// GET /api/notifications/:proctorId
router.get("/:proctorId", proctorController.getNotifications);

export default router;
