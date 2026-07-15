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

export const getCompleteStudentData = async (usn, day, month, year) => {
    let browser;
    try {
        logger.info(`[*] Launching Puppeteer for USN: ${usn}...`);
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(60000); // 60 seconds
        await page.goto("https://parents.msrit.edu/newparents/", { waitUntil: 'domcontentloaded', timeout: 60000 });

        await page.type('#username', usn);
        await page.select('#dd', `${day} `);
        await page.select('#mm', month);
        await page.select('#yyyy', year);
        
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
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

        logger.info("[*] Parsing Dashboard Course Table...");
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
        logger.error(`[X] Automation Error: ${error.message}`);
        return null;
    } finally {
        if (browser) await browser.close();
    }
};
