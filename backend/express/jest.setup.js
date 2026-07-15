import { jest } from '@jest/globals';

// Mock dependencies globally
jest.mock('./src/config/rabbitmq.config.js', () => ({
    getChannel: jest.fn().mockResolvedValue({
        assertQueue: jest.fn().mockResolvedValue(),
        sendToQueue: jest.fn().mockReturnValue(true),
        consume: jest.fn().mockResolvedValue(),
    })
}));

jest.mock('puppeteer', () => ({
    launch: jest.fn().mockResolvedValue({
        newPage: jest.fn().mockResolvedValue({
            setContent: jest.fn().mockResolvedValue(),
            pdf: jest.fn().mockResolvedValue(Buffer.from('mock pdf content')),
            goto: jest.fn().mockResolvedValue(),
            type: jest.fn().mockResolvedValue(),
            click: jest.fn().mockResolvedValue(),
            waitForNavigation: jest.fn().mockResolvedValue(),
            evaluate: jest.fn().mockResolvedValue({ details: 'mocked data' }),
            close: jest.fn().mockResolvedValue(),
        }),
        close: jest.fn().mockResolvedValue(),
    })
}));

jest.mock('resend', () => ({
    Resend: jest.fn().mockImplementation(() => ({
        emails: {
            send: jest.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null })
        }
    }))
}));

jest.mock('./src/config/redis.config.js', () => ({
    redisClient: {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        on: jest.fn(),
    },
    connectRedis: jest.fn(),
}));

jest.mock('./src/config/db.config.js', () => {
    return {
        __esModule: true,
        default: {
            student: { findUnique: jest.fn(), findMany: jest.fn(), upsert: jest.fn(), count: jest.fn() },
            proctor: { findUnique: jest.fn(), findMany: jest.fn(), upsert: jest.fn(), delete: jest.fn(), count: jest.fn() },
            proctorStudentMap: { findUnique: jest.fn(), findMany: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn(), count: jest.fn(), delete: jest.fn() },
            parent: { upsert: jest.fn() },
            user: { findUnique: jest.fn(), upsert: jest.fn() }
        }
    };
});

// Suppress console logs during tests to keep output clean, unless it's a test specifically checking logs
global.console = {
  ...console,
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
  // info: jest.fn(),
  // debug: jest.fn(),
};
