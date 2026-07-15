import { jest } from '@jest/globals';
import { scrapeAndSyncStudent } from '../../src/services/puppeteerScraper.service.js';
import puppeteer from 'puppeteer';

jest.mock('../../src/services/student.service.js', () => ({
    syncStudents: jest.fn().mockResolvedValue({ success: ['1MS21CS001'], errors: [] })
}));

describe('Puppeteer Scraper Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully scrape and sync student', async () => {
        // Because of our global puppeteer mock in jest.setup.js, this will use the mocked browser
        const result = await scrapeAndSyncStudent('1MS21CS001', '01-01-2000');
        expect(puppeteer.launch).toHaveBeenCalled();
        expect(result).toBe(true);
    });

    it('should throw error if scraping fails (e.g. invalid credentials)', async () => {
        const mockedBrowser = {
            newPage: jest.fn().mockResolvedValue({
                goto: jest.fn().mockResolvedValue(),
                type: jest.fn().mockResolvedValue(),
                click: jest.fn().mockResolvedValue(),
                waitForNavigation: jest.fn().mockResolvedValue(),
                evaluate: jest.fn().mockResolvedValue(null), // Simulate failed login or missing data
                close: jest.fn().mockResolvedValue(),
            }),
            close: jest.fn().mockResolvedValue(),
        };
        puppeteer.launch.mockResolvedValueOnce(mockedBrowser);

        await expect(scrapeAndSyncStudent('1MS21CS001', '01-01-2000')).rejects.toThrow();
    });
});
