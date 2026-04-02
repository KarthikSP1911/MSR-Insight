/**
 * Date Utilities for Smart-Report-Generator
 */

/**
 * Standardizes any date input into the DD-MM-YYYY format used by the database and portal.
 * @param {string} dob - The date of birth (could be YYYY-MM-DD or DD-MM-YYYY)
 * @returns {string} - Date in DD-MM-YYYY format
 */
export const formatDOB = (dob) => {
    if (!dob) return dob;
    
    // If it's already in DD-MM-YYYY format, return it
    if (/^\d{2}-\d{2}-\d{4}$/.test(dob)) {
        return dob;
    }
    
    // If it's in YYYY-MM-DD format (standard HTML date input), convert it
    if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
        const [year, month, day] = dob.split("-");
        return `${day}-${month}-${year}`;
    }
    
    return dob;
};

/**
 * Converts a DD-MM-YYYY date back to YYYY-MM-DD for HTML input compatibility.
 * @param {string} dob - Date in DD-MM-YYYY format
 * @returns {string} - Date in YYYY-MM-DD format
 */
export const toInputDate = (dob) => {
    if (!dob || !/^\d{2}-\d{2}-\d{4}$/.test(dob)) return dob;
    const [day, month, year] = dob.split("-");
    return `${year}-${month}-${day}`;
};
