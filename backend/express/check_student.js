import "dotenv/config";
import prisma from "./src/config/db.config.js";

async function checkStudent() {
  const usn = "1MS23IS051";
  try {
    const student = await prisma.student.findUnique({
      where: { usn: usn.toUpperCase() },
    });

    if (!student) {
      console.log(`[Check] Student ${usn} not found!`);
      return;
    }

    console.log(`[Check] Student: ${student.name} (${student.usn})`);
    console.log(`[Check] Details JSONB present: ${!!student.details}`);
    if (student.details) {
      const details = student.details;
      console.log(`[Check] Top-level keys: ${Object.keys(details).join(", ")}`);
      // check if subjects is directly in details or details.details
      if (details.subjects) {
          console.log(`[Check] Subjects found (count: ${details.subjects.length})`);
      } else if (details.details && details.details.subjects) {
          console.log(`[Check] Subjects found in details.details (count: ${details.details.subjects.length})`);
      } else {
          console.log(`[Check] Subjects NOT found in the expected locations!`);
      }
    }
  } catch (err) {
    console.error(`[Check] Failed:`, err);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudent();
