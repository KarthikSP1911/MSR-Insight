import axios from "axios";
import { scrapeAndSyncStudent } from "./puppeteerScraper.service.js";

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

const getRemarkByUSN = async (usn, studentData) => {
    if (!usn || !studentData) throw new Error("USN and data are required to fetch remarks");
    
    try {
        console.log(`[ReportService] Posting to FastAPI: ${FASTAPI_BASE_URL}/generate-remark`);
        const response = await fastApi.post(`/generate-remark`, studentData);
        return response.data;
    } catch (error) {
        console.error(`[ReportService] Error fetching remarks for ${usn}:`, error.message);
        if (error.response) {
            console.error(`[ReportService] FastAPI Response Error (${error.response.status}):`, error.response.data);
        } else if (error.request) {
            console.error(`[ReportService] No response from FastAPI at ${FASTAPI_BASE_URL}. Is it running?`);
        }
        throw error;
    }
};

/**
 * Triggers a background scrape locally via Puppeteer.
 * The scraper directly syncs the parsed data into PostgreSQL.
 */
const triggerScrape = async (usn, dob) => {
    if (!usn || !dob) throw new Error("USN and DOB are required to trigger scrape");

    try {
        const data = await scrapeAndSyncStudent(usn, dob);
        return data;
    } catch (error) {
        console.error(`[ReportService] Error triggering scrape for ${usn}:`, error.message);
        throw error;
    }
};

export { getRemarkByUSN, triggerScrape };
