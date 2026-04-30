import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';
import https from 'https';
import { syncStudents } from '../services/studentService.js';
import { logScrapeMetric } from './metrics.helper.js';

// ---- Config ----
const CDP_HOST = process.env.CDP_HOST || '127.0.0.1';
const CDP_PORT = process.env.CDP_PORT || '9222';
const CDP_ENDPOINT = `http://${CDP_HOST}:${CDP_PORT}`;
const WHITELIST = (process.env.PIGGYBACK_WHITELIST || 'parents.msrit.edu').split(',');


// ---- URL helpers (mirrored from traditional scraper) ----
const resolveParentsUrl = (href) => {
    if (!href || typeof href !== 'string') return '';
    const h = href.trim();
    if (h.startsWith('http://') || h.startsWith('https://')) return h;
    if (h.startsWith('/')) return `https://parents.msrit.edu${h}`;
    return `https://parents.msrit.edu/newparents/${h.replace(/^\.\//, '')}`;
};

const COURSE_CODE_RE = /^[0-9A-Z]{5,14}$/;

const extractCourseRowsFromDashboard = ($dash) => {
    const courses = [];
    const pushRow = ($row) => {
        const cols = $row.find('td');
        if (cols.length < 2) return;
        const rawCode = $dash(cols[0]).text().trim().split(/\s+/)[0];
        const code = rawCode.replace(/[()]/g, '').toUpperCase();
        if (!COURSE_CODE_RE.test(code)) return;
        const name = $dash(cols[1]).text().trim();
        const attLink =
            $row.find('a[href*="task=attendencelist"], a[href*="attendencelist"]').first().attr('href') || '';
        const cieLink =
            $row.find('a[href*="task=ciedetails"], a[href*="ciedetails"]').first().attr('href') || '';
        if (!attLink && !cieLink) return;
        courses.push({ code, name, attLink, cieLink });
    };

    $dash('table[class*="dash_od_row"] tbody tr').each((_, row) => pushRow($dash(row)));

    if (courses.length === 0) {
        $dash('table tbody tr').each((_, row) => {
            const $row = $dash(row);
            if (!$row.find('a[href*="attendencelist"], a[href*="ciedetails"]').length) return;
            pushRow($row);
        });
    }

    if (courses.length === 0) {
        $dash('tr').each((_, row) => {
            const $row = $dash(row);
            const cols = $row.find('td');
            if (cols.length < 2) return;
            const rawCode = $dash(cols[0]).text().trim().split(/\s+/)[0];
            const code = rawCode.replace(/[()]/g, '').toUpperCase();
            if (!COURSE_CODE_RE.test(code)) return;
            const name = $dash(cols[1]).text().trim();
            const attLink =
                $row.find('a[href*="task=attendencelist"], a[href*="attendencelist"]').first().attr('href') || '';
            const cieLink =
                $row.find('a[href*="task=ciedetails"], a[href*="ciedetails"]').first().attr('href') || '';
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

/** Balanced-bracket extraction for `var chartData = [ ... ];` */
const extractChartDataJsonArray = (html) => {
    if (!html) return null;
    const markers = ['var chartData', 'chartData'];
    for (const m of markers) {
        const startIdx = html.indexOf(m);
        if (startIdx === -1) continue;
        const from = html.indexOf('[', startIdx);
        if (from === -1) continue;
        let depth = 0;
        for (let i = from; i < html.length; i++) {
            const c = html[i];
            if (c === '[') depth++;
            else if (c === ']') {
                depth--;
                if (depth === 0) return html.slice(from, i + 1);
            }
        }
    }
    return null;
};

// ---- Normalization (mirrored from DataNormalizer) ----
class DataNormalizer {
    static standardizeAssessmentType(rawName) {
        if (!rawName) return '';
        const name = rawName.toUpperCase().trim();
        if (/T\s*1/.test(name) || name === 'T1') return 'T1';
        if (/T\s*2/.test(name) || name === 'T2') return 'T2';
        if (/T\s*3/.test(name) || name === 'T3') return 'T3';
        if (/T\s*4/.test(name) || name === 'T4') return 'T4';
        if (/A\/Q\s*1/.test(name) || /AQ\s*1/.test(name)) return 'AQ1';
        if (/A\/Q\s*2/.test(name) || /AQ\s*2/.test(name)) return 'AQ2';
        if (/A\/Q\s*3/.test(name) || /AQ\s*3/.test(name)) return 'AQ3';
        if (name.includes('FINAL') && name.includes('CIE')) return 'FINAL CIE';
        return '';
    }

    static isValidNumeric(val) {
        if (val === null || val === undefined) return false;
        if (typeof val === 'number') return !isNaN(val);
        if (typeof val === 'string') {
            const cleanVal = val.trim();
            if (cleanVal === '' || cleanVal === '-' || cleanVal === ' - ') return false;
            return !isNaN(parseFloat(cleanVal));
        }
        return false;
    }

    static deriveCurrentYearFromClassDetails(classDetails) {
        if (!classDetails || typeof classDetails !== 'string') return 0;
        const m = classDetails.match(/\bSEM\s*0*(\d+)\b/i);
        if (!m) return 0;
        const sem = parseInt(m[1], 10);
        if (Number.isNaN(sem) || sem <= 0) return 0;
        return Math.ceil(sem / 2);
    }

    static normalizeStudentRecord(scrapedRecord) {
        const currentSem = scrapedRecord.current_semester || [];
        const normalizedSubjects = [];

        for (const entry of currentSem) {
            const subjectCode = entry.code || 'N/A';
            const subjectName = entry.name || 'Unknown Subject';

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
                present, absent, remaining, percentage,
                present_dates: presentDates, absent_dates: absentDates,
            };

            const cieDetails = entry.cie_details || {};
            const rawTests = cieDetails.tests || [];
            const assessments = [];

            for (const t of rawTests) {
                const stdType = this.standardizeAssessmentType(t.test_name || '');
                if (!stdType) continue;
                const obtained = t.marks_obtained;
                const classAvg = t.class_average || 0;
                if (!this.isValidNumeric(obtained)) continue;
                const obtainedVal = parseFloat(obtained);
                const classAvgVal = this.isValidNumeric(classAvg) ? parseFloat(classAvg) : 0.0;
                assessments.push({ type: stdType, obtained_marks: obtainedVal, class_average: classAvgVal });
            }

            const getVal = (tType) => {
                const a = assessments.find(x => x.type === tType);
                return a ? (isNaN(parseFloat(a.obtained_marks)) ? 0.0 : parseFloat(a.obtained_marks)) : 0.0;
            };

            const valT1 = getVal('T1');
            const valT2 = getVal('T2');
            const valAq1 = getVal('AQ1');
            const valAq2 = getVal('AQ2');
            const testAvg = (valT1 > 0 && valT2 > 0) ? Math.round((valT1 + valT2) / 2) : Math.max(valT1, valT2);
            const totalMarks = testAvg + valAq1 + valAq2;

            normalizedSubjects.push({
                code: String(subjectCode), name: String(subjectName),
                marks: totalMarks, attendance: percentage,
                attendance_details: attendanceObj, assessments,
            });
        }

        const classDetails = scrapedRecord.class_details || '';
        const currentYear = DataNormalizer.deriveCurrentYearFromClassDetails(classDetails);

        return {
            usn: scrapedRecord.usn, name: scrapedRecord.name,
            class_details: scrapedRecord.class_details, cgpa: scrapedRecord.cgpa,
            last_updated: scrapedRecord.last_updated, current_year: currentYear,
            subjects: normalizedSubjects, exam_history: scrapedRecord.exam_history || [],
        };
    }
}

// ============================================================
//  CDP Connection & Scraping
// ============================================================

/**
 * Check if a Chrome instance with CDP is reachable.
 * @returns {Promise<{reachable: boolean, version?: object, error?: string}>}
 */
export const checkCdpAvailability = async () => {
    try {
        const { data } = await axios.get(`${CDP_ENDPOINT}/json/version`, { timeout: 3000 });
        return { reachable: true, version: data };
    } catch (err) {
        return { reachable: false, error: err.message };
    }
};

/**
 * Attach to the running Chrome instance via CDP WebSocket.
 * @returns {Promise<import('puppeteer').Browser>}
 */
const attachToBrowser = async () => {
    const { data } = await axios.get(`${CDP_ENDPOINT}/json/version`, { timeout: 5000 });
    const wsUrl = data.webSocketDebuggerUrl;
    if (!wsUrl) throw new Error('No webSocketDebuggerUrl returned from Chrome CDP endpoint.');

    const browser = await puppeteer.connect({
        browserWSEndpoint: wsUrl,
        defaultViewport: null,
    });
    console.log('[Piggyback] Connected to browser via CDP.');
    return browser;
};

/**
 * Evaluate navigator.webdriver on a page for fingerprint research.
 * Real browsers return false; headless Puppeteer returns true.
 */
const checkWebdriverFlag = async (page) => {
    try {
        return await page.evaluate(() => navigator.webdriver);
    } catch {
        return null;
    }
};

/**
 * URL whitelist check.
 */
const isWhitelisted = (url) => {
    return WHITELIST.some(domain => url.includes(domain));
};

// ---- Parsing helpers (same as traditional scraper) ----

const parseAttendanceHtml = (html) => {
    const details = { present_classes: 0, absent_classes: 0, still_to_go: 0, classes: { present_dates: [], absent_dates: [] } };
    if (!html) return details;
    const $ = cheerio.load(html);
    const mapping = [['present_classes', 'cn-attend'], ['absent_classes', 'cn-absent'], ['still_to_go', 'cn-still']];
    mapping.forEach(([key, cls]) => {
        const spanMatch = $(`span[class*="${cls}"]`).text().match(/\[(\d+)\]/);
        if (spanMatch) details[key] = parseInt(spanMatch[1], 10);
    });

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

    $('table[class*="cn-attend-list1"] tbody tr, table[class*="attend-list1"] tbody tr').each((_, r) => {
        const cols = $(r).find('td');
        if (cols.length >= 2) details.classes.present_dates.push($(cols[1]).text().trim());
    });
    $('table[class*="cn-attend-list2"] tbody tr, table[class*="attend-list2"] tbody tr').each((_, r) => {
        const cols = $(r).find('td');
        if (cols.length >= 2) details.classes.absent_dates.push($(cols[1]).text().trim());
    });
    return details;
};

const parseCieHtml = (html) => {
    let tests = [];
    let eligibility = 'Unknown';
    if (!html) return { tests, eligibility };

    const $ = cheerio.load(html);
    const cieTable = $('table[class*="cn-cie-table"]');
    if (cieTable.length) {
        const headers = cieTable.find('thead th').map((_, el) => $(el).text().trim()).get();
        const idx = headers.indexOf('Eligibility');
        if (idx !== -1) {
            const row = cieTable.find('tbody tr').first();
            if (row.length && row.find('td').length > idx) {
                eligibility = $(row.find('td')[idx]).text().trim();
            }
        }
    }

    const chartJson = extractChartDataJsonArray(html);
    if (chartJson) {
        try {
            const cleanedJson = chartJson.replace(/,\s*([}\]])/g, '$1');
            const parsed = JSON.parse(cleanedJson);
            tests = parsed.map((i) => ({
                test_name: i.xaxis || '',
                class_average: i.col1 || 0,
                max_marks: i.col2 || 0,
                marks_obtained: i.linevalue || 0,
            }));
        } catch { /* ignore */ }
    }
    return { tests, eligibility };
};

// ============================================================
//  Main Piggyback Scrape Orchestration
// ============================================================

/**
 * Session context received from the Chrome extension.
 * Stored in-memory; overwritten on each new signal.
 * @type {{ cookies: Array, url: string, timestamp: string } | null}
 */
let lastSessionSignal = null;

/**
 * Store session signal from the Chrome extension.
 */
export const setSessionSignal = (signal) => {
    lastSessionSignal = signal;
    console.log(`[Piggyback] Session signal received at ${signal.timestamp} from ${signal.url}`);
};

/**
 * Get the last session signal.
 */
export const getLastSessionSignal = () => lastSessionSignal;

/**
 * Attach to a running Chrome, scrape student data from the authenticated session,
 * normalize it, sync to DB, and log metrics.
 *
 * @param {string} usn - Student USN to extract
 * @param {{ signalTimestamp?: string }} options
 * @returns {Promise<object>} Normalized student data
 */
export const piggybackScrapeStudent = async (usn, options = {}) => {
    const initiatedAt = new Date();
    let browser = null;

    try {
        console.log(`[Piggyback] Starting piggyback scrape for USN: ${usn}`);

        // 1. Attach to browser
        browser = await attachToBrowser();

        // 2. Find the authenticated dashboard tab
        const pages = await browser.pages();
        let page = pages.find(p => {
            const url = p.url();
            return url.includes('parents.msrit.edu') && (url.includes('dashboard') || url.includes('com_studentdashboard'));
        });

        if (!page) {
            // Fallback: look for any msrit.edu page
            page = pages.find(p => p.url().includes('msrit.edu'));
        }

        if (!page) {
            throw new Error('No authenticated parents.msrit.edu tab found. Please log in first.');
        }

        const currentUrl = page.url();
        if (!isWhitelisted(currentUrl)) {
            throw new Error(`URL ${currentUrl} is not whitelisted. Aborting for security.`);
        }

        console.log(`[Piggyback] Found authenticated tab: ${currentUrl}`);

        // 3. Check fingerprint (research metric)
        const webdriverFlag = await checkWebdriverFlag(page);
        console.log(`[Piggyback] navigator.webdriver = ${webdriverFlag}`);

        // 4. Extract dashboard HTML
        const dashboardHtml = await page.content();

        // 5. Extract cookies from the page
        const cookies = await page.cookies();
        const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

        // 6. DISCONNECT (never close the user's browser!)
        await browser.disconnect();
        browser = null;
        console.log('[Piggyback] Disconnected from browser (browser still running).');

        // 7. Parse dashboard to find course rows
        const $dash = cheerio.load(dashboardHtml);
        const courseRows = extractCourseRowsFromDashboard($dash);
        console.log(`[Piggyback] Found ${courseRows.length} courses on dashboard.`);

        // 8. Build URL map for attendance + CIE fetches
        const urlToTargets = new Map();
        const pushTarget = (href, courseCode, type) => {
            const url = resolveParentsUrl(href);
            if (!url) return;
            if (!urlToTargets.has(url)) urlToTargets.set(url, []);
            urlToTargets.get(url).push({ courseCode, type });
        };
        for (const row of courseRows) {
            if (row.attLink) pushTarget(row.attLink, row.code, 'attendance');
            if (row.cieLink) pushTarget(row.cieLink, row.code, 'cie');
        }

        const examsUrl = 'https://parents.msrit.edu/newparents/index.php?option=com_history&task=getResult';
        urlToTargets.set(examsUrl, [{ courseCode: 'EXAMS', type: 'exams' }]);

        // 9. HTTP fetches using the hijacked session cookies
        const axiosInstance = axios.create({
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Cookie': cookieString,
            },
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        });

        const scrapedData = { dashboard: dashboardHtml, attendance: {}, cie: {} };

        const uniqueUrls = [...urlToTargets.keys()];
        const fetched = await Promise.all(
            uniqueUrls.map(async (url) => {
                try {
                    await new Promise((r) => setTimeout(r, Math.random() * 400 + 100));
                    const resp = await axiosInstance.get(url);
                    return { url, html: resp.data };
                } catch {
                    return { url, html: '' };
                }
            })
        );

        const htmlByUrl = new Map(fetched.map((f) => [f.url, f.html]));

        for (const [url, targets] of urlToTargets) {
            const html = htmlByUrl.get(url) ?? '';
            for (const t of targets) {
                if (t.type === 'exams') scrapedData.exams = html;
                else if (t.type === 'attendance') scrapedData.attendance[t.courseCode] = html;
                else if (t.type === 'cie') scrapedData.cie[t.courseCode] = html;
            }
        }

        // 10. Parse & normalize (same logic as traditional scraper)
        const name = $dash('h3').first().text().trim() || 'Unknown';
        const scrapedUsn = $dash('h2').first().text().trim() || usn;
        const classInfo = $dash('p').first().text().trim() || '';

        const currentSemesterData = [];
        for (const row of courseRows) {
            const att = parseAttendanceHtml(scrapedData.attendance?.[row.code]);
            const { tests: cie, eligibility: elig } = parseCieHtml(scrapedData.cie?.[row.code]);
            currentSemesterData.push({
                code: row.code, name: row.name, eligibility: elig,
                attendance_details: att, cie_details: { tests: cie },
            });
        }

        const $exam = cheerio.load(scrapedData.exams || '');
        const cgpaP = $exam('p').filter((_, el) => /\d+\.\d+/.test($exam(el).text())).first();
        const finalCgpa = cgpaP.length ? cgpaP.text().trim() : 'N/A';

        const semesterHistory = [];
        $exam('table.res-table').each((_, table) => {
            const cap = $exam(table).find('caption').text().replace(/\s+/g, ' ').trim();
            const semName = cap.split('Credits')[0].trim();
            const sgpaMatch = cap.match(/SGPA:\s*(\d+\.\d+)/);
            const creditsMatch = cap.match(/Credits Earned\s*:\s*(\d+)/);
            const courses = [];
            $exam(table).find('tbody tr').each((_, r) => {
                const cols = $exam(r).find('td');
                if (cols.length >= 6) {
                    courses.push({
                        code: $exam(cols[0]).text().trim(),
                        name: $exam(cols[1]).text().trim(),
                        gpa: $exam(cols[4]).text().trim(),
                        grade: $exam(cols[5]).text().trim(),
                    });
                }
            });
            semesterHistory.push({
                semester: semName,
                sgpa: sgpaMatch ? sgpaMatch[1] : 'N/A',
                credits_earned: creditsMatch ? creditsMatch[1] : 'N/A',
                courses,
            });
        });

        const studentRecord = {
            name, usn: scrapedUsn, class_details: classInfo,
            cgpa: finalCgpa, last_updated: new Date().toISOString(),
            current_semester: currentSemesterData, exam_history: semesterHistory,
        };

        const normalized = DataNormalizer.normalizeStudentRecord(studentRecord);

        // 11. Sync to database
        if (normalized) {
            console.log(`[Piggyback] Syncing ${scrapedUsn} to database...`);
            await syncStudents({ [scrapedUsn]: normalized });
        }

        // 12. Calculate and log metrics
        const completedAt = new Date();
        const latencyMs = completedAt.getTime() - initiatedAt.getTime();
        const freshnessOffset = options.signalTimestamp
            ? initiatedAt.getTime() - new Date(options.signalTimestamp).getTime()
            : null;

        const totalPayload = dashboardHtml.length + fetched.reduce((sum, f) => sum + (f.html?.length || 0), 0);

        await logScrapeMetric({
            usn: scrapedUsn,
            strategy: 'piggyback',
            initiated_at: initiatedAt,
            completed_at: completedAt,
            latency_ms: latencyMs,
            freshness_offset_ms: freshnessOffset,
            detected: false,
            navigator_webdriver: webdriverFlag,
            payload_size_bytes: totalPayload,
        });

        console.log(`[Piggyback] Scrape complete for ${scrapedUsn} in ${latencyMs}ms`);
        return normalized;

    } catch (error) {
        console.error(`[Piggyback] Scrape failed: ${error.message}`);

        // Log failure metric
        await logScrapeMetric({
            usn: usn || 'UNKNOWN',
            strategy: 'piggyback',
            initiated_at: initiatedAt,
            completed_at: new Date(),
            latency_ms: new Date().getTime() - initiatedAt.getTime(),
            detected: error.message.includes('captcha') || error.message.includes('blocked'),
            error_message: error.message,
        });

        throw error;
    } finally {
        if (browser) {
            try { await browser.disconnect(); } catch { /* already disconnected */ }
        }
    }
};

export default {
    checkCdpAvailability,
    piggybackScrapeStudent,
    setSessionSignal,
    getLastSessionSignal,
};
