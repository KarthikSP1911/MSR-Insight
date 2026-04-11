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

        const classDetails = scrapedRecord.class_details || "";
        const currentYear = DataNormalizer.deriveCurrentYearFromClassDetails(classDetails);

        return {
            usn: scrapedRecord.usn,
            name: scrapedRecord.name,
            class_details: scrapedRecord.class_details,
            cgpa: scrapedRecord.cgpa,
            last_updated: scrapedRecord.last_updated,
            current_year: currentYear,
            subjects: normalizedSubjects,
            exam_history: scrapedRecord.exam_history || []
        };
    }

    /** B.E. programme: year = ceil(semester / 2), e.g. SEM 06 → year 3 */
    static deriveCurrentYearFromClassDetails(classDetails) {
        if (!classDetails || typeof classDetails !== "string") return 0;
        const m = classDetails.match(/\bSEM\s*0*(\d+)\b/i);
        if (!m) return 0;
        const sem = parseInt(m[1], 10);
        if (Number.isNaN(sem) || sem <= 0) return 0;
        return Math.ceil(sem / 2);
    }
}

/**
 * Single source of truth for current-semester courses: same rows that expose
 * attendance / CIE links. Avoids mismatch where generic <tr> scraping found
 * codes but no HTTP fetches ran (all zeros in DB).
 */
const COURSE_CODE_RE = /^[0-9A-Z]{5,14}$/;

const extractCourseRowsFromDashboard = ($dash) => {
    const courses = [];
    const pushRow = ($row) => {
        const cols = $row.find("td");
        if (cols.length < 2) return;
        const rawCode = $dash(cols[0]).text().trim().split(/\s+/)[0];
        const code = rawCode.replace(/[()]/g, "").toUpperCase();
        if (!COURSE_CODE_RE.test(code)) return;
        const name = $dash(cols[1]).text().trim();
        const attLink =
            $row.find('a[href*="task=attendencelist"], a[href*="attendencelist"]').first().attr("href") ||
            "";
        const cieLink =
            $row.find('a[href*="task=ciedetails"], a[href*="ciedetails"]').first().attr("href") || "";
        if (!attLink && !cieLink) return;
        courses.push({ code, name, attLink, cieLink });
    };

    $dash('table[class*="dash_od_row"] tbody tr').each((_, row) => {
        pushRow($dash(row));
    });

    if (courses.length === 0) {
        $dash("table tbody tr").each((_, row) => {
            const $row = $dash(row);
            if (!$row.find('a[href*="attendencelist"], a[href*="ciedetails"]').length) return;
            pushRow($row);
        });
    }

    if (courses.length === 0) {
        $dash("tr").each((_, row) => {
            const $row = $dash(row);
            const cols = $row.find("td");
            if (cols.length < 2) return;
            const rawCode = $dash(cols[0]).text().trim().split(/\s+/)[0];
            const code = rawCode.replace(/[()]/g, "").toUpperCase();
            if (!COURSE_CODE_RE.test(code)) return;
            const name = $dash(cols[1]).text().trim();
            const attLink =
                $row.find('a[href*="task=attendencelist"], a[href*="attendencelist"]').first().attr("href") ||
                "";
            const cieLink =
                $row.find('a[href*="task=ciedetails"], a[href*="ciedetails"]').first().attr("href") || "";
            courses.push({ code, name, attLink, cieLink });
        });
    }

    const seen = new Set();
    return courses.filter((c) => {
        if (seen.has(c.code)) return false;
        seen.add(c.code);
        return true;
    });
};

const resolveParentsUrl = (href) => {
    if (!href || typeof href !== "string") return "";
    const h = href.trim();
    if (h.startsWith("http://") || h.startsWith("https://")) return h;
    if (h.startsWith("/")) return `https://parents.msrit.edu${h}`;
    return `https://parents.msrit.edu/newparents/${h.replace(/^\.\//, "")}`;
};

/** Balanced-bracket extraction for `var chartData = [ ... ];` (CIE marks chart). */
const extractChartDataJsonArray = (html) => {
    if (!html) return null;
    const markers = ["var chartData", "chartData"];
    for (const m of markers) {
        const startIdx = html.indexOf(m);
        if (startIdx === -1) continue;
        const from = html.indexOf("[", startIdx);
        if (from === -1) continue;
        let depth = 0;
        for (let i = from; i < html.length; i++) {
            const c = html[i];
            if (c === "[") depth++;
            else if (c === "]") {
                depth--;
                if (depth === 0) {
                    return html.slice(from, i + 1);
                }
            }
        }
    }
    return null;
};

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

        const courseRows = extractCourseRowsFromDashboard($dash);

        /** One GET per unique URL; map HTML to every (courseCode, type) that needs it — avoids duplicate fetches when att & cie links match. */
        const urlToTargets = new Map();
        const pushTarget = (href, courseCode, type) => {
            const url = resolveParentsUrl(href);
            if (!url) return;
            if (!urlToTargets.has(url)) urlToTargets.set(url, []);
            urlToTargets.get(url).push({ courseCode, type });
        };
        for (const row of courseRows) {
            if (row.attLink) pushTarget(row.attLink, row.code, "attendance");
            if (row.cieLink) pushTarget(row.cieLink, row.code, "cie");
        }

        const examsUrl = "https://parents.msrit.edu/newparents/index.php?option=com_history&task=getResult";
        urlToTargets.set(examsUrl, [{ courseCode: "EXAMS", type: "exams" }]);

        // HTTP Instance bypassing certs matching python session
        const axiosInstance = axios.create({
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Cookie': cookieString
            },
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });

        const uniqueUrls = [...urlToTargets.keys()];
        const fetchPromises = uniqueUrls.map(async (url) => {
            try {
                await new Promise((r) => setTimeout(r, Math.random() * 400 + 100));
                const resp = await axiosInstance.get(url);
                return { url, html: resp.data };
            } catch (err) {
                return { url, html: "" };
            }
        });

        const fetched = await Promise.all(fetchPromises);
        const htmlByUrl = new Map(fetched.map((f) => [f.url, f.html]));

        for (const [url, targets] of urlToTargets) {
            const html = htmlByUrl.get(url) ?? "";
            for (const t of targets) {
                if (t.type === "exams") scrapedData.exams = html;
                else if (t.type === "attendance") scrapedData.attendance[t.courseCode] = html;
                else if (t.type === "cie") scrapedData.cie[t.courseCode] = html;
            }
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

    const courseRows = extractCourseRowsFromDashboard($dash);

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

            // Fallback when class names change: scan visible [n] counts near labels
            const bodyText = $.root().text();
            if (details.present_classes === 0) {
                const pm = bodyText.match(/present[^[]*\[(\d+)\]/i);
                if (pm) details.present_classes = parseInt(pm[1], 10);
            }
            if (details.absent_classes === 0) {
                const am = bodyText.match(/absent[^[]*\[(\d+)\]/i);
                if (am) details.absent_classes = parseInt(am[1], 10);
            }
            if (details.still_to_go === 0) {
                const rm = bodyText.match(/(?:still\s*to\s*go|remaining)[^[]*\[(\d+)\]/i);
                if (rm) details.still_to_go = parseInt(rm[1], 10);
            }

            $('table[class*="cn-attend-list1"] tbody tr, table[class*="attend-list1"] tbody tr').each((i, r) => {
                const cols = $(r).find("td");
                if (cols.length >= 2) details.classes.present_dates.push($(cols[1]).text().trim());
            });

            $('table[class*="cn-attend-list2"] tbody tr, table[class*="attend-list2"] tbody tr').each((i, r) => {
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

            const chartJson = extractChartDataJsonArray(html);
            if (chartJson) {
                try {
                    const cleanedJson = chartJson.replace(/,\s*([}\]])/g, "$1");
                    const parsed = JSON.parse(cleanedJson);
                    tests = parsed.map((i) => ({
                        test_name: i.xaxis || "",
                        class_average: i.col1 || 0,
                        max_marks: i.col2 || 0,
                        marks_obtained: i.linevalue || 0,
                    }));
                } catch (e) {
                    // Ignore JSON parsing errors
                }
            }
        }
        return { tests, eligibility };
    };

    const currentSemesterData = [];
    for (const row of courseRows) {
        const att = parseAttendanceHtml(row.code);
        const { tests: cie, eligibility: elig } = parseCieHtml(row.code);
        currentSemesterData.push({
            code: row.code,
            name: row.name,
            eligibility: elig,
            attendance_details: att,
            cie_details: { tests: cie },
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
