import * as cheerio from 'cheerio';
import { DataNormalizer } from './dataNormalizer.js';

const COURSE_CODE_RE = /^[0-9A-Z]{5,14}$/;

export const extractCourseRowsFromDashboard = ($dash) => {
    const courses = [];
    const pushRow = ($row) => {
        const cols = $row.find("td");
        if (cols.length < 2) return;
        const rawCode = $dash(cols[0]).text().trim().split(/\s+/)[0];
        const code = rawCode.split('(')[0].trim().toUpperCase();
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
            const code = rawCode.split('(')[0].trim().toUpperCase();
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

/** Balanced-bracket extraction for `var chartData = [ ... ];` (CIE marks chart). */
export const extractChartDataJsonArray = (html) => {
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

export const parseAndProcessData = (scrapedData) => {
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
        last_updated: new Date().toISOString(),
        current_semester: currentSemesterData,
        exam_history: semesterHistory
    };

    const normalized = DataNormalizer.normalizeStudentRecord(studentRecord);
    return normalized;
};
