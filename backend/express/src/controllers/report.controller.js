import { getRemarkByUSN, getStudentReport } from "../services/report.service.js";

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
        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                message: error.response.data?.detail || "FastAPI error",
            });
        }
        next(error);
    }
};

const getStudentDashboardReport = async (req, res, next) => {
    try {
        const usn = req.params.usn;
        const data = await getStudentReport(usn);
        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                message: error.response.data?.detail || "FastAPI error",
            });
        }
        next(error);
    }
};

export { generateReport, getStudentDashboardReport };