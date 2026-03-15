import { getRemarkByUSN, getStudentReport, triggerScrape } from "../services/report.service.js";
import userRepository from "../repositories/user.repository.js";
import studentService from "../services/studentService.js";

const HARDCODED_USN = "1MS24IS400";

/**
 * Generates an AI remark for a student.
 */
const generateReport = async (req, res, next) => {
    try {
        const usn = req.params.usn || HARDCODED_USN;
        const data = await getRemarkByUSN(usn);
        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                message: error.response.data?.detail || "FastAPI error",
            });
        }
        next(error);
    }
};

/**
 * Main dashboard endpoint:
 *   1. Check PostgreSQL for existing student data
 *   2. If found → return it directly
 *   3. If not found → trigger FastAPI scraper → data auto-syncs to PG → read from PG
 */
const getStudentDashboardReport = async (req, res, next) => {
    try {
        const usn = req.params.usn?.toUpperCase();

        if (!usn) {
            return res.status(400).json({ success: false, message: "USN is required" });
        }

        // === Step 1: Check PostgreSQL for existing data ===
        console.log(`[Dashboard] Checking PostgreSQL for USN: ${usn}`);
        let dashboardData = await studentService.getStudentDashboard(usn);

        if (dashboardData && dashboardData.current_semester.length > 0) {
            // Data exists in PG — return directly
            console.log(`[Dashboard] ✅ Data found in PostgreSQL for ${usn}. Returning cached data.`);
            return res.status(200).json({
                success: true,
                source: "database",
                data: dashboardData,
            });
        }

        // === Step 2: Data not in PostgreSQL — need to scrape ===
        console.log(`[Dashboard] ⚠️ No data in PostgreSQL for ${usn}. Triggering scraper...`);

        // Get the user's DOB from the Prisma users table (needed for scraping)
        const user = await userRepository.findByUSN(usn);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not registered. Please register first.",
            });
        }

        // Trigger FastAPI scraper — this will:
        //   1. Scrape the portal via Selenium
        //   2. Normalize the data
        //   3. Call Express /api/students/sync to store in PostgreSQL
        console.log(`[Dashboard] 🔄 Triggering FastAPI scraper for ${usn} (DOB: ${user.dob})...`);
        await triggerScrape(usn, user.dob);
        console.log(`[Dashboard] ✅ Scraping + sync completed for ${usn}.`);

        // === Step 3: Read the freshly synced data from PostgreSQL ===
        dashboardData = await studentService.getStudentDashboard(usn);

        if (dashboardData) {
            console.log(`[Dashboard] ✅ Fresh data now available in PostgreSQL for ${usn}.`);
            return res.status(200).json({
                success: true,
                source: "scraper",
                data: dashboardData,
            });
        }

        // If somehow the sync didn't populate PG, fall back to FastAPI direct read
        console.log(`[Dashboard] ⚠️ PG still empty after scrape. Falling back to FastAPI direct read.`);
        const fastApiData = await getStudentReport(usn);
        return res.status(200).json({
            success: true,
            source: "fastapi_fallback",
            data: fastApiData,
        });

    } catch (error) {
        console.error(`[Dashboard] ❌ Error for ${req.params.usn}:`, error.message);

        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                message: error.response.data?.detail || "FastAPI error",
            });
        }
        // FastAPI is unreachable
        if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK") {
            return res.status(503).json({
                success: false,
                message: "AI/Scraping service is unavailable. Please try again later.",
            });
        }
        next(error);
    }
};

/**
 * Forces a re-scrape of a student's data and refreshes the PG database.
 */
const triggerReportUpdate = async (req, res, next) => {
    try {
        const requestUsn = req.body.usn?.toUpperCase();

        if (!requestUsn) {
            return res.status(400).json({ success: false, message: "USN is required" });
        }

        const user = await userRepository.findByUSN(requestUsn);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        console.log(`[ReportUpdate] 🔄 Re-scraping data for ${requestUsn}...`);
        await triggerScrape(user.usn, user.dob);
        console.log(`[ReportUpdate] ✅ Scrape + sync completed for ${requestUsn}.`);

        // Read fresh data from PostgreSQL
        const dashboardData = await studentService.getStudentDashboard(requestUsn);

        if (dashboardData) {
            return res.status(200).json({
                success: true,
                message: "Report updated successfully",
                data: dashboardData,
            });
        }

        // Fallback to FastAPI direct read
        const data = await getStudentReport(requestUsn);
        return res.status(200).json({
            success: true,
            message: "Report updated successfully (fallback)",
            data,
        });

    } catch (error) {
        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                message: error.response.data?.detail || "FastAPI error",
            });
        }
        next(error);
    }
};

export { generateReport, getStudentDashboardReport, triggerReportUpdate };