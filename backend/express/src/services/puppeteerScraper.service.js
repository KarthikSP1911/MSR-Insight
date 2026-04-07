import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';
import https from 'https';
import { syncStudents } from './studentService.js';

// ---- Normalization Logic ----
class DataNormalizer {
    static standardizeAssessmentType(rawName) {
        if (!rawName) return "";
        const name = rawName.toUpperCase().trim();
        
        if (/T\s*1/.test(name) || name === "T1") return "T1";
        if (/T\s*2/.test(name) || name === "T2") return "T2";
        if (/T\s*3/.test(name) || name === "T3") return "T3";
        if (/T\s*4/.test(name) || name === "T4") return "T4";
        
        if (/A\/Q\s*1/.test(name) || /AQ\s*1/.test(name)) return "AQ1";
        if (/A\/Q\s*2/.test(name) || /AQ\s*2/.test(name)) return "AQ2";
        if (/A\/Q\s*3/.test(name) || /AQ\s*3/.test(name)) return "AQ3";
            
        if (name.includes("FINAL") && name.includes("CIE")) {
            return "FINAL CIE";
        }
            
        return "";
    }

    static isValidNumeric(val) {
        if (val === null || val === undefined) return false;
        if (typeof val === 'number') return !isNaN(val);
        if (typeof val === 'string') {
            const cleanVal = val.trim();
            if (cleanVal === "" || cleanVal === "-" || cleanVal === " - ") return false;
            const parsed = parseFloat(cleanVal);
            return !isNaN(parsed);
        }
        return false;
    }

    static normalizeStudentRecord(scrapedRecord) {
        const currentSem = scrapedRecord.current_semester || [];
        const normalizedSubjects = [];

        for (const entry of currentSem) {
            const subjectCode = entry.code || "N/A";
            const subjectName = entry.name || "Unknown Subject";
            
            // Attendance Object
            const attDetails = entry.attendance_details || {};
            const present = parseInt(attDetails.present_classes || 0, 10);
            const absent = parseInt(attDetails.absent_classes || 0, 10);
            const remaining = parseInt(attDetails.still_to_go || 0, 10);
            
            const classesDetails = attDetails.classes || {};
            const presentDates = classesDetails.present_dates || [];
            const absentDates = classesDetails.absent_dates || [];
            
            const total = present + absent;
            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
            
            const attendanceObj = {
                present,
                absent,
                remaining,
                percentage,
                present_dates: presentDates,
                absent_dates: absentDates
            };
            
            // Assessments
            const cieDetails = entry.cie_details || {};
            const rawTests = cieDetails.tests || [];
            const assessments = [];

            for (const t of rawTests) {
                const stdType = this.standardizeAssessmentType(t.test_name || "");
                if (!stdType) continue;
                
                const obtained = t.marks_obtained;
                const classAvg = t.class_average || 0;
                
                if (!this.isValidNumeric(obtained)) continue;
                
                const obtainedVal = parseFloat(obtained);
                const classAvgVal = this.isValidNumeric(classAvg) ? parseFloat(classAvg) : 0.0;
                
                assessments.push({
                    type: stdType,
                    obtained_marks: obtainedVal,
                    class_average: classAvgVal
                });
            }
            
            // Calculate Total Marks
            const getVal = (tType) => {
                const a = assessments.find(x => x.type === tType);
                if (a) {
                    const val = parseFloat(a.obtained_marks);
                    return !isNaN(val) ? val : 0.0;
                }
                return 0.0;
            };

            const valT1 = getVal("T1");
            const valT2 = getVal("T2");
            const valAq1 = getVal("AQ1");
            const valAq2 = getVal("AQ2");

            const testAvg = (valT1 > 0 && valT2 > 0) ? Math.round((valT1 + valT2) / 2) : Math.max(valT1, valT2);
            const totalMarks = testAvg + valAq1 + valAq2;
            
            normalizedSubjects.push({
                code: String(subjectCode),
                name: String(subjectName),
                marks: totalMarks,
                attendance: percentage,
                attendance_details: attendanceObj,
                assessments: assessments
            });
        }

        return {
            usn: scrapedRecord.usn,
            name: scrapedRecord.name,
            class_details: scrapedRecord.class_details,
            cgpa: scrapedRecord.cgpa,
            last_updated: scrapedRecord.last_updated,
            subjects: normalizedSubjects,
            exam_history: scrapedRecord.exam_history || []
        };
    }
}


// ---- Scraping Logic ----
const getCompleteStudentData = async (usn, day, month, year) => {
    let browser;
    try {
        console.log(`[*] Launching Puppeteer for USN: ${usn}...`);
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto("https://parents.msrit.edu/newparents/", { waitUntil: 'load' });

        await page.type('#username', usn);
        await page.select('#dd', `${day} `);
        await page.select('#mm', month);
        await page.select('#yyyy', year);
        
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
            page.evaluate(() => document.querySelector('.cn-login-btn').click())
        ]);

        const currentUrl = page.url();
        const content = await page.content();
        
        if (!currentUrl.toLowerCase().includes("dashboard") && !content.includes("Logout")) {
            throw new Error("Login failed or dashboard not loaded");
        }

        const scrapedData = { dashboard: content, attendance: {}, cie: {} };
        const cookies = await page.cookies();
        
        const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

        // Close browser, switch to light HTTP requests
        await browser.close();
        browser = null;

        console.log("[*] Parsing Dashboard Course Table...");
        const $dash = cheerio.load(content);
        const fetchTasks = [];

        $dash('table[class*="dash_od_row"] tbody tr').each((i, row) => {
            const cols = $dash(row).find('td');
            if (cols.length >= 6) {
                const courseCode = $dash(cols[0]).text().trim();
                
                const attLink = $dash(cols[4]).find('a[href*="task=attendencelist"]').attr('href');
                if (attLink) fetchTasks.push({ url: `https://parents.msrit.edu/newparents/${attLink}`, courseCode, type: 'attendance' });
                
                const cieLink = $dash(cols[5]).find('a[href*="task=ciedetails"]').attr('href');
                if (cieLink) fetchTasks.push({ url: `https://parents.msrit.edu/newparents/${cieLink}`, courseCode, type: 'cie' });
            }
        });

        fetchTasks.push({ url: "https://parents.msrit.edu/newparents/index.php?option=com_history&task=getResult", courseCode: "EXAMS", type: "exams" });

        // HTTP Instance bypassing certs matching python session
        const axiosInstance = axios.create({
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Cookie': cookieString
            },
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });

        const fetchPromises = fetchTasks.map(async task => {
            try {
                // Introduce small delay simulating python random delay 100ms-500ms
                await new Promise(r => setTimeout(r, Math.random() * 400 + 100));
                const resp = await axiosInstance.get(task.url);
                return { ...task, html: resp.data };
            } catch (err) {
                return { ...task, html: "" };
            }
        });

        const results = await Promise.all(fetchPromises);

        for (const res of results) {
            if (res.type === "exams") scrapedData.exams = res.html;
            else if (res.type === "attendance") scrapedData.attendance[res.courseCode] = res.html;
            else if (res.type === "cie") scrapedData.cie[res.courseCode] = res.html;
        }

        return scrapedData;

    } catch (error) {
        console.error(`[X] Automation Error: ${error.message}`);
        return null;
    } finally {
        if (browser) await browser.close();
    }
};

const parseAndProcessData = (scrapedData) => {
    if (!scrapedData) return null;

    const $dash = cheerio.load(scrapedData.dashboard);
    const name = $dash("h3").first().text().trim() || "Unknown";
    const usn = $dash("h2").first().text().trim() || "Unknown";
    const classInfo = $dash("p").first().text().trim() || "";

    const subjectMap = {};
    $dash("tr").each((i, row) => {
        const cols = $dash(row).find("td");
        if (cols.length >= 2) {
            const code = $dash(cols[0]).text().trim();
            if (/^[0-9A-Z]{5,10}$/.test(code)) {
                subjectMap[code] = $dash(cols[1]).text().trim();
            }
        }
    });

    const parseAttendanceHtml = (code) => {
        const details = { present_classes: 0, absent_classes: 0, still_to_go: 0, classes: { present_dates: [], absent_dates: [] } };
        const html = scrapedData.attendance?.[code];
        if (html) {
            const $ = cheerio.load(html);
            const mapping = [["present_classes", "cn-attend"], ["absent_classes", "cn-absent"], ["still_to_go", "cn-still"]];
            mapping.forEach(([key, cls]) => {
                const spanMatch = $(`span[class*="${cls}"]`).text().match(/\[(\d+)\]/);
                if (spanMatch) details[key] = parseInt(spanMatch[1], 10);
            });

            $('table[class*="cn-attend-list1"] tbody tr').each((i, r) => {
                const cols = $(r).find("td");
                if (cols.length >= 2) details.classes.present_dates.push($(cols[1]).text().trim());
            });

            $('table[class*="cn-attend-list2"] tbody tr').each((i, r) => {
                const cols = $(r).find("td");
                if (cols.length >= 2) details.classes.absent_dates.push($(cols[1]).text().trim());
            });
        }
        return details;
    };

    const parseCieHtml = (code) => {
        let tests = [];
        let eligibility = "Unknown";
        const html = scrapedData.cie?.[code];
        
        if (html) {
            const $ = cheerio.load(html);
            const cieTable = $('table[class*="cn-cie-table"]');
            if (cieTable.length) {
                const headers = cieTable.find("thead th").map((i, el) => $(el).text().trim()).get();
                const idx = headers.indexOf("Eligibility");
                if (idx !== -1) {
                    const row = cieTable.find("tbody tr").first();
                    if (row.length && row.find("td").length > idx) {
                        eligibility = $(row.find("td")[idx]).text().trim();
                    }
                }
            }

            const match = html.match(/var\s+chartData\s*=\s*(\[.*?\]);/s);
            if (match) {
                try {
                    const cleanedJson = match[1].replace(/,\s*([}\]])/g, '$1');
                    const parsed = JSON.parse(cleanedJson);
                    tests = parsed.map(i => ({
                        test_name: i.xaxis || "",
                        class_average: i.col1 || 0,
                        max_marks: i.col2 || 0,
                        marks_obtained: i.linevalue || 0
                    }));
                } catch (e) {
                    // Ignore JSON parsing errors
                }
            }
        }
        return { tests, eligibility };
    };

    const currentSemesterData = [];
    for (const [code, sName] of Object.entries(subjectMap)) {
        const att = parseAttendanceHtml(code);
        const { tests: cie, eligibility: elig } = parseCieHtml(code);
        currentSemesterData.push({
            code,
            name: sName,
            eligibility: elig,
            attendance_details: att,
            cie_details: { tests: cie }
        });
    }

    const $exam = cheerio.load(scrapedData.exams || "");
    const cgpaP = $exam("p").filter((i, el) => /\d+\.\d+/.test($exam(el).text())).first();
    const finalCgpa = cgpaP.length ? cgpaP.text().trim() : "N/A";

    const semesterHistory = [];
    $exam("table.res-table").each((i, table) => {
        const cap = $exam(table).find("caption").text().replace(/\s+/g, " ").trim();
        const semName = cap.split("Credits")[0].trim();
        const sgpaMatch = cap.match(/SGPA:\s*(\d+\.\d+)/);
        const creditsMatch = cap.match(/Credits Earned\s*:\s*(\d+)/);
        
        const courses = [];
        $exam(table).find("tbody tr").each((j, r) => {
            const cols = $exam(r).find("td");
            if (cols.length >= 6) {
                courses.push({
                    code: $exam(cols[0]).text().trim(),
                    name: $exam(cols[1]).text().trim(),
                    gpa: $exam(cols[4]).text().trim(),
                    grade: $exam(cols[5]).text().trim()
                });
            }
        });

        semesterHistory.push({
            semester: semName,
            sgpa: sgpaMatch ? sgpaMatch[1] : "N/A",
            credits_earned: creditsMatch ? creditsMatch[1] : "N/A",
            courses
        });
    });

    const studentRecord = {
        name,
        usn,
        class_details: classInfo,
        cgpa: finalCgpa,
        last_updated: new Date().toLocaleString(),
        current_semester: currentSemesterData,
        exam_history: semesterHistory
    };

    const normalized = DataNormalizer.normalizeStudentRecord(studentRecord);
    return normalized;
};

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
        await syncStudents({ [usn]: normalizedData });
        return normalizedData;
    }
    throw new Error("Failed to parse and normalize the scraped data.");
};

export default { scrapeAndSyncStudent };
