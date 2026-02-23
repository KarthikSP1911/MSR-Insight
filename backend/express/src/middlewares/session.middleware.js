import redisClient from "../config/redis.config.js";

const requireSession = async (req, res, next) => {
    const sessionId = req.headers["x-session-id"];

    if (!sessionId) {
        return res.status(401).json({
            success: false,
            message: "No session ID provided",
        });
    }

    const usn = await redisClient.get(`session:${sessionId}`);

    if (!usn) {
        return res.status(401).json({
            success: false,
            message: "Session expired or invalid. Please log in again.",
        });
    }

    await redisClient.expire(`session:${sessionId}`, 2592000);

    req.user = { usn };
    next();
};

export default requireSession;
