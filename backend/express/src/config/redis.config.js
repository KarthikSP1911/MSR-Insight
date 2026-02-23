import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: true,
    rejectUnauthorized: false,
  },
});

redisClient.on("connect", () => {
  console.log("Redis Connected");
});

redisClient.on("error", (err) => {
  console.error("Redis Error:", err);
});

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("Redis Connection Failed:", err);
  }
})();

export default redisClient;