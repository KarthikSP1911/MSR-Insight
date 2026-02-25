import redisClient from "../config/redis.config.js";

export const verifySession = async (req, res, next) => {
    try {
        const sessionId = req.headers["x-session-id"];

        if (!sessionId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No session ID provided"
            });
        }

        const userId = await redisClient.get(`session:${sessionId}`);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Invalid or expired session"
            });
        }

        // Attach userId (USN or ProctorID) to request for later use
        req.userId = userId;
        next();
    } catch (error) {
        console.error("[SessionMiddleware Error]", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error during session verification"
        });
    }
};
