import { Router } from "express";
import proctorController from "../controllers/proctor.controller.js";
import { verifySession } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply session verification
router.use(verifySession);

// GET /api/notifications/:proctorId
router.get("/:proctorId", proctorController.getNotifications);

export default router;
