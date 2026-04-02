import prisma from "../config/db.config.js";

/**
 * DEPRECATED: This file was used for raw node-postgres pool access.
 * Use Prisma via src/config/db.config.js for all database operations.
 */

export const pool = {
    query: async (text, params) => {
        console.warn("[DEPRECATED] Using raw Postgres pool. Query: " + text.substring(0, 50));
        // Fallback for any missed legacy code
        return { rows: [] };
    }
};

export default pool;
