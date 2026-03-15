import pg from 'pg';
import "dotenv/config";

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const initDb = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        console.log("Creating tables...");
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS students (
                usn VARCHAR(20) PRIMARY KEY,
                name TEXT NOT NULL,
                class_details TEXT,
                cgpa NUMERIC(4,2),
                last_updated TIMESTAMP
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS student_subjects (
                id SERIAL PRIMARY KEY,
                usn VARCHAR(20) REFERENCES students(usn) ON DELETE CASCADE,
                semester INT,
                subject_code VARCHAR(20),
                subject_name TEXT,
                attendance_present INT,
                attendance_absent INT,
                attendance_remaining INT,
                attendance_percentage INT
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS student_assessments (
                id SERIAL PRIMARY KEY,
                student_subject_id INT REFERENCES student_subjects(id) ON DELETE CASCADE,
                assessment_type VARCHAR(10),
                obtained_marks NUMERIC,
                max_marks NUMERIC
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS exam_history_semesters (
                id SERIAL PRIMARY KEY,
                usn VARCHAR(20) REFERENCES students(usn) ON DELETE CASCADE,
                semester_label TEXT NOT NULL,
                sgpa NUMERIC(4,2),
                credits_earned INT
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS exam_history_courses (
                id SERIAL PRIMARY KEY,
                semester_id INT REFERENCES exam_history_semesters(id) ON DELETE CASCADE,
                course_code VARCHAR(20),
                course_name TEXT,
                gpa NUMERIC(3,1),
                grade VARCHAR(10)
            );
        `);

        console.log("Adding constraints...");
        
        // Check if constraint exists before adding for student_subjects
        const subConstraintCheck = await client.query(`
            SELECT 1 FROM pg_constraint WHERE conname = 'unique_student_subject_sem'
        `);
        if (subConstraintCheck.rowCount === 0) {
            await client.query(`
                ALTER TABLE student_subjects
                ADD CONSTRAINT unique_student_subject_sem
                UNIQUE (usn, semester, subject_code);
            `);
        }

        // Check if constraint exists before adding for student_assessments
        const assConstraintCheck = await client.query(`
            SELECT 1 FROM pg_constraint WHERE conname = 'unique_assessment'
        `);
        if (assConstraintCheck.rowCount === 0) {
            await client.query(`
                ALTER TABLE student_assessments
                ADD CONSTRAINT unique_assessment
                UNIQUE (student_subject_id, assessment_type);
            `);
        }

        // Unique constraint for exam_history_semesters
        const examSemConstraintCheck = await client.query(`
            SELECT 1 FROM pg_constraint WHERE conname = 'unique_exam_semester'
        `);
        if (examSemConstraintCheck.rowCount === 0) {
            await client.query(`
                ALTER TABLE exam_history_semesters
                ADD CONSTRAINT unique_exam_semester
                UNIQUE (usn, semester_label);
            `);
        }

        // Unique constraint for exam_history_courses
        const examCourseConstraintCheck = await client.query(`
            SELECT 1 FROM pg_constraint WHERE conname = 'unique_exam_course'
        `);
        if (examCourseConstraintCheck.rowCount === 0) {
            await client.query(`
                ALTER TABLE exam_history_courses
                ADD CONSTRAINT unique_exam_course
                UNIQUE (semester_id, course_code);
            `);
        }

        await client.query('COMMIT');
        console.log("PostgreSQL schema initialized successfully.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Error initializing database:", e);
    } finally {
        client.release();
        await pool.end();
    }
};

initDb();
