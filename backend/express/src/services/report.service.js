import axios from "axios";
import { scrapeAndSyncStudent } from "./puppeteerScraper.service.js";
import { publishEmailJob } from "./rabbitmq/email.producer.js";
import { processWhatsAppReport } from "./whatsapp.service.js";
import prisma from "../config/db.config.js";
import studentService from "./student.service.js";
import userRepository from "../repositories/user.repository.js";

const FASTAPI_BASE_URL = (process.env.FASTAPI_URL || "http://localhost:8000").replace(/\/$/, "");

const fastApi = axios.create({
    baseURL: FASTAPI_BASE_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
});

export const getRemarkByUSN = async (usn, studentData) => {
    if (!usn || !studentData) throw new Error("USN and data are required to fetch remarks");
    
    try {
        const response = await fastApi.post(`/generate-remark`, studentData);
        return response.data;
    } catch (error) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            const err = new Error("AI Analysis service is currently offline. Please try again later.");
            err.code = "SERVICE_UNAVAILABLE";
            err.statusCode = 503;
            throw err;
        }
        throw error;
    }
};

export const triggerScrape = async (usn, dob) => {
    if (!usn || !dob) throw new Error("USN and DOB are required to trigger scrape");
    return scrapeAndSyncStudent(usn, dob);
};

export const notifyRagSync = async () => {
    try {
        fastApi.post(`/api/rag/sync`).catch(() => {});
    } catch (error) {}
};

export const queueEmailReport = async (usn, htmlContent) => {
    const usn_upper = usn.toUpperCase();
    const queued = await publishEmailJob({ usn: usn_upper, htmlContent });
    if (!queued) {
        throw new Error("Failed to queue email report job.");
    }
    return true;
};

export const sendWhatsAppReport = async (usn, htmlContent) => {
    const usn_upper = usn.toUpperCase();
    
    const student = await prisma.student.findUnique({
        where: { usn: usn_upper },
        select: {
            usn: true,
            name: true,
            parents: {
                select: { name: true, relation: true, phone: true, email: true },
            },
        },
    });

    if (!student) {
        const err = new Error("Student not found");
        err.statusCode = 404;
        throw err;
    }

    if (!student.parents || student.parents.length === 0) {
        const err = new Error("No parents found for this student. Cannot send WhatsApp notification.");
        err.statusCode = 400;
        throw err;
    }

    return processWhatsAppReport(usn_upper, student.name, student.parents, htmlContent);
};

export const handleManualReportUpdate = async (usn) => {
    const usn_upper = usn.toUpperCase();
    const student = await studentService.getStudentDashboard(usn_upper);
    
    if (!student) {
        const err = new Error("Student record not found");
        err.statusCode = 404;
        throw err;
    }

    const COOLDOWN_MS = 5 * 60 * 1000;
    const lastSyncStr = student.details?.last_updated;

    if (lastSyncStr) {
        const lastSync = new Date(lastSyncStr).getTime();
        const now = Date.now();
        const diff = now - lastSync;

        if (diff < COOLDOWN_MS) {
            const err = new Error(`Rate limit exceeded. Please wait ${Math.ceil((COOLDOWN_MS - diff) / 60000)}m before updating again.`);
            err.statusCode = 429;
            err.nextAllowedAt = new Date(lastSync + COOLDOWN_MS).toISOString();
            throw err;
        }
    }

    const user = await userRepository.findByUSN(usn_upper);
    if (!user) {
        const err = new Error("User not found");
        err.statusCode = 404;
        throw err;
    }

    await triggerScrape(user.usn, user.dob);
    return studentService.getStudentDashboard(usn_upper);
};
