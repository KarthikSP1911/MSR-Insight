import prisma from './src/config/db.config.js';

async function check() {
  try {
    const maps = await prisma.proctorStudentMap.findMany();
    console.log('--- Proctor Student Maps ---');
    console.log(JSON.stringify(maps, null, 2));

    const proctors = await prisma.proctor.findMany();
    console.log('--- Proctors ---');
    console.log(JSON.stringify(proctors, null, 2));
    
    const students = await prisma.student.findMany();
    console.log('--- Students ---');
    console.log(JSON.stringify(students, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

check();
