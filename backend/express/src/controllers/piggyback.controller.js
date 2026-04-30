import axios from 'axios';
import {
    checkCdpAvailability,
    piggybackScrapeStudent,
    setSessionSignal,
    getLastSessionSignal,
} from '../scraper/piggyback.service.js';
import { getMetrics, getComparisonStats } from '../scraper/metrics.helper.js';

/**
 * POST /api/piggyback/signal
 * Receives session context from the Chrome extension.
 * Body: { cookies: Array, url: string, timestamp: string }
 */
export const handleSignal = async (req, res) => {
    try {
        const { cookies, url, timestamp } = req.body;

        if (!cookies || !url) {
            return res.status(400).json({ success: false, error: 'cookies and url are required.' });
        }

        // Store the signal
        setSessionSignal({ cookies, url, timestamp: timestamp || new Date().toISOString() });

        console.log(`[Piggyback] Signal received — ${cookies.length} cookies from ${url}`);

        return res.json({
            success: true,
            message: 'Session signal received. Use /trigger to initiate scrape.',
            cookieCount: cookies.length,
            url,
        });
    } catch (error) {
        console.error('[Piggyback] Signal handler error:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * POST /api/piggyback/trigger
 * Manual trigger to attach to Chrome and scrape.
 * Body: { usn?: string }
 */
export const handleTrigger = async (req, res) => {
    try {
        const { usn } = req.body;

        // Check CDP availability first
        const cdp = await checkCdpAvailability();
        if (!cdp.reachable) {
            return res.status(503).json({
                success: false,
                error: 'Chrome is not reachable on CDP port. Launch Chrome with --remote-debugging-port=9222.',
            });
        }

        const signal = getLastSessionSignal();
        const options = signal ? { signalTimestamp: signal.timestamp } : {};

        const data = await piggybackScrapeStudent(usn || 'AUTO', options);

        return res.json({
            success: true,
            message: `Piggyback scrape completed for ${data?.usn || usn}.`,
            data: {
                usn: data?.usn,
                name: data?.name,
                subjects_count: data?.subjects?.length || 0,
                cgpa: data?.cgpa,
            },
        });
    } catch (error) {
        console.error('[Piggyback] Trigger error:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * GET /api/piggyback/status
 * Checks if Chrome is reachable via CDP.
 */
export const getStatus = async (req, res) => {
    try {
        const cdp = await checkCdpAvailability();
        const signal = getLastSessionSignal();

        return res.json({
            ...cdp,
            lastSignal: signal
                ? {
                    timestamp: signal.timestamp,
                    url: signal.url,
                    cookieCount: signal.cookies?.length || 0,
                }
                : null,
        });
    } catch (error) {
        return res.status(500).json({ reachable: false, error: error.message });
    }
};

/**
 * GET /api/piggyback/metrics
 * Returns scrape metrics, optionally filtered by strategy.
 * Query: ?strategy=piggyback|traditional&limit=50
 */
export const getMetricsHandler = async (req, res) => {
    try {
        const { strategy, limit } = req.query;
        const metrics = await getMetrics({
            strategy: strategy || undefined,
            limit: limit ? parseInt(limit, 10) : 100,
        });
        return res.json({ success: true, count: metrics.length, metrics });
    } catch (error) {
        console.error('[Piggyback] Metrics fetch error:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * GET /api/piggyback/metrics/compare
 * Aggregated comparison between traditional and piggyback strategies.
 */
export const compareMetrics = async (req, res) => {
    try {
        const comparison = await getComparisonStats();
        return res.json({ success: true, comparison });
    } catch (error) {
        console.error('[Piggyback] Comparison error:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};
