import "dotenv/config";
import prisma from "./src/config/db.config.js";

async function check() {
    try {
        const proctors = await prisma.proctor.findMany();
        console.log("Proctors in DB:", JSON.stringify(proctors, null, 2));
        const students = await prisma.user.findMany();
        console.log("Students in DB:", JSON.stringify(students, null, 2));
    } catch (err) {
        console.error("Check failed:", err);
    } finally {
        await prisma.$disconnect();
    }
}

check();
