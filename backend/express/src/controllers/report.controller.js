import { 
    getRemarkByUSN, 
    triggerScrape, 
    queueEmailReport, 
    sendWhatsAppReport, 
    handleManualReportUpdate 
} from "../services/report.service.js";
import userRepository from "../repositories/user.repository.js";
import studentService from "../services/student.service.js";
import { extractReportInputData } from "../utils/studentDataParser.js";

/**
 * Generates an AI remark for a student based on their PostgreSQL JSONB data.
 */
export const generateReport = async (req, res, next) => {
    try {
        const usn = req.params.usn?.toUpperCase();
        if (!usn) return res.status(400).json({ success: false, message: "USN is required" });

        const dashboardData = await studentService.getStudentDashboard(usn);
        if (!dashboardData) {
            return res.status(404).json({ success: false, message: "Student record not found in database." });
        }

        const reportInputData = extractReportInputData(dashboardData);

        if (!reportInputData || !reportInputData.subjects || reportInputData.subjects.length === 0) {
            return res.status(400).json({
                success: false,
                message: "This student has no academic records available to generate AI remarks. Please update student data first."
            });
        }

        const data = await getRemarkByUSN(usn, reportInputData);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        const status = error.statusCode || 500;
        return res.status(status).json({
            success: false,
            message: error.message || "A server-side error occurred while generating the report.",
            error: error.code || error.message
        });
    }
};

/**
 * Main dashboard endpoint utilizing PostgreSQL JSONB field.
 */
export const getStudentDashboardReport = async (req, res, next) => {
    try {
        const usn = req.params.usn?.toUpperCase();
        if (!usn) return res.status(400).json({ success: false, message: "USN is required" });

        let dashboardData = await studentService.getStudentDashboard(usn);
        if (dashboardData && dashboardData.details && Array.isArray(dashboardData.details.subjects) && dashboardData.details.subjects.length > 0) {
            return res.status(200).json({ success: true, source: "database", data: dashboardData });
        }

        const user = await userRepository.findByUSN(usn);
        if (!user) return res.status(404).json({ success: false, message: "Student not registered in our records." });

        try {
            await triggerScrape(usn, user.dob);
            dashboardData = await studentService.getStudentDashboard(usn);
            if (dashboardData && dashboardData.details) {
                return res.status(200).json({ success: true, source: "scraper", data: dashboardData });
            }
        } catch (scrapeError) {
            return res.status(502).json({
                success: false,
                message: "Could not retrieve academic data from the college portal. Please check your credentials.",
                error: scrapeError.message
            });
        }

        return res.status(502).json({ success: false, message: "Data could not be retrieved from the scraper session." });
    } catch (error) {
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
export const triggerReportUpdate = async (req, res, next) => {
    try {
        const usn = req.body.usn;
        if (!usn) return res.status(400).json({ success: false, message: "USN is required" });

        const dashboardData = await handleManualReportUpdate(usn);

        return res.status(200).json({
            success: true,
            allowed: true,
            message: "Report updated",
            data: dashboardData,
        });
    } catch (error) {
        const status = error.statusCode || 500;
        return res.status(status).json({
            success: false,
            allowed: error.statusCode !== 429,
            message: error.message,
            nextAllowedAt: error.nextAllowedAt
        });
    }
};

/**
 * Sends the report as PDF to all parents' emails asynchronously via RabbitMQ
 */
export const sendReportViaEmail = async (req, res, next) => {
    try {
        const { usn, htmlContent } = req.body;
        if (!usn || !htmlContent) {
            return res.status(400).json({ success: false, message: "USN and HTML report content are required" });
        }

        await queueEmailReport(usn, htmlContent);

        return res.status(202).json({
            success: true,
            message: "Report generation and email dispatch has been queued successfully.",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Prepares and optionally sends the report via WhatsApp to parents
 */
export const sendReportViaWhatsApp = async (req, res, next) => {
    try {
        const { usn, htmlContent } = req.body;
        if (!usn || !htmlContent) {
            return res.status(400).json({ success: false, message: "USN and HTML report content are required" });
        }

        const whatsappResult = await sendWhatsAppReport(usn, htmlContent);

        return res.status(200).json({
            success: true,
            message: whatsappResult.isTwilioConfigured
                ? "Report sent successfully via Twilio WhatsApp API!"
                : "WhatsApp report processed successfully!",
            data: whatsappResult,
        });
    } catch (error) {
        const status = error.statusCode || 500;
        return res.status(status).json({ success: false, message: error.message });
    }
};