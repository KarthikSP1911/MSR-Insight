import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';
import https from 'https';
import { extractCourseRowsFromDashboard } from './htmlParser.js';
import logger from '../../utils/logger.js';

const resolveParentsUrl = (href) => {
    if (!href || typeof href !== "string") return "";
    const h = href.trim();
    if (h.startsWith("http://") || h.startsWith("https://")) return h;
    if (h.startsWith("/")) return `https://parents.msrit.edu${h}`;
    return `https://parents.msrit.edu/newparents/${h.replace(/^\.\//, "")}`;
};

export const getCompleteStudentData = async (usn, day, month, year, authType, last4Digits) => {
    let browser;
    try {
        logger.info(`[*] Launching local Puppeteer for USN: ${usn}...`);
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(60000); // 60 seconds
        await page.goto("https://parents.msrit.edu/newparents/", { waitUntil: 'domcontentloaded', timeout: 60000 });

        await page.type('#username', usn);
        
        // Select day, month, year robustly regardless of leading zeroes or trailing spaces
        await page.evaluate((dStr, mStr, yStr) => {
            const selectOpt = (id, val) => {
                const sel = document.getElementById(id);
                if (sel) {
                    const target = String(val).trim();
                    const opt = Array.from(sel.options).find(o => 
                        o.value.trim() === target || 
                        o.text.trim() === target || 
                        (!isNaN(parseInt(o.value, 10)) && parseInt(o.value, 10) === parseInt(target, 10))
                    );
                    if (opt) {
                        sel.value = opt.value;
                        sel.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            };
            selectOpt('dd', dStr);
            selectOpt('mm', mStr);
            selectOpt('yyyy', yStr);
        }, day, month, year);
        
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
            page.evaluate(() => {
                const btn = document.querySelector('.cn-login-btn, input[type="submit"], button[type="submit"]');
                if (btn) btn.click();
            })
        ]);

        // Explicitly wait for stage 2 elements OR dashboard elements to resolve in DOM
        await page.waitForSelector('#id-type-select, .digit-input, #enteredid, a[href*="logout"], table', { timeout: 15000 }).catch(() => {});

        let currentUrl = page.url();
        let content = await page.content();
        let hasLogout = content.toUpperCase().includes("LOGOUT");
        let isDashboardUrl = currentUrl.toLowerCase().includes("dashboard") || currentUrl.toLowerCase().includes("ksign");

        // Check if secondary verification form is required
        if (!isDashboardUrl && !hasLogout) {
            logger.info("[*] Secondary verification check: looking for stage 2 form...");
            
            const hasSelect = await page.$('#id-type-select, select[name="idType"]').catch(() => null);
            const hasDigits = await page.$('.digit-input, #enteredid').catch(() => null);

            if ((hasSelect || hasDigits) && last4Digits) {
                logger.info(`[*] Submitting secondary verification (${authType || 'Default'} / ****)...`);
                
                if (hasSelect) {
                    await page.evaluate((targetAuthType) => {
                        const sel = document.querySelector('#id-type-select, select[name="idType"]');
                        if (sel) {
                            const cleanTarget = (targetAuthType || '').toLowerCase();
                            let targetValue = '1'; // Default: Father Mobile
                            if (cleanTarget.includes('mother') || cleanTarget === '2') {
                                targetValue = '2';
                            } else if (cleanTarget.includes('abc') || cleanTarget === '3') {
                                targetValue = '3';
                            }
                            sel.value = targetValue;
                            sel.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    }, authType || '');
                }

                await page.evaluate((digits) => {
                    const inputs = Array.from(document.querySelectorAll('.digit-input'));
                    const cleanDigits = String(digits).replace(/\D/g, '');
                    
                    for (let i = 0; i < inputs.length && i < cleanDigits.length; i++) {
                        inputs[i].value = cleanDigits[i];
                        inputs[i].dispatchEvent(new Event('input', { bubbles: true }));
                        inputs[i].dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    
                    const hiddenField = document.getElementById('enteredid');
                    if (hiddenField) {
                        hiddenField.value = cleanDigits;
                    }
                }, last4Digits);

                await Promise.all([
                    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
                    page.evaluate(() => {
                        const btn = document.querySelector('#btn-submit, input[type="submit"], button[type="submit"]');
                        if (btn) btn.click();
                    })
                ]);

                await page.waitForSelector('a[href*="logout"], .dash_od_row, table', { timeout: 15000 }).catch(() => {});

                currentUrl = page.url();
                content = await page.content();
                hasLogout = content.toUpperCase().includes("LOGOUT");
                isDashboardUrl = currentUrl.toLowerCase().includes("dashboard") || currentUrl.toLowerCase().includes("ksign");
            }
        }

        if (!isDashboardUrl && !hasLogout) {
            throw new Error("Invalid portal credentials or 4-digit PIN. Please verify your USN, Date of Birth, and PIN.");
        }

        const scrapedData = { dashboard: content, attendance: {}, cie: {} };
        const cookies = await page.cookies();
        
        const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

        // Close browser, switch to light HTTP requests
        await browser.close();
        browser = null;

        logger.info("[*] Parsing Dashboard Course Table...");
        const $dash = cheerio.load(content);

        const courseRows = extractCourseRowsFromDashboard($dash);

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

        // Placement URLs
        const placementEligibilityUrl = "https://parents.msrit.edu/newparents/index.php?option=com_placement&controller=placement&task=placementeligibility";
        const placementStatusUrl = "https://parents.msrit.edu/newparents/index.php?option=com_placement&controller=placement&task=placementstatus";
        const placementResultsUrl = "https://parents.msrit.edu/newparents/index.php?option=com_placement&controller=placement&task=placementresults";
        const placementProfileUrl = "https://parents.msrit.edu/newparents/index.php?option=com_placement&controller=placement&task=getBasicprofiledetails";

        urlToTargets.set(placementEligibilityUrl, [{ courseCode: "PLACEMENT", type: "placement_eligibility" }]);
        urlToTargets.set(placementStatusUrl, [{ courseCode: "PLACEMENT", type: "placement_status" }]);
        urlToTargets.set(placementResultsUrl, [{ courseCode: "PLACEMENT", type: "placement_results" }]);
        urlToTargets.set(placementProfileUrl, [{ courseCode: "PLACEMENT", type: "placement_profile" }]);

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
                else if (t.type === "placement_eligibility") scrapedData.placementEligibility = html;
                else if (t.type === "placement_status") scrapedData.placementStatus = html;
                else if (t.type === "placement_results") scrapedData.placementResults = html;
                else if (t.type === "placement_profile") scrapedData.placementProfile = html;
            }
        }

        return scrapedData;

    } catch (error) {
        logger.error(`[X] Automation Error: ${error.message}`);
        throw error;
    } finally {
        if (browser) await browser.close();
    }
};

export default { getCompleteStudentData };
