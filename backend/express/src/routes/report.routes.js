const express = require("express");
const router = express.Router();
const { generateReport } = require("../controllers/report.controller");

// GET /api/report          → uses hardcoded USN (1MS24IS400)
// GET /api/report/:usn     → uses USN from URL param
router.get("/", generateReport);
router.get("/:usn", generateReport);

module.exports = router;
