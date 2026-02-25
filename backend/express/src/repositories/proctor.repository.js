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
        return await prisma.proctor.findFirst({
            where: {
                proctorId: { equals: proctorId, mode: 'insensitive' }
            },
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
        return await prisma.user.findFirst({
            where: {
                id: studentId,
                proctor: {
                    proctorId: { equals: proctorId, mode: 'insensitive' }
                }
            }
        });
    }

    async getProcteeByUsn(proctorId, usn) {
        return await prisma.user.findFirst({
            where: {
                usn: { equals: usn, mode: 'insensitive' },
                proctor: {
                    proctorId: { equals: proctorId, mode: 'insensitive' }
                }
            }
        });
    }
}

export default new ProctorRepository();
