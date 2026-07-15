import request from 'supertest';
import app from '../../src/app.js';
import { jest } from '@jest/globals';
import authService from '../../src/services/auth.service.js';

jest.mock('../../src/services/auth.service.js', () => ({
    register: jest.fn(),
    login: jest.fn(),
    proctorRegister: jest.fn(),
    proctorLogin: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
}));

describe('Auth Routes Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        it('should return 201 on successful registration', async () => {
            authService.register.mockResolvedValue({ usn: '1MS21CS001', sessionId: 'sess-123' });

            const response = await request(app)
                .post('/api/auth/register')
                .send({ usn: '1MS21CS001', dob: '01-01-2000' });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.sessionId).toBe('sess-123');
        });

        it('should return 400 if missing usn or dob', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({ usn: '1MS21CS001' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should return 200 on successful login', async () => {
            authService.login.mockResolvedValue({ usn: '1MS21CS001', sessionId: 'sess-123', needsSync: false });

            const response = await request(app)
                .post('/api/auth/login')
                .send({ usn: '1MS21CS001', dob: '01-01-2000' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.sessionId).toBe('sess-123');
        });
    });

    describe('GET /api/auth/profile', () => {
        it('should return 200 and profile if session valid', async () => {
            authService.getProfile.mockResolvedValue({ usn: '1MS21CS001', name: 'John' });

            const response = await request(app)
                .get('/api/auth/profile')
                .set('x-session-id', 'valid-session');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.usn).toBe('1MS21CS001');
        });

        it('should return 401 if session missing', async () => {
            const response = await request(app).get('/api/auth/profile');
            expect(response.status).toBe(401);
        });
    });
});
