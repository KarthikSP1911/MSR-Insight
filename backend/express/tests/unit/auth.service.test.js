import { jest } from '@jest/globals';
import authService from '../../src/services/auth.service.js';
import userRepository from '../../src/repositories/user.repository.js';
import proctorRepository from '../../src/repositories/proctor.repository.js';
import redisClient from '../../src/config/redis.config.js';
import bcrypt from 'bcrypt';

// Mock dependencies
jest.mock('../../src/repositories/user.repository.js', () => ({
    findByUSN: jest.fn(),
    create: jest.fn(),
    findByCredentials: jest.fn(),
}));

jest.mock('../../src/repositories/proctor.repository.js', () => ({
    findByProctorId: jest.fn(),
    create: jest.fn(),
}));

jest.mock('../../src/config/redis.config.js', () => ({
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    expire: jest.fn(),
}));

jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

jest.mock('../../src/services/puppeteerScraper.service.js', () => ({
    scrapeAndSyncStudent: jest.fn(),
}));

describe('AuthService Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register a new student successfully', async () => {
            userRepository.findByUSN.mockResolvedValue(null);
            userRepository.create.mockResolvedValue({ usn: '1MS21CS001', dob: '01-01-2000' });
            redisClient.set.mockResolvedValue('OK');

            const result = await authService.register('1MS21CS001', '01-01-2000');

            expect(result).toHaveProperty('usn', '1MS21CS001');
            expect(result).toHaveProperty('sessionId');
            expect(userRepository.create).toHaveBeenCalled();
            expect(redisClient.set).toHaveBeenCalledTimes(2);
        });

        it('should throw an error if user already exists', async () => {
            userRepository.findByUSN.mockResolvedValue({ usn: '1MS21CS001' });

            await expect(authService.register('1MS21CS001', '01-01-2000')).rejects.toThrow('User already exists');
        });
    });

    describe('login', () => {
        it('should login an existing student successfully', async () => {
            userRepository.findByCredentials.mockResolvedValue({ usn: '1MS21CS001', details: { some: 'data' } });
            redisClient.set.mockResolvedValue('OK');

            const result = await authService.login('1MS21CS001', '01-01-2000');

            expect(result).toHaveProperty('usn', '1MS21CS001');
            expect(result).toHaveProperty('sessionId');
            expect(result.needsSync).toBe(false);
            expect(redisClient.set).toHaveBeenCalledTimes(2);
        });

        it('should trigger scrape if user not found, then login', async () => {
            const { scrapeAndSyncStudent } = await import('../../src/services/puppeteerScraper.service.js');
            userRepository.findByCredentials
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ usn: '1MS21CS001', details: {} }); // Mock finding it after scrape
            scrapeAndSyncStudent.mockResolvedValue(true);
            redisClient.set.mockResolvedValue('OK');

            const result = await authService.login('1MS21CS001', '01-01-2000');

            expect(scrapeAndSyncStudent).toHaveBeenCalledWith('1MS21CS001', '01-01-2000');
            expect(result).toHaveProperty('usn', '1MS21CS001');
            expect(result.needsSync).toBe(true);
        });

        it('should throw error if scraping fails', async () => {
            const { scrapeAndSyncStudent } = await import('../../src/services/puppeteerScraper.service.js');
            userRepository.findByCredentials.mockResolvedValueOnce(null);
            scrapeAndSyncStudent.mockRejectedValue(new Error('Scraping error'));

            await expect(authService.login('1MS21CS001', '01-01-2000')).rejects.toThrow('Invalid USN or Date of Birth');
        });
    });

    describe('proctorLogin', () => {
        it('should login an existing proctor successfully', async () => {
            proctorRepository.findByProctorId.mockResolvedValue({ proctor_id: 'P123', password_hash: 'hashed' });
            bcrypt.compare.mockResolvedValue(true);
            redisClient.get.mockResolvedValue(null); // No existing session
            redisClient.set.mockResolvedValue('OK');

            const result = await authService.proctorLogin('P123', 'password');

            expect(result).toHaveProperty('proctorId', 'P123');
            expect(result).toHaveProperty('sessionId');
            expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashed');
        });

        it('should return existing session if proctor already logged in', async () => {
            proctorRepository.findByProctorId.mockResolvedValue({ proctor_id: 'P123', password_hash: 'hashed' });
            bcrypt.compare.mockResolvedValue(true);
            redisClient.get.mockResolvedValue('existing-session-id'); 
            redisClient.expire.mockResolvedValue('OK');

            const result = await authService.proctorLogin('P123', 'password');

            expect(result).toHaveProperty('proctorId', 'P123');
            expect(result).toHaveProperty('sessionId', 'existing-session-id');
        });

        it('should throw error if proctor not found', async () => {
            proctorRepository.findByProctorId.mockResolvedValue(null);

            await expect(authService.proctorLogin('P123', 'password')).rejects.toThrow('Proctor not found');
        });

        it('should throw error if password invalid', async () => {
            proctorRepository.findByProctorId.mockResolvedValue({ proctor_id: 'P123', password_hash: 'hashed' });
            bcrypt.compare.mockResolvedValue(false);

            await expect(authService.proctorLogin('P123', 'password')).rejects.toThrow('Invalid Proctor ID or Password');
        });
    });

    describe('logout', () => {
        it('should clear student session', async () => {
            redisClient.get.mockResolvedValue('student:1MS21CS001');
            redisClient.del.mockResolvedValue(1);

            await authService.logout('session-id');

            expect(redisClient.del).toHaveBeenCalledWith('usn:1MS21CS001');
            expect(redisClient.del).toHaveBeenCalledWith('session:session-id');
        });

        it('should clear proctor session', async () => {
            redisClient.get.mockResolvedValue('proctor:P123');
            redisClient.del.mockResolvedValue(1);

            await authService.logout('session-id');

            expect(redisClient.del).toHaveBeenCalledWith('proctor:P123');
            expect(redisClient.del).toHaveBeenCalledWith('session:session-id');
        });
    });

    describe('getProfile', () => {
        it('should return student profile', async () => {
            redisClient.get.mockResolvedValue('student:1MS21CS001');
            userRepository.findByUSN.mockResolvedValue({ usn: '1MS21CS001', name: 'John' });

            const result = await authService.getProfile('session-id');

            expect(result).toHaveProperty('usn', '1MS21CS001');
            expect(result).toHaveProperty('role', 'student');
        });

        it('should return proctor profile', async () => {
            redisClient.get.mockResolvedValue('proctor:P123');
            proctorRepository.findByProctorId.mockResolvedValue({ proctor_id: 'P123', name: 'Jane', password_hash: 'secret' });

            const result = await authService.getProfile('session-id');

            expect(result).toHaveProperty('proctor_id', 'P123');
            expect(result).toHaveProperty('role', 'proctor');
            expect(result).not.toHaveProperty('password_hash'); // Should be omitted
        });

        it('should throw error if session invalid', async () => {
            redisClient.get.mockResolvedValue(null);

            await expect(authService.getProfile('invalid-session')).rejects.toThrow('Session expired or invalid');
        });
    });
});
