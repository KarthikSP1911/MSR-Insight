import { Router } from "express";
import { generateReport, getStudentDashboardReport, triggerReportUpdate, sendReportViaEmail } from "../controllers/report.controller.js";
import requireSession from "../middlewares/session.middleware.js";

// GET /api/report          → uses hardcoded USN
// GET /api/report/:usn     → uses USN from URL param
// GET /api/report/student/:usn → raw frontend json parsing
const router = Router();

router.post("/update", requireSession, triggerReportUpdate);
router.post("/send-email", requireSession, sendReportViaEmail);
router.get("/student/:usn", requireSession, getStudentDashboardReport);
router.get("/:usn", requireSession, generateReport);
router.get("/", requireSession, generateReport);

export default router;
