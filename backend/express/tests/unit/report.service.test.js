import { jest } from '@jest/globals';

const mockScrapeAndSyncStudent = jest.fn();
const mockPublishEmailJob = jest.fn();
const mockProcessWhatsAppReport = jest.fn();
const mockFindUnique = jest.fn();
const mockFindByUSN = jest.fn();
const mockGetStudentDashboard = jest.fn();
const mockAxiosPost = jest.fn();

jest.unstable_mockModule('../../src/services/puppeteerScraper.service.js', () => ({
    scrapeAndSyncStudent: mockScrapeAndSyncStudent
}));
jest.unstable_mockModule('../../src/services/rabbitmq/email.producer.js', () => ({
    publishEmailJob: mockPublishEmailJob
}));
jest.unstable_mockModule('../../src/services/whatsapp.service.js', () => ({
    processWhatsAppReport: mockProcessWhatsAppReport
}));
jest.unstable_mockModule('../../src/config/db.config.js', () => ({
    default: {
        student: { findUnique: mockFindUnique }
    }
}));
jest.unstable_mockModule('../../src/services/student.service.js', () => ({
    default: { getStudentDashboard: mockGetStudentDashboard }
}));
jest.unstable_mockModule('../../src/repositories/user.repository.js', () => ({
    default: { findByUSN: mockFindByUSN }
}));
jest.unstable_mockModule('axios', () => ({
    default: {
        create: jest.fn(() => ({ post: mockAxiosPost }))
    }
}));

const reportService = await import('../../src/services/report.service.js');

describe('Report Service Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('triggerScrape', () => {
        it('should call scrapeAndSyncStudent', async () => {
            mockScrapeAndSyncStudent.mockResolvedValue(true);
            await reportService.triggerScrape('USN', 'DOB');
            expect(mockScrapeAndSyncStudent).toHaveBeenCalledWith('USN', 'DOB');
        });

        it('should throw if missing args', async () => {
            await expect(reportService.triggerScrape(null, null)).rejects.toThrow('USN and DOB are required');
        });
    });

    describe('queueEmailReport', () => {
        it('should publish email job', async () => {
            mockPublishEmailJob.mockResolvedValue(true);
            const result = await reportService.queueEmailReport('usn', '<html/>');
            expect(result).toBe(true);
            expect(mockPublishEmailJob).toHaveBeenCalledWith({ usn: 'USN', htmlContent: '<html/>' });
        });

        it('should throw if queuing fails', async () => {
            mockPublishEmailJob.mockResolvedValue(false);
            await expect(reportService.queueEmailReport('usn', '<html/>')).rejects.toThrow('Failed to queue email report job');
        });
    });

    describe('sendWhatsAppReport', () => {
        it('should throw if student not found', async () => {
            mockFindUnique.mockResolvedValue(null);
            await expect(reportService.sendWhatsAppReport('usn', '<html/>')).rejects.toThrow('Student not found');
        });

        it('should throw if no parents', async () => {
            mockFindUnique.mockResolvedValue({ parents: [] });
            await expect(reportService.sendWhatsAppReport('usn', '<html/>')).rejects.toThrow('No parents found');
        });

        it('should call processWhatsAppReport', async () => {
            mockFindUnique.mockResolvedValue({ 
                usn: 'USN', name: 'John', parents: [{ name: 'Dad' }] 
            });
            mockProcessWhatsAppReport.mockResolvedValue({ success: true });

            await reportService.sendWhatsAppReport('usn', '<html/>');
            expect(mockProcessWhatsAppReport).toHaveBeenCalledWith('USN', 'John', [{ name: 'Dad' }], '<html/>');
        });
    });

    describe('handleManualReportUpdate', () => {
        it('should respect cooldown', async () => {
            mockGetStudentDashboard.mockResolvedValue({
                details: { last_updated: new Date().toISOString() } // just updated
            });

            await expect(reportService.handleManualReportUpdate('usn')).rejects.toThrow(/Rate limit exceeded/);
        });

        it('should trigger scrape if cooldown passed', async () => {
            const oldDate = new Date(Date.now() - (10 * 60 * 1000)).toISOString(); // 10 mins ago
            mockGetStudentDashboard.mockResolvedValue({
                details: { last_updated: oldDate }
            });
            mockFindByUSN.mockResolvedValue({ usn: 'USN', dob: 'DOB' });
            mockScrapeAndSyncStudent.mockResolvedValue(true);

            await reportService.handleManualReportUpdate('usn');
            expect(mockScrapeAndSyncStudent).toHaveBeenCalledWith('USN', 'DOB');
        });
    });
});
