/**
 * Utility for parsing deeply nested student data structures from the Postgres JSONB schema.
 */
export const extractReportInputData = (dashboardData) => {
    if (!dashboardData) return null;

    let reportInputData = null;

    if (dashboardData.details && Array.isArray(dashboardData.details.subjects)) {
        reportInputData = dashboardData.details;
    } else if (Array.isArray(dashboardData.subjects)) {
        reportInputData = dashboardData;
    } else if (dashboardData.details && dashboardData.details.details && Array.isArray(dashboardData.details.details.subjects)) {
        // Handle double-nested edge case from some scraping versions
        reportInputData = dashboardData.details.details;
    }

    if (reportInputData) {
        // JSONB details omit duplicate identity fields; FastAI expects name/usn on the payload.
        reportInputData = {
            ...reportInputData,
            name: reportInputData.name ?? dashboardData.name,
            usn: reportInputData.usn ?? dashboardData.usn,
        };
    }

    return reportInputData;
};
