import { Router } from "express";
import proctorController from "../controllers/proctor.controller.js";
import { verifySession } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifySession);

router.get("/:proctorId/dashboard", proctorController.getDashboard);
router.get("/:proctorId/student/:studentUsn", proctorController.getProctee);
router.get("/:proctorId/notifications", proctorController.getNotifications);
router.post("/:proctorId/chat", proctorController.handleChat);

export default router;
