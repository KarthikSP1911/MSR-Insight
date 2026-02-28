import { Router } from "express";
import { generateReport, getStudentDashboardReport } from "../controllers/report.controller.js";
import requireSession from "../middlewares/session.middleware.js";

// GET /api/report          → uses hardcoded USN
// GET /api/report/:usn     → uses USN from URL param
// GET /api/report/student/:usn → raw frontend json parsing
const router = Router();

router.get("/", requireSession, generateReport);
router.get("/:usn", requireSession, generateReport);
router.get("/student/:usn", requireSession, getStudentDashboardReport);

export default router;
