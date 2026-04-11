import { getRemarkByUSN, triggerScrape } from "../services/report.service.js";
import userRepository from "../repositories/user.repository.js";
import studentService from "../services/studentService.js";
import { sendReportToAllParents } from "../services/email.service.js";
import prisma from "../config/db.config.js";

/**
 * Generates an AI remark for a student based on their PostgreSQL JSONB data.
 */
const generateReport = async (req, res, next) => {
    try {
        const usn = req.params.usn?.toUpperCase();
        console.log(`[ReportController] Request for USN: ${usn}`);
        
        if (!usn) return res.status(400).json({ success: false, message: "USN is required" });

        const dashboardData = await studentService.getStudentDashboard(usn);
        if (!dashboardData) {
            console.warn(`[ReportController] Student not found: ${usn}`);
            return res.status(404).json({ success: false, message: "Student record not found in database." });
        }

        // Robustly find the subjects array. 
        // It could be in student.details.subjects OR student.subjects if we change the schema.
        let reportInputData = null;
        
        if (dashboardData.details && Array.isArray(dashboardData.details.subjects)) {
            reportInputData = dashboardData.details;
        } else if (Array.isArray(dashboardData.subjects)) {
            reportInputData = dashboardData;
        } else if (dashboardData.details && dashboardData.details.details && Array.isArray(dashboardData.details.details.subjects)) {
            // Handle double-nested edge case from some scraping versions
            reportInputData = dashboardData.details.details;
        }

        if (reportInputData) {
            // JSONB details omit duplicate identity fields; FastAI expects name/usn on the payload.
            reportInputData = {
                ...reportInputData,
                name: reportInputData.name ?? dashboardData.name,
                usn: reportInputData.usn ?? dashboardData.usn,
            };
        }

        if (!reportInputData || !reportInputData.subjects || reportInputData.subjects.length === 0) {
            console.warn(`[ReportController] No academic data available for ${usn}. Triggering scrape might be needed.`);
            return res.status(400).json({ 
                success: false, 
                message: "This student has no academic records available to generate AI remarks. Please update student data first." 
            });
        }

        console.log(`[ReportController] Calling AI service for ${usn} with ${reportInputData.subjects.length} subjects`);
        
        try {
            const data = await getRemarkByUSN(usn, reportInputData);
            return res.status(200).json({
                success: true,
                data,
            });
        } catch (aiError) {
            console.error(`[ReportController] AI Service Failure for ${usn}:`, aiError.message);
            // If FastAPI is down, we return a 503 Service Unavailable or a descriptive 500
            if (aiError.code === 'ECONNREFUSED' || aiError.code === 'ETIMEDOUT') {
                return res.status(503).json({
                    success: false,
                    message: "AI Analysis service is currently offline. Please try again later.",
                    error: "SERVICE_UNAVAILABLE"
                });
            }
            throw aiError; // Re-throw for general catch block
        }
    } catch (error) {
        console.error(`[ReportController] STACK TRACE for ${req.params.usn}:`);
        console.error(error.stack);
        return res.status(500).json({
            success: false,
            message: "A server-side error occurred while generating the report.",
            error: error.message
        });
    }
};

/**
 * Main dashboard endpoint utilizing PostgreSQL JSONB field.
 */
const getStudentDashboardReport = async (req, res, next) => {
    try {
        const usn = req.params.usn?.toUpperCase();
        if (!usn) return res.status(400).json({ success: false, message: "USN is required" });

        // Check PG first
        let dashboardData = await studentService.getStudentDashboard(usn);
        if (dashboardData && dashboardData.details && Array.isArray(dashboardData.details.subjects) && dashboardData.details.subjects.length > 0) {
            return res.status(200).json({
                success: true,
                source: "database",
                data: dashboardData,
            });
        }

        // Trigger scrape if not found or data is stale/empty
        console.log(`[ReportController] Data missing or empty for ${usn}. Attempting scrape...`);
        const user = await userRepository.findByUSN(usn);
        if (!user) return res.status(404).json({ success: false, message: "Student not registered in our records." });

        try {
            await triggerScrape(usn, user.dob);
            
            // Fetch fresh data
            dashboardData = await studentService.getStudentDashboard(usn);
            if (dashboardData && dashboardData.details) {
                return res.status(200).json({
                    success: true,
                    source: "scraper",
                    data: dashboardData,
                });
            }
        } catch (scrapeError) {
            console.error(`[ReportController] Scrape failed for ${usn}:`, scrapeError.message);
            return res.status(502).json({ 
                success: false, 
                message: "Could not retrieve academic data from the college portal. Please check your credentials.",
                error: scrapeError.message
            });
        }

        return res.status(502).json({ success: false, message: "Data could not be retrieved from the scraper session." });
    } catch (error) {
        console.error(`[ReportController] Dashboard Error for ${req.params.usn}:`, error.message);
        return res.status(500).json({ 
            success: false, 
            message: "Internal server error occurred while fetching dashboard data.",
            error: error.message
        });
    }
};

/**
 * Updates a student's data by triggering a re-scrape.
 */
const triggerReportUpdate = async (req, res, next) => {
    try {
        const usn = req.body.usn?.toUpperCase();
        if (!usn) return res.status(400).json({ success: false, message: "USN is required" });

        const user = await userRepository.findByUSN(usn);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        await triggerScrape(user.usn, user.dob);
        const dashboardData = await studentService.getStudentDashboard(usn);

        return res.status(200).json({
            success: true,
            message: "Report updated",
            data: dashboardData,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Sends the report as PDF to all parents' emails
 */
const sendReportViaEmail = async (req, res, next) => {
    try {
        const { usn, htmlContent } = req.body;

        if (!usn) {
            return res.status(400).json({ success: false, message: "USN is required" });
        }

        if (!htmlContent) {
            return res.status(400).json({ success: false, message: "HTML report content is required" });
        }

        const usn_upper = usn.toUpperCase();

        // Fetch student data
        const student = await prisma.student.findUnique({
            where: { usn: usn_upper },
            select: {
                usn: true,
                name: true,
                email: true,
                parents: {
                    select: {
                        email: true,
                        name: true,
                        relation: true,
                    },
                },
            },
        });

        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        if (!student.parents || student.parents.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No parents found for this student. Cannot send report.",
            });
        }

        // Send report to all parents
        const emailResult = await sendReportToAllParents(
            usn_upper,
            { name: student.name },
            student.parents,
            htmlContent
        );

        return res.status(200).json({
            success: true,
            message: "Report sent successfully to all parents",
            data: emailResult,
        });
    } catch (error) {
        console.error(`[ReportController] Error sending report via email:`, error.message);
        next(error);
    }
};

export { generateReport, getStudentDashboardReport, triggerReportUpdate, sendReportViaEmail };