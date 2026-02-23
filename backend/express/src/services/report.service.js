const axios = require("axios");

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

module.exports = { getRemarkByUSN };
