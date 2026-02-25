import prisma from "../config/db.config.js";

class UserRepository {
  async findByUSN(usn) {
    return await prisma.user.findFirst({
      where: { usn: { equals: usn, mode: "insensitive" } },
    });
  }

  async create(userData) {
    return await prisma.user.create({ data: userData });
  }
}

export default new UserRepository();