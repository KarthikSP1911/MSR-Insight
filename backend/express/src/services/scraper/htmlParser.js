import * as cheerio from 'cheerio';
import { DataNormalizer } from './dataNormalizer.js';

const COURSE_CODE_RE = /^[0-9A-Z]{5,14}$/;

const resolveParentsUrl = (href) => {
    if (!href || typeof href !== "string") return "";
    const h = href.trim();
    if (h.startsWith("http://") || h.startsWith("https://")) return h;
    if (h.startsWith("/")) return `https://parents.msrit.edu${h}`;
    return `https://parents.msrit.edu/newparents/${h.replace(/^\.\//, "")}`;
};

export const extractCourseRowsFromDashboard = ($dash) => {
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

// ---- Placement Scrapers ----
export const parsePlacementEvents = (html) => {
    if (!html) return [];
    const $ = cheerio.load(html);
    const events = [];

    // 1. Look for lists (standard for Contineo placement sections)
    const listItems = $('ul.cn-elig_list li, .cn-elig_list li');
    if (listItems.length > 0) {
        listItems.each((_, li) => {
            const $li = $(li);
            if ($li.find('.cn-noevents').length > 0 || 
                $li.text().includes("No Events available") || 
                $li.text().includes("No events") ||
                $li.hasClass('cn-noevents')) {
                return;
            }
            
            const lines = $li.text().split('\n').map(l => l.trim()).filter(l => l.length > 0);
            let title = $li.find('.elig_name').text().trim() || $li.find('h4').text().trim();
            if (!title && lines.length > 0) {
                if (lines[0].length === 1 && lines.length > 1) {
                    title = lines[1];
                } else {
                    title = lines[0];
                }
            }
            title = title || "Placement Opportunity";
            const actionLink = $li.find('a').attr('href') || '';
            
            const details = [];
            $li.find('p, span, div').each((_, el) => {
                const text = $(el).text().trim();
                if (text && text !== title && text.length > 1 && !text.includes("Choose file") && !text.includes("Upload")) {
                    details.push(text);
                }
            });
            
            events.push({
                title,
                details: Array.from(new Set(details)).slice(0, 10),
                actionLink: actionLink ? resolveParentsUrl(actionLink) : ''
            });
        });
        
        if (events.length > 0) return events;
    }

    // 2. Fallback to general tables
    const tables = $('table');
    if (tables.length > 0) {
        tables.each((_, table) => {
            const $table = $(table);
            const headers = [];
            $table.find('thead th, tr th').each((_, th) => {
                headers.push($(th).text().trim());
            });

            $table.find('tbody tr, tr').each((_, tr) => {
                const $tr = $(tr);
                if ($tr.find('th').length > 0) return;
                const cols = $tr.find('td');
                if (cols.length === 0) return;

                const eventData = {};
                cols.each((i, td) => {
                    const header = headers[i] || `field_${i}`;
                    eventData[header] = $(td).text().trim();
                });
                
                const actionLink = $tr.find('a').attr('href') || '';
                if (actionLink) {
                    eventData.actionLink = resolveParentsUrl(actionLink);
                }
                
                if (Object.keys(eventData).length > 0) {
                    events.push(eventData);
                }
            });
        });
    }

    return events;
};

export const parsePlacementProfile = (html) => {
    if (!html) return {};
    const $ = cheerio.load(html);
    const profile = {};

    $('.profile_info_row').each((_, row) => {
        const $row = $(row);
        const label = $row.find('.profile_info_label').text().trim().replace(/:$/, '').trim();
        const value = $row.find('.profile_info_value').text().trim();
        if (label && value && label.length < 50 && value.length < 200) {
            profile[label] = value;
        }
    });

    $('table tr').each((_, tr) => {
        const cols = $(tr).find('td, th');
        if (cols.length === 2) {
            const key = $(cols[0]).text().trim().replace(/:$/, '').trim();
            const value = $(cols[1]).text().trim();
            if (key && value && key.length < 50) {
                profile[key] = value;
            }
        }
    });

    $('.form-group, .uk-form-controls, div').each((_, group) => {
        const $group = $(group);
        const label = $group.find('label').text().trim().replace(/:$/, '').trim();
        const value = $group.find('input[type="text"], input[type="number"], select').val() || 
                      $group.find('.value, span, p').first().text().trim();
                      
        if (label && value && label.length < 50 && typeof value === 'string' && value.length < 200) {
            profile[label] = value;
        }
    });

    $('input[type="text"], input[type="email"], input[type="number"], select').each((_, input) => {
        const $input = $(input);
        const id = $input.attr('id') || '';
        const name = $input.attr('name') || '';
        const value = $input.val();
        
        let label = '';
        if (id) {
            label = $(`label[for="${id}"]`).text().trim().replace(/:$/, '').trim();
        }
        if (!label && name) {
            label = name;
        }
        if (label && value && typeof value === 'string') {
            profile[label] = value;
        }
    });

    const cleanProfile = {};
    for (const key in profile) {
        if (key && profile[key] && !key.toLowerCase().includes('token') && !key.toLowerCase().includes('submit')) {
            cleanProfile[key] = profile[key];
        }
    }

    return cleanProfile;
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
        exam_history: semesterHistory,
        placement: {
            profile: parsePlacementProfile(scrapedData.placementProfile),
            eligibilityEvents: parsePlacementEvents(scrapedData.placementEligibility),
            inProgressEvents: parsePlacementEvents(scrapedData.placementStatus),
            completedEvents: parsePlacementEvents(scrapedData.placementResults)
        }
    };

    const normalized = DataNormalizer.normalizeStudentRecord(studentRecord);
    return normalized;
};
