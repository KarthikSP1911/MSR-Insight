import proctorRepository from "../repositories/proctor.repository.js";
import { getNormalizedReport } from "../services/report.service.js";
import fs from "fs/promises";
import path from "path";

class ProctorController {
    async getDashboard(req, res, next) {
        try {
            const { proctorId } = req.params;
            const proctorData = await proctorRepository.getProctees(proctorId);

            if (!proctorData) {
                return res.status(404).json({
                    success: false,
                    message: "Proctor not found",
                });
            }

            // Read scraped data to get display details
            let scrapedData = {};
            try {
                // Adjusting path to point to fastapi directory
                const filePath = path.join(process.cwd(), '../fastapi/data/all_students_report.json');
                const fileContent = await fs.readFile(filePath, 'utf-8');
                scrapedData = JSON.parse(fileContent);
            } catch (err) {
                console.error("Could not read scraped data file", err.message);
            }

            const proctees = proctorData.students.map(student => {
                const details = scrapedData[student.usn.toUpperCase()] || {};
                const classInfo = details.class_details || "";

                // Parse "B.E-IS, SEM 06, SEC A"
                const semMatch = classInfo.match(/SEM\s*(\d+)/i);
                const secMatch = classInfo.match(/SEC\s*(\w+)/i);

                return {
                    id: student.id,
                    usn: student.usn,
                    name: details.name || student.usn,
                    semester: semMatch ? `Sem ${semMatch[1]}` : "N/A",
                    section: secMatch ? `Sec ${secMatch[1]}` : "N/A"
                };
            });

            return res.status(200).json({
                success: true,
                data: proctees,
            });
        } catch (error) {
            next(error);
        }
    }

    async getProctee(req, res, next) {
        try {
            const { proctorId, studentUsn } = req.params;

            const student = await proctorRepository.getProcteeByUsn(proctorId, studentUsn);

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: "Student not found for this proctor",
                });
            }

            // Fetch full details from FastAPI using the centralized report service
            let details = {};
            try {
                const normalizedUsn = student.usn.toUpperCase();
                details = await getNormalizedReport(normalizedUsn);
            } catch (err) {
                console.error(`[ProctorController] Failed to fetch details from AI service for USN ${student.usn}:`, err.message);
                // We continue even if AI service fails, but student details will be empty
            }

            return res.status(200).json({
                success: true,
                data: {
                    ...student,
                    details
                },
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new ProctorController();
