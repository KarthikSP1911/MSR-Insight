const { getRemarkByUSN } = require("../services/report.service");

// Hardcoded USN for now
const HARDCODED_USN = "1MS24IS400";

const generateReport = async (req, res, next) => {
    try {
        const usn = req.params.usn || HARDCODED_USN;
        const data = await getRemarkByUSN(usn);
        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        // Forward FastAPI error details if available
        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                message: error.response.data?.detail || "FastAPI error",
            });
        }
        next(error);
    }
};

module.exports = { generateReport };