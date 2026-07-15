import { syncStudents } from './student.service.js';
import { getCompleteStudentData } from './scraper/puppeteerClient.js';
import { parseAndProcessData } from './scraper/htmlParser.js';

// Helper for parsing DOB "DD-MM-YYYY" or "YYYY-MM-DD"
const parseDobParts = (dobString) => {
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

export const scrapeAndSyncStudent = async (usn, dob) => {
    const { day, month, year } = parseDobParts(dob);
    console.log(`[Scraper] Starting scrape for ${usn} with DOB ${day}-${month}-${year}`);
    
    const scrapedData = await getCompleteStudentData(usn, day, month, year);
    if (!scrapedData) {
        throw new Error(`Failed to scrape data for USN: ${usn}`);
    }

    console.log("[Scraper] Normalizing parsed data...");
    const normalizedData = parseAndProcessData(scrapedData);

    if (normalizedData) {
        console.log(`[Scraper] Syncing ${usn} to database...`);
        normalizedData.dob = dob; // Inject dob for the upsert
        await syncStudents({ [usn]: normalizedData });
        return normalizedData;
    }
    throw new Error("Failed to parse and normalize the scraped data.");
};

export default { scrapeAndSyncStudent };
