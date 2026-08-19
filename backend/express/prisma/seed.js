import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcrypt";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ACADEMIC_YEAR = "2027";

async function main() {
    console.log("Seeding / cleaning data...");

    const hashedPassword = await bcrypt.hash("password123", 10);

    // Upsert Proctor P000 with a hashed password
    const proctor = await prisma.proctor.upsert({
        where: { proctor_id: "P000" },
        update: { password_hash: hashedPassword, name: "Default Proctor" },
        create: {
            proctor_id: "P000",
            password_hash: hashedPassword,
            name: "Default Proctor",
        },
    });

    console.log(`Proctor seeded: ${proctor.proctor_id}`);

    // Upsert Student 1ms23is051, linked to P000 via ProctorStudentMap
    const student = await prisma.student.upsert({
        where: { usn: "1ms23is051" },
        update: { dob: "2004-11-19" },
        create: {
            usn: "1ms23is051",
            name: "Student One",
            dob: "2004-11-19",
            current_year: 3,
            details: {},
        },
    });

    await prisma.proctorStudentMap.upsert({
        where: {
            student_id_academic_year: {
                student_id: student.usn,
                academic_year: ACADEMIC_YEAR,
            },
        },
        update: { proctor_id: proctor.proctor_id },
        create: {
            proctor_id: proctor.proctor_id,
            student_id: student.usn,
            academic_year: ACADEMIC_YEAR,
        },
    });

    console.log(`Student seeded: ${student.usn} -> Proctor ${proctor.proctor_id}`);

    // Upsert Student 1ms24is400, linked to P000 via ProctorStudentMap
    const student2 = await prisma.student.upsert({
        where: { usn: "1ms24is400" },
        update: { dob: "2005-10-20" },
        create: {
            usn: "1ms24is400",
            name: "Student Two",
            dob: "2005-10-20",
            current_year: 2,
            details: {},
        },
    });

    await prisma.proctorStudentMap.upsert({
        where: {
            student_id_academic_year: {
                student_id: student2.usn,
                academic_year: ACADEMIC_YEAR,
            },
        },
        update: { proctor_id: proctor.proctor_id },
        create: {
            proctor_id: proctor.proctor_id,
            student_id: student2.usn,
            academic_year: ACADEMIC_YEAR,
        },
    });

    console.log(`Student seeded: ${student2.usn} -> Proctor ${proctor.proctor_id}`);

    // Verify the link
    const linked = await prisma.proctor.findUnique({
        where: { proctor_id: "P000" },
        include: {
            student_maps: {
                where: { academic_year: ACADEMIC_YEAR },
                include: { student: { select: { usn: true, dob: true } } },
            },
        },
    });

    console.log("\n--- Verification ---");
    console.log(`Proctor: ${linked.proctor_id}`);
    console.log(
        `Assigned Students:`,
        linked.student_maps.map((m) => m.student)
    );
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
