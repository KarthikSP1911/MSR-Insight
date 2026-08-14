import { Router } from "express";
import { generateReport, getStudentDashboardReport, triggerReportUpdate, sendReportViaEmail, sendReportViaWhatsApp } from "../controllers/report.controller.js";
import { verifyStudentAccess } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  triggerReportUpdateSchema,
  sendReportViaEmailSchema,
  sendReportViaWhatsAppSchema,
} from "../schemas/report.schema.js";

const router = Router();

router.post("/update", verifyStudentAccess, validate(triggerReportUpdateSchema), triggerReportUpdate);
router.post("/send-email", verifyStudentAccess, validate(sendReportViaEmailSchema), sendReportViaEmail);
router.post("/send-whatsapp", verifyStudentAccess, validate(sendReportViaWhatsAppSchema), sendReportViaWhatsApp);
router.get("/student/:usn", verifyStudentAccess, getStudentDashboardReport);
router.get("/:usn", verifyStudentAccess, generateReport);
router.get("/", verifyStudentAccess, generateReport);

export default router;
