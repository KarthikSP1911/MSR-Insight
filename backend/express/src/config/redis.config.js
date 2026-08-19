import "dotenv/config";
import { createClient } from "redis";
import logger from '../utils/logger.js';

const useTls = (process.env.REDIS_URL || "").startsWith("rediss://");

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: useTls ? { tls: true, rejectUnauthorized: false } : {},
});

redisClient.on("connect", () => {
  logger.info("Redis Connected");
});

redisClient.on("error", (err) => {
  logger.error("Redis Error:", err);
});

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    logger.error("Redis Connection Failed:", err);
  }
})();

export default redisClient;