import { jest } from '@jest/globals';

const mockFindByUSN = jest.fn();
const mockCreateUser = jest.fn();
const mockFindByCredentials = jest.fn();
const mockFindByProctorId = jest.fn();
const mockCreateProctor = jest.fn();
const mockRedisSet = jest.fn();
const mockRedisGet = jest.fn();
const mockRedisDel = jest.fn();
const mockRedisExpire = jest.fn();
const mockHash = jest.fn();
const mockCompare = jest.fn();
const mockScrapeAndSyncStudent = jest.fn();

jest.unstable_mockModule('../../src/repositories/user.repository.js', () => ({
    default: {
        findByUSN: mockFindByUSN,
        create: mockCreateUser,
        findByCredentials: mockFindByCredentials,
    }
}));

jest.unstable_mockModule('../../src/repositories/proctor.repository.js', () => ({
    default: {
        findByProctorId: mockFindByProctorId,
        create: mockCreateProctor,
    }
}));

jest.unstable_mockModule('../../src/config/redis.config.js', () => ({
    default: {
        set: mockRedisSet,
        get: mockRedisGet,
        del: mockRedisDel,
        expire: mockRedisExpire,
    }
}));

jest.unstable_mockModule('bcrypt', () => ({
    default: {
        hash: mockHash,
        compare: mockCompare,
    }
}));

jest.unstable_mockModule('../../src/services/puppeteerScraper.service.js', () => ({
    scrapeAndSyncStudent: mockScrapeAndSyncStudent,
    default: { scrapeAndSyncStudent: mockScrapeAndSyncStudent }
}));

const authService = (await import('../../src/services/auth.service.js')).default;

describe('AuthService Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register a new student successfully', async () => {
            mockFindByUSN.mockResolvedValue(null);
            mockCreateUser.mockResolvedValue({ usn: '1MS21CS001', dob: '01-01-2000' });
            mockRedisSet.mockResolvedValue('OK');

            const result = await authService.register('1MS21CS001', '01-01-2000');

            expect(result).toHaveProperty('usn', '1MS21CS001');
            expect(result).toHaveProperty('sessionId');
            expect(mockCreateUser).toHaveBeenCalled();
            expect(mockRedisSet).toHaveBeenCalledTimes(2);
        });

        it('should throw an error if user already exists', async () => {
            mockFindByUSN.mockResolvedValue({ usn: '1MS21CS001' });

            await expect(authService.register('1MS21CS001', '01-01-2000')).rejects.toThrow('User already exists');
        });
    });

    describe('login', () => {
        it('should login an existing student successfully', async () => {
            mockFindByCredentials.mockResolvedValue({ usn: '1MS21CS001', details: { some: 'data' } });
            mockRedisSet.mockResolvedValue('OK');

            const result = await authService.login('1MS21CS001', '01-01-2000');

            expect(result).toHaveProperty('usn', '1MS21CS001');
            expect(result).toHaveProperty('sessionId');
            expect(result.needsSync).toBe(false);
            expect(mockRedisSet).toHaveBeenCalledTimes(2);
        });

        it('should trigger scrape if user not found, then login', async () => {
            mockFindByCredentials
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ usn: '1MS21CS001', details: {} });
            mockScrapeAndSyncStudent.mockResolvedValue(true);
            mockRedisSet.mockResolvedValue('OK');

            const result = await authService.login('1MS21CS001', '01-01-2000');

            expect(mockScrapeAndSyncStudent).toHaveBeenCalledWith('1MS21CS001', '01-01-2000');
            expect(result).toHaveProperty('usn', '1MS21CS001');
            expect(result.needsSync).toBe(true);
        });

        it('should throw error if scraping fails', async () => {
            mockFindByCredentials.mockResolvedValueOnce(null);
            mockScrapeAndSyncStudent.mockRejectedValue(new Error('Scraping error'));

            await expect(authService.login('1MS21CS001', '01-01-2000')).rejects.toThrow('Invalid USN or Date of Birth');
        });
    });

    describe('proctorLogin', () => {
        it('should login an existing proctor successfully', async () => {
            mockFindByProctorId.mockResolvedValue({ proctor_id: 'P123', password_hash: 'hashed' });
            mockCompare.mockResolvedValue(true);
            mockRedisGet.mockResolvedValue(null);
            mockRedisSet.mockResolvedValue('OK');

            const result = await authService.proctorLogin('P123', 'password');

            expect(result).toHaveProperty('proctorId', 'P123');
            expect(result).toHaveProperty('sessionId');
            expect(mockCompare).toHaveBeenCalledWith('password', 'hashed');
        });

        it('should return existing session if proctor already logged in', async () => {
            mockFindByProctorId.mockResolvedValue({ proctor_id: 'P123', password_hash: 'hashed' });
            mockCompare.mockResolvedValue(true);
            mockRedisGet.mockResolvedValue('existing-session-id'); 
            mockRedisExpire.mockResolvedValue('OK');

            const result = await authService.proctorLogin('P123', 'password');

            expect(result).toHaveProperty('proctorId', 'P123');
            expect(result).toHaveProperty('sessionId', 'existing-session-id');
        });

        it('should throw error if proctor not found', async () => {
            mockFindByProctorId.mockResolvedValue(null);

            await expect(authService.proctorLogin('P123', 'password')).rejects.toThrow('Proctor not found');
        });

        it('should throw error if password invalid', async () => {
            mockFindByProctorId.mockResolvedValue({ proctor_id: 'P123', password_hash: 'hashed' });
            mockCompare.mockResolvedValue(false);

            await expect(authService.proctorLogin('P123', 'password')).rejects.toThrow('Invalid Proctor ID or Password');
        });
    });

    describe('logout', () => {
        it('should clear student session', async () => {
            mockRedisGet.mockResolvedValue('student:1MS21CS001');
            mockRedisDel.mockResolvedValue(1);

            await authService.logout('session-id');

            expect(mockRedisDel).toHaveBeenCalledWith('usn:1MS21CS001');
            expect(mockRedisDel).toHaveBeenCalledWith('session:session-id');
        });

        it('should clear proctor session', async () => {
            mockRedisGet.mockResolvedValue('proctor:P123');
            mockRedisDel.mockResolvedValue(1);

            await authService.logout('session-id');

            expect(mockRedisDel).toHaveBeenCalledWith('proctor:P123');
            expect(mockRedisDel).toHaveBeenCalledWith('session:session-id');
        });
    });

    describe('getProfile', () => {
        it('should return student profile', async () => {
            mockRedisGet.mockResolvedValue('student:1MS21CS001');
            mockFindByUSN.mockResolvedValue({ usn: '1MS21CS001', name: 'John' });

            const result = await authService.getProfile('session-id');

            expect(result).toHaveProperty('usn', '1MS21CS001');
            expect(result).toHaveProperty('role', 'student');
        });

        it('should return proctor profile', async () => {
            mockRedisGet.mockResolvedValue('proctor:P123');
            mockFindByProctorId.mockResolvedValue({ proctor_id: 'P123', name: 'Jane', password_hash: 'secret' });

            const result = await authService.getProfile('session-id');

            expect(result).toHaveProperty('proctor_id', 'P123');
            expect(result).toHaveProperty('role', 'proctor');
            expect(result).not.toHaveProperty('password_hash');
        });

        it('should throw error if session invalid', async () => {
            mockRedisGet.mockResolvedValue(null);

            await expect(authService.getProfile('invalid-session')).rejects.toThrow('Session expired or invalid');
        });
    });
});
