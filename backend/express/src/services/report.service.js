import axios from "axios";

// Sanitize and configure the FastAPI base URL
const FASTAPI_BASE_URL = (process.env.FASTAPI_URL || "http://localhost:8000").replace(/\/$/, "");

// Create an axios instance for FastAPI interactions
const fastApi = axios.create({
    baseURL: FASTAPI_BASE_URL,
    timeout: 15000, // 15 seconds timeout
    headers: {
        "Content-Type": "application/json",
    },
});

/**
 * Fetches AI-generated remarks for a given USN from the FastAPI service.
 * @param {string} usn - The student's USN
 * @returns {Promise<Object>} - { student_detail, ai_remark, meta }
 */
const getRemarkByUSN = async (usn) => {
    if (!usn) throw new Error("USN is required to fetch remarks");
    
    try {
        const response = await fastApi.get(`/generate-remark/${usn}`);
        return response.data;
    } catch (error) {
        console.error(`[ReportService] Error fetching remarks for ${usn}:`, error.message);
        throw error;
    }
};

/**
 * Fetches the raw normalized dashboard data for a student from FastAPI.
 * @param {string} usn - The student's USN
 * @returns {Promise<Object>} - Student data (courses, grades, sgpa, cgpa)
 */
const getStudentReport = async (usn) => {
    if (!usn) throw new Error("USN is required to fetch student report");

    try {
        const response = await fastApi.get(`/api/report/student/${usn}`);
        return response.data?.data;
    } catch (error) {
        console.error(`[ReportService] Error fetching report for ${usn}:`, error.message);
        throw error;
    }
};

/**
 * Triggers a background scrape on FastAPI to refresh the student's data.
 * @param {string} usn - The student's USN
 * @param {string} dob - The student's Date of Birth (YYYY-MM-DD)
 * @returns {Promise<Object>} - The updated student data
 */
const triggerScrape = async (usn, dob) => {
    if (!usn || !dob) throw new Error("USN and DOB are required to trigger scrape");

    try {
        // Selenium scraping can take a long time, so we use a higher timeout override
        const response = await fastApi.post("/api/scrape", {
            usn,
            dob
        }, {
            timeout: 120000 // 120 seconds specifically for scraping
        });
        return response.data?.data;
    } catch (error) {
        console.error(`[ReportService] Error triggering scrape for ${usn}:`, error.message);
        throw error;
    }
};

/**
 * Fetches the normalized report for a student from FastAPI.
 * @param {string} usn - The student's USN
 * @returns {Promise<Object>} - Normalized student data
 */
const getNormalizedReport = async (usn) => {
    if (!usn) throw new Error("USN is required to fetch normalized report");

    try {
        const response = await fastApi.get(`/get-normalized-report/${usn}`);
        return response.data;
    } catch (error) {
        console.error(`[ReportService] Error fetching normalized report for ${usn}:`, error.message);
        throw error;
    }
};

export { getRemarkByUSN, getStudentReport, triggerScrape, getNormalizedReport };
