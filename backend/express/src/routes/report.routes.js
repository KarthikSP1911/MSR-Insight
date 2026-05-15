import { Router } from "express";
import { generateReport, getStudentDashboardReport, triggerReportUpdate, sendReportViaEmail, sendReportViaWhatsApp } from "../controllers/report.controller.js";
import { verifyStudentAccess } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/update", verifyStudentAccess, triggerReportUpdate);
router.post("/send-email", verifyStudentAccess, sendReportViaEmail);
router.post("/send-whatsapp", verifyStudentAccess, sendReportViaWhatsApp);
router.get("/student/:usn", verifyStudentAccess, getStudentDashboardReport);
router.get("/:usn", verifyStudentAccess, generateReport);
router.get("/", verifyStudentAccess, generateReport);

export default router;
