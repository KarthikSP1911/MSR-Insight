import { syncStudents } from './student.service.js';
import { getCompleteStudentData } from './scraper/puppeteerClient.js';
import { parseAndProcessData } from './scraper/htmlParser.js';
import logger from '../utils/logger.js';

// Helper for parsing DOB "DD-MM-YYYY" or "YYYY-MM-DD"
const parseDobParts = (dobString) => {
    if (!dobString) {
        throw new Error("Date of Birth is missing or invalid.");
    }
    // If Date object
    if (dobString instanceof Date) {
        return {
            day: String(dobString.getDate()).padStart(2, '0'),
            month: String(dobString.getMonth() + 1).padStart(2, '0'),
            year: String(dobString.getFullYear())
        };
    }
    
    // If string "DD-MM-YYYY" or "YYYY-MM-DD" or similar
    if (typeof dobString === 'string') {
        const parts = dobString.split(/[-/]/);
        if (parts.length === 3) {
            // Check if first part is year YYYY
            if (parts[0].length === 4) {
                return { day: parts[2].padStart(2, '0'), month: parts[1].padStart(2, '0'), year: parts[0] };
            } else {
                // DD-MM-YYYY
                return { day: parts[0].padStart(2, '0'), month: parts[1].padStart(2, '0'), year: parts[2] };
            }
        }
        
        // Try parsing as ISO
        const d = new Date(dobString);
        if (!isNaN(d.valueOf())) {
            return {
                day: String(d.getDate()).padStart(2, '0'),
                month: String(d.getMonth() + 1).padStart(2, '0'),
                year: String(d.getFullYear())
            };
        }
    }
    throw new Error("Invalid DOB format");
};

export const scrapeAndSyncStudent = async (usn, dob, authType, last4Digits) => {
    const { day, month, year } = parseDobParts(dob);
    logger.info(`[Scraper] Starting scrape for ${usn} with DOB ${day}-${month}-${year}`);
    
    const scrapedData = await getCompleteStudentData(usn, day, month, year, authType, last4Digits);
    if (!scrapedData) {
        throw new Error(`Failed to scrape data for USN: ${usn}`);
    }

    logger.info("[Scraper] Normalizing parsed data...");
    const normalizedData = parseAndProcessData(scrapedData);

    if (normalizedData) {
        logger.info(`[Scraper] Syncing ${usn} to database...`);
        normalizedData.dob = dob; // Inject dob for the upsert
        if (authType) normalizedData.auth_type = authType;
        if (last4Digits) normalizedData.last4Digits = last4Digits;
        await syncStudents({ [usn]: normalizedData });
        return normalizedData;
    }
    throw new Error("Failed to parse and normalize the scraped data.");
};

export default { scrapeAndSyncStudent };
