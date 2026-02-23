import { Router } from "express";
import { generateReport } from "../controllers/report.controller.js";
import requireSession from "../middlewares/session.middleware.js";

// GET /api/report          → uses hardcoded USN
// GET /api/report/:usn     → uses USN from URL param
const router = Router();

router.get("/", requireSession, generateReport);
router.get("/:usn", requireSession, generateReport);

export default router;
