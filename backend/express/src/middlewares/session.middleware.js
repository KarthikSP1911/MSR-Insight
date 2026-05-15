import redisClient from "../config/redis.config.js";

const requireSession = async (req, res, next) => {
    try {
        const sessionId = req.headers["x-session-id"];

        if (!sessionId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No session ID provided"
            });
        }

        const identity = await redisClient.get(`session:${sessionId}`);

        if (!identity) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Invalid or expired session"
            });
        }

        // Extract role and clean ID from identity (e.g., student:1MS24IS400)
        const [role, id] = identity.split(":");

        // Attach to request for later use
        req.user = { usn: id, role: role }; // Standardize on req.user for consistency
        req.userId = id;
        req.userRole = role;

        // Reset expiration
        await redisClient.expire(`session:${sessionId}`, 2592000);
        
        next();
    } catch (error) {
        console.error("[SessionMiddleware Error]", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error during session verification"
        });
    }
};

export const verifySession = requireSession;

export const verifyProctorAccess = async (req, res, next) => {
    await requireSession(req, res, () => {
        if (req.userRole !== 'proctor' && req.userRole !== 'admin') {
            return res.status(403).json({ success: false, message: "Forbidden: Proctor access required" });
        }
        if (req.params.proctorId && req.params.proctorId.toUpperCase() !== req.userId) {
            return res.status(403).json({ success: false, message: "Forbidden: You cannot access another proctor's data" });
        }
        next();
    });
};

export const verifyStudentAccess = async (req, res, next) => {
    await requireSession(req, res, () => {
        // If it's a proctor/admin, allow them to view any student for now
        if (req.userRole === 'proctor' || req.userRole === 'admin') {
            return next();
        }
        // If it's a student, they can only view their own USN
        const targetUsn = req.params.usn || req.body.usn;
        if (req.userRole === 'student' && targetUsn && targetUsn.toUpperCase() !== req.userId) {
            return res.status(403).json({ success: false, message: "Forbidden: You cannot access another student's data" });
        }
        next();
    });
};

export default requireSession;
