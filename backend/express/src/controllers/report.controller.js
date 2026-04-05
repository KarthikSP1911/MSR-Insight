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
        if (!usn) return res.status(400).json({ success: false, message: "USN is required" });

        const dashboardData = await studentService.getStudentDashboard(usn);
        if (!dashboardData) {
            return res.status(404).json({ success: false, message: "No data found in DB to generate remark" });
        }

        // studentService.getStudentDashboard returns { usn, name, details: { subjects, ... }, ... }
        // The AI service expects the object that CONTAINS the 'subjects' array.
        const reportInputData = (dashboardData.details && dashboardData.details.subjects) 
            ? dashboardData.details 
            : dashboardData;

        // Ensure we at least have an empty subjects array if missing, to avoid FastAPI 422/500
        if (!reportInputData.subjects || !Array.isArray(reportInputData.subjects)) {
            return res.status(400).json({ success: false, message: "Student has no academic subjects recorded. Cannot generate remark." });
        }

        const data = await getRemarkByUSN(usn, reportInputData);
        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        console.error(`[ReportController] Error generating report for ${req.params.usn}:`, error.message);
        next(error);
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
        if (dashboardData && dashboardData.details) {
            return res.status(200).json({
                success: true,
                source: "database",
                data: dashboardData,
            });
        }

        // Trigger scrape if not found
        const user = await userRepository.findByUSN(usn);
        if (!user) return res.status(404).json({ success: false, message: "Student not registered" });

        await triggerScrape(usn, user.dob);

        // Fetch fresh data
        dashboardData = await studentService.getStudentDashboard(usn);
        if (dashboardData) {
            return res.status(200).json({
                success: true,
                source: "scraper",
                data: dashboardData,
            });
        }

        return res.status(502).json({ success: false, message: "Data could not be retrieved from scraper" });
    } catch (error) {
        next(error);
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