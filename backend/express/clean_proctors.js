import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Deep cleaning proctor records...");

    // Find all proctors
    const proctors = await prisma.proctor.findMany();

    for (const p of proctors) {
        if (p.proctorId === "p000") {
            console.log(`Found lowercase p000 (id: ${p.id}). Deleting...`);
            // First check if it has students (it shouldn't if my seed worked correctly on P000)
            const students = await prisma.user.findMany({ where: { proctorId: p.id } });
            if (students.length > 0) {
                console.log(`Warning: p000 has students! Re-linking them to P000...`);
                const P000 = proctors.find(pr => pr.proctorId === "P000");
                if (P000) {
                    await prisma.user.updateMany({
                        where: { proctorId: p.id },
                        data: { proctorId: P000.id }
                    });
                }
            }
            await prisma.proctor.delete({ where: { id: p.id } });
            console.log("Deleted p000.");
        }
    }

    console.log("Cleanup finished.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
