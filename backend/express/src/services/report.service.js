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

/**
 * Fetches AI-generated remarks for a given USN from the FastAPI service.
 * NOW retrieves data from the already synced PG database instead of FastAPI file calls.
 */
const getRemarkByUSN = async (usn, studentData) => {
    if (!usn || !studentData) throw new Error("USN and data are required to fetch remarks");
    
    try {
        const response = await fastApi.post(`/generate-remark`, studentData);
        return response.data;
    } catch (error) {
        console.error(`[ReportService] Error fetching remarks for ${usn}:`, error.message);
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
