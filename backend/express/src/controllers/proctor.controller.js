import proctorRepository from "../repositories/proctor.repository.js";
import axios from "axios";
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
                const filePath = path.join(process.cwd(), '../fastapi/all_students_report.json');
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
            const { proctorId, studentId } = req.params;
            const student = await proctorRepository.getProctee(proctorId, studentId);

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: "Student not found for this proctor",
                });
            }

            // Fetch full details from FastAPI if possible
            let details = {};
            try {
                const response = await axios.get(`http://localhost:8000/reports/${student.usn}`);
                if (response.data) {
                    details = response.data;
                }
            } catch (err) {
                console.error("Failed to fetch details from FastAPI", err.message);
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
