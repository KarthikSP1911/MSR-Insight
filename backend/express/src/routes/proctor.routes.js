import { Router } from "express";
import proctorController from "../controllers/proctor.controller.js";

const router = Router();

router.get("/:proctorId/dashboard", proctorController.getDashboard);
router.get("/:proctorId/proctee/:studentId", proctorController.getProctee);

export default router;
