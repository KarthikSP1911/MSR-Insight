import prisma from "../config/db.config.js";

class ProctorRepository {
    async findByProctorId(proctorId) {
        return await prisma.proctor.findUnique({
            where: { proctorId },
        });
    }

    async create(data) {
        return await prisma.proctor.create({
            data,
        });
    }

    async getProctees(proctorId) {
        const normalizedId = proctorId.toUpperCase();
        return await prisma.proctor.findUnique({
            where: { proctorId: normalizedId },
            include: {
                students: {
                    select: {
                        id: true,
                        usn: true,
                        dob: true,
                    }
                }
            }
        });
    }

    async getProctee(proctorId, studentId) {
        const normalizedId = proctorId.toUpperCase();
        return await prisma.user.findFirst({
            where: {
                id: studentId,
                proctor: {
                    proctorId: normalizedId
                }
            }
        });
    }
}

export default new ProctorRepository();
