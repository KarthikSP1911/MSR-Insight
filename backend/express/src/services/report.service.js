import axios from "axios";

const FASTAPI_BASE_URL = process.env.FASTAPI_URL || "http://localhost:8000";

/**
 * Fetches AI-generated remarks for a given USN from the FastAPI service.
 * @param {string} usn - The student's USN (hardcoded for now)
 * @returns {Promise<Object>} - { student_detail, ai_remark, meta }
 */
const getRemarkByUSN = async (usn) => {
    const response = await axios.get(`${FASTAPI_BASE_URL}/generate-remark/${usn}`);
    return response.data;
};

/**
 * Fetches the raw normalized dashboard data for a student from FastAPI.
 * @param {string} usn - The student's USN
 * @returns {Promise<Object>} - Student data (courses, grades, sgpa, cgpa)
 */
const getStudentReport = async (usn) => {
    const response = await axios.get(`${FASTAPI_BASE_URL}/api/report/student/${usn}`);
    return response.data?.data;
};

/**
 * Triggers a background scrape on FastAPI to refresh the student's data.
 * @param {string} usn - The student's USN
 * @param {string} dob - The student's Date of Birth (YYYY-MM-DD)
 * @returns {Promise<Object>} - The updated student data
 */
const triggerScrape = async (usn, dob) => {
    const response = await axios.post(`${FASTAPI_BASE_URL}/api/scrape`, {
        usn,
        dob
    });
    return response.data?.data;
};

export { getRemarkByUSN, getStudentReport, triggerScrape };
