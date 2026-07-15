import { jest } from '@jest/globals';

const mockRegister = jest.fn();
const mockLogin = jest.fn();
const mockProctorRegister = jest.fn();
const mockProctorLogin = jest.fn();
const mockLogout = jest.fn();
const mockGetProfile = jest.fn();

jest.unstable_mockModule('../../src/services/auth.service.js', () => ({
    default: {
        register: mockRegister,
        login: mockLogin,
        proctorRegister: mockProctorRegister,
        proctorLogin: mockProctorLogin,
        logout: mockLogout,
        getProfile: mockGetProfile,
    }
}));

const request = (await import('supertest')).default;
const app = (await import('../../src/app.js')).default;

describe('Auth Routes Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        it('should return 201 on successful registration', async () => {
            mockRegister.mockResolvedValue({ usn: '1MS21CS001', sessionId: 'sess-123' });

            const response = await request(app)
                .post('/api/auth/register')
                .send({ usn: '1MS21CS001', dob: '01-01-2000' });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.headers['set-cookie'][0]).toMatch(/session_id=sess-123/);
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
            mockLogin.mockResolvedValue({ usn: '1MS21CS001', sessionId: 'sess-123', needsSync: false });

            const response = await request(app)
                .post('/api/auth/login')
                .send({ usn: '1MS21CS001', dob: '01-01-2000' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.headers['set-cookie'][0]).toMatch(/session_id=sess-123/);
        });
    });

    describe('GET /api/auth/profile', () => {
        it('should return 200 and profile if session valid', async () => {
            mockGetProfile.mockResolvedValue({ usn: '1MS21CS001', name: 'John' });

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
