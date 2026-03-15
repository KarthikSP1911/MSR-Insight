import redisClient from "../config/redis.config.js";

const requireSession = async (req, res, next) => {
    const sessionId = req.headers["x-session-id"];

    if (!sessionId) {
        return res.status(401).json({
            success: false,
            message: "No session ID provided",
        });
    }

    try {
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
    } catch (err) {
        console.error("Session middleware error:", err.message);
        return res.status(500).json({
            success: false,
            message: "Session validation failed. Please try again.",
        });
    }
};

export default requireSession;
