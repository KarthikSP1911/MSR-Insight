import prisma from '../config/db.config.js';

/**
 * Logs a single scrape metric row to the database.
 * 
 * @param {{
 *   usn: string,
 *   strategy: "traditional" | "piggyback",
 *   initiated_at?: Date,
 *   completed_at?: Date,
 *   latency_ms?: number,
 *   freshness_offset_ms?: number,
 *   detected?: boolean,
 *   navigator_webdriver?: boolean,
 *   error_message?: string,
 *   payload_size_bytes?: number
 * }} data
 */
export const logScrapeMetric = async (data) => {
    try {
        await prisma.scrapeMetric.create({
            data: {
                usn: data.usn,
                strategy: data.strategy,
                initiated_at: data.initiated_at || new Date(),
                completed_at: data.completed_at || null,
                latency_ms: data.latency_ms ?? null,
                freshness_offset_ms: data.freshness_offset_ms ?? null,
                detected: data.detected ?? false,
                navigator_webdriver: data.navigator_webdriver ?? null,
                error_message: data.error_message ?? null,
                payload_size_bytes: data.payload_size_bytes ?? null,
            },
        });
        console.log(`[Metrics] Logged ${data.strategy} metric for ${data.usn}`);
    } catch (err) {
        // Metric logging should never crash the main flow
        console.error(`[Metrics] Failed to log metric:`, err.message);
    }
};

/**
 * Retrieves scrape metrics, optionally filtered by strategy.
 * @param {{ strategy?: string, limit?: number }} filter
 */
export const getMetrics = async (filter = {}) => {
    const where = {};
    if (filter.strategy) where.strategy = filter.strategy;

    return prisma.scrapeMetric.findMany({
        where,
        orderBy: { initiated_at: 'desc' },
        take: filter.limit || 100,
    });
};

/**
 * Aggregated comparison stats grouped by strategy.
 * Returns: { traditional: {...}, piggyback: {...} }
 */
export const getComparisonStats = async () => {
    const strategies = ['traditional', 'piggyback'];
    const result = {};

    for (const strategy of strategies) {
        const metrics = await prisma.scrapeMetric.findMany({
            where: { strategy },
        });

        if (metrics.length === 0) {
            result[strategy] = {
                total_runs: 0,
                avg_latency_ms: null,
                detection_rate: null,
                avg_payload_size_bytes: null,
                avg_freshness_offset_ms: null,
            };
            continue;
        }

        const latencies = metrics.filter(m => m.latency_ms !== null).map(m => m.latency_ms);
        const payloads = metrics.filter(m => m.payload_size_bytes !== null).map(m => m.payload_size_bytes);
        const freshness = metrics.filter(m => m.freshness_offset_ms !== null).map(m => m.freshness_offset_ms);
        const detectedCount = metrics.filter(m => m.detected).length;

        const avg = (arr) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

        result[strategy] = {
            total_runs: metrics.length,
            avg_latency_ms: avg(latencies),
            detection_rate: parseFloat((detectedCount / metrics.length).toFixed(4)),
            avg_payload_size_bytes: avg(payloads),
            avg_freshness_offset_ms: avg(freshness),
        };
    }

    return result;
};

export default { logScrapeMetric, getMetrics, getComparisonStats };
