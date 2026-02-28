import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcrypt";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Seeding / cleaning data...");

    const hashedPassword = await bcrypt.hash("password123", 10);

    // Upsert Proctor P000 with a hashed password
    const proctor = await prisma.proctor.upsert({
        where: { proctorId: "P000" },
        update: { password: hashedPassword, name: "Default Proctor" },
        create: {
            proctorId: "P000",
            password: hashedPassword,
            name: "Default Proctor",
        },
    });

    console.log(`Proctor seeded: ${proctor.proctorId} (id: ${proctor.id})`);

    // Delete duplicate uppercase entry if it exists and has no proctor link
    await prisma.user.deleteMany({
        where: {
            usn: "1MS23IS051",
            proctorId: null,
        },
    });
    console.log("Removed stale 1MS23IS051 record (if it existed).");
    await prisma.user.deleteMany({
        where: {
            usn: "1MS24IS400",
            proctorId: null,
        },
    });
    console.log("Removed stale 1MS24IS400 record (if it existed).");
    

    // Upsert Student 1ms23is051 (canonical lowercase) linked to P000
    const student = await prisma.user.upsert({
        where: { usn: "1ms23is051" },
        update: {
            proctorId: proctor.id,
            dob: "2004-11-19",
        },
        create: {
            usn: "1ms23is051",
            dob: "2004-11-19",
            proctorId: proctor.id,
        },
    });
    console.log(`Student seeded: ${student.usn} → Proctor ${proctor.proctorId}`);
    const student2 = await prisma.user.upsert({
        where: { usn: "1ms24is400" },
        update: {
            proctorId: proctor.id,
            dob: "2005-10-20",
        },
        create: {
            usn: "1ms24is400",
            dob: "2005-10-20",
            proctorId: proctor.id,
        },
    });

    console.log(`Student seeded: ${student2.usn} → Proctor ${proctor.proctorId}`);

    // Verify the link
    const linked = await prisma.proctor.findUnique({
        where: { proctorId: "P000" },
        include: { students: { select: { usn: true, dob: true } } },
    });

    console.log("\n--- Verification ---");
    console.log(`Proctor: ${linked.proctorId}`);
    console.log(`Assigned Students:`, linked.students);
    console.log("\nSeeding completed.");
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
