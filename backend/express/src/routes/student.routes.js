import express from 'express';
import studentService from '../services/studentService.js';

const router = express.Router();

router.post('/sync', async (req, res) => {
    try {
        const studentData = req.body;
        if (!studentData || typeof studentData !== 'object') {
            return res.status(400).json({ error: "Invalid data format. Expected student-keyed object." });
        }

        const results = await studentService.syncStudents(studentData);
        
        const errorCount = results.errors.length;
        const successCount = results.success.length;

        if (errorCount > 0) {
            return res.status(207).json({
                message: `Sync completed with ${errorCount} errors.`,
                successCount,
                errorCount,
                errors: results.errors
            });
        }

        res.status(200).json({
            message: "All students synced successfully.",
            successCount
        });
    } catch (error) {
        console.error("Sync Route Error:", error);
        res.status(500).json({ error: "Internal server error during sync." });
    }
});

export default router;
