import request from 'supertest';
import app from '../../src/app.js';
import { jest } from '@jest/globals';

describe('App Integration Tests', () => {
    it('should return 200 on /api/health', async () => {
        const response = await request(app).get('/api/health');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'express running');
    });

    it('should apply CORS headers', async () => {
        const response = await request(app).get('/api/health').set('Origin', 'http://localhost:3000');
        expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });

    it('should reject unknown origins (CORS)', async () => {
        // Express cors module doesn't block if origin is missing by default unless configured.
        // It does block if origin is explicitly provided and not allowed.
        const response = await request(app).get('/api/health').set('Origin', 'http://evil.com');
        expect(response.status).toBe(500); // Because it throws an error in cors middleware
        expect(response.text).toContain('Not allowed by CORS');
    });
});
