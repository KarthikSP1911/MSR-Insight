import { Router } from 'express';
import {
    handleSignal,
    handleTrigger,
    getStatus,
    getMetricsHandler,
    compareMetrics,
} from '../controllers/piggyback.controller.js';

const router = Router();

// Extension → Backend: session detected
router.post('/signal', handleSignal);

// Manual trigger: attach & scrape
router.post('/trigger', handleTrigger);

// CDP connection status
router.get('/status', getStatus);

// Raw metrics
router.get('/metrics', getMetricsHandler);

// Aggregated comparison: traditional vs piggyback
router.get('/metrics/compare', compareMetrics);

export default router;
