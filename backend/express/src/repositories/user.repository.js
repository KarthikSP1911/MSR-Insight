import prisma from "../config/db.config.js";
import { formatDOB } from "../utils/dateUtils.js";

class UserRepository {
  /**
   * Find student by USN only
   */
  async findByUSN(usn) {
    if (!usn) return null;
    
    // Safety check for prisma client
    if (!prisma || !prisma.student) {
        console.error("[UserRepository] Prisma student model is undefined!");
        throw new Error("Internal Database Initialization Error");
    }

    return await prisma.student.findUnique({
      where: { usn: usn.toUpperCase() },
    });
  }

  /**
   * Find student by USN and DOB
   * Standardized to DD-MM-YYYY format.
   */
  async findByCredentials(usn, dob) {
    if (!usn || !dob) return null;

    if (!prisma || !prisma.student) {
        console.error("[UserRepository] Prisma student model is undefined!");
        throw new Error("Internal Database Initialization Error");
    }

    // Always ensure DOB is in DD-MM-YYYY before querying
    const standardizedDob = formatDOB(dob);

    return await prisma.student.findFirst({
      where: {
        usn: usn.toUpperCase(),
        dob: standardizedDob,
      },
    });
  }

  async create(userData) {
    return await prisma.student.create({
      data: {
        ...userData,
        usn: userData.usn.toUpperCase(),
        // Format DOB before storage
        dob: formatDOB(userData.dob),
        current_year: userData.current_year || 0,
        details: userData.details || {},
      },
    });
  }

  async updateDetails(usn, details) {
    return await prisma.student.update({
      where: { usn: usn.toUpperCase() },
      data: { details },
    });
  }
}

export default new UserRepository();