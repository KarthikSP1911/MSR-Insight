import { jest } from '@jest/globals';

const mockGetCompleteStudentData = jest.fn();
const mockParseAndProcessData = jest.fn();
const mockSyncStudents = jest.fn();

jest.unstable_mockModule('../../src/services/scraper/puppeteerClient.js', () => ({
    getCompleteStudentData: mockGetCompleteStudentData
}));
jest.unstable_mockModule('../../src/services/scraper/htmlParser.js', () => ({
    parseAndProcessData: mockParseAndProcessData
}));
jest.unstable_mockModule('../../src/services/student.service.js', () => ({
    syncStudents: mockSyncStudents,
    default: { syncStudents: mockSyncStudents }
}));

// Dynamic import AFTER mocking
const { scrapeAndSyncStudent } = await import('../../src/services/puppeteerScraper.service.js');

describe('Puppeteer Scraper Service (Orchestrator)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully orchestrate scrape, parse, and sync', async () => {
        const mockedScrapedData = { dashboard: '<html>...</html>' };
        const mockedNormalizedData = { usn: '1MS21CS001', cgpa: 9.0 };

        mockGetCompleteStudentData.mockResolvedValue(mockedScrapedData);
        mockParseAndProcessData.mockReturnValue(mockedNormalizedData);
        mockSyncStudents.mockResolvedValue(true);

        const result = await scrapeAndSyncStudent('1MS21CS001', '01-01-2000');

        expect(mockGetCompleteStudentData).toHaveBeenCalledWith('1MS21CS001', '01', '01', '2000');
        expect(mockParseAndProcessData).toHaveBeenCalledWith(mockedScrapedData);
        expect(mockSyncStudents).toHaveBeenCalledWith({ '1MS21CS001': { ...mockedNormalizedData, dob: '01-01-2000' } });
        
        expect(result).toEqual({ ...mockedNormalizedData, dob: '01-01-2000' });
    });

    it('should throw an error if scraping fails to return data', async () => {
        mockGetCompleteStudentData.mockResolvedValue(null);

        await expect(scrapeAndSyncStudent('1MS21CS001', '01-01-2000')).rejects.toThrow('Failed to scrape data for USN: 1MS21CS001');
    });

    it('should throw an error if parsing fails to return normalized data', async () => {
        const mockedScrapedData = { dashboard: '<html>...</html>' };
        mockGetCompleteStudentData.mockResolvedValue(mockedScrapedData);
        mockParseAndProcessData.mockReturnValue(null);

        await expect(scrapeAndSyncStudent('1MS21CS001', '01-01-2000')).rejects.toThrow('Failed to parse and normalize the scraped data.');
    });

    it('should correctly parse Date objects for DOB', async () => {
        const dateDob = new Date('2000-12-15T00:00:00Z');
        const expectedDay = String(dateDob.getDate()).padStart(2, '0');
        const expectedMonth = String(dateDob.getMonth() + 1).padStart(2, '0');
        const expectedYear = String(dateDob.getFullYear());

        const mockedScrapedData = { dashboard: '<html>...</html>' };
        const mockedNormalizedData = { usn: '1MS21CS001', cgpa: 9.0 };

        mockGetCompleteStudentData.mockResolvedValue(mockedScrapedData);
        mockParseAndProcessData.mockReturnValue(mockedNormalizedData);
        mockSyncStudents.mockResolvedValue(true);

        await scrapeAndSyncStudent('1MS21CS001', dateDob);

        expect(mockGetCompleteStudentData).toHaveBeenCalledWith('1MS21CS001', expectedDay, expectedMonth, expectedYear);
    });
});
