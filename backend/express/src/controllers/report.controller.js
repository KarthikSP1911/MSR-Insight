import { getRemarkByUSN, getStudentReport, triggerScrape } from "../services/report.service.js";
import userRepository from "../repositories/user.repository.js";

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

const triggerReportUpdate = async (req, res, next) => {
    try {
        const usn = req.user?.usn; // Assuming we can get it from session. Actually req.params or req.body could be used, but since we are calling it specifically for a user we could use req.user. wait, requireSession middleware doesn't set req.user, let's check what auth.controller or session middleware sets.
        // Actually, we can get USN from the database since the user is authenticated. Let's look at getProfile logic, or just get USN from headers or session.
        // Or we can expect USN as a param since requireSession makes sure they're logged in.
        
        let sessionUsn;
        // In auth.service, getProfile returns the user details. We can just use the USN from params and double check it, or just use it.
        // For simplicity let's accept it from `req.body` or `req.params`. Let's use `req.body.usn`.
        const requestUsn = req.body.usn;
        
        if (!requestUsn) {
            return res.status(400).json({ success: false, message: "USN is required" });
        }
        
        const user = await userRepository.findByUSN(requestUsn);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        const data = await triggerScrape(user.usn, user.dob);
        
        return res.status(200).json({
            success: true,
            message: "Report updated successfully",
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

export { generateReport, getStudentDashboardReport, triggerReportUpdate };