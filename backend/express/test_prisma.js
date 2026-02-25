import "dotenv/config";
import prisma from "./src/config/db.config.js";

async function test() {
    try {
        console.log("Testing findByProctorId...");
        const p1 = await prisma.proctor.findFirst({
            where: { proctorId: { equals: "P000", mode: "insensitive" } },
        });
        console.log("Result:", p1 ? "Found" : "Not Found");

        console.log("Testing getProctees...");
        const p2 = await prisma.proctor.findFirst({
            where: { proctorId: { equals: "P000", mode: "insensitive" } },
            include: { students: true }
        });
        console.log("Result:", p2 ? `Found ${p2.students.length} students` : "Not Found");

    } catch (err) {
        console.error("Query Failed:", err.message);
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

test();
