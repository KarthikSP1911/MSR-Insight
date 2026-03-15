import express from "express";
import { syncStudents } from "../services/studentService.js";

const router = express.Router();

router.post("/sync", async (req, res) => {
  try {
    const result = await syncStudents(req.body);
    res.json({ success: true, message: "Students synced", result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
