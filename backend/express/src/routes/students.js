import express from "express";
import { syncStudents } from "../services/student.service.js";
import { verifyProctorAccess } from "../middlewares/auth.middleware.js";
import logger from '../utils/logger.js';

const router = express.Router();

router.post("/sync", verifyProctorAccess, async (req, res) => {
  try {
    const result = await syncStudents(req.body);
    res.json({ success: true, message: "Students synced", result });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
