import pool from '../db/postgres.js';

class StudentService {
    /**
     * Reads a student's full dashboard data from PostgreSQL.
     * Returns null if the student doesn't exist in the students table.
     * @param {string} usn
     * @returns {Promise<Object|null>} Dashboard data in the same shape as scraped data
     */
    async getStudentDashboard(usn) {
        const normalizedUsn = usn.toUpperCase();

        // 1. Check if the student exists in the `students` table
        const studentResult = await pool.query(
            'SELECT usn, name, class_details, cgpa, last_updated, exam_history FROM students WHERE UPPER(usn) = $1',
            [normalizedUsn]
        );

        if (studentResult.rows.length === 0) {
            return null; // Student not found — needs scraping
        }

        const student = studentResult.rows[0];

        // 2. Fetch all subjects for this student
        const subjectsResult = await pool.query(
            `SELECT id, semester, subject_code, subject_name,
                    attendance_present, attendance_absent,
                    attendance_remaining, attendance_percentage
             FROM student_subjects
             WHERE UPPER(usn) = $1
             ORDER BY semester DESC, subject_code ASC`,
            [normalizedUsn]
        );

        // 3. Fetch all assessments for these subjects
        const subjectIds = subjectsResult.rows.map(s => s.id);
        let assessmentsMap = {};

        if (subjectIds.length > 0) {
            const assessmentsResult = await pool.query(
                `SELECT student_subject_id, assessment_type, obtained_marks, max_marks
                 FROM student_assessments
                 WHERE student_subject_id = ANY($1)
                 ORDER BY student_subject_id, assessment_type`,
                [subjectIds]
            );

            // Group assessments by student_subject_id
            for (const assessment of assessmentsResult.rows) {
                const sid = assessment.student_subject_id;
                if (!assessmentsMap[sid]) assessmentsMap[sid] = [];
                assessmentsMap[sid].push({
                    type: assessment.assessment_type,
                    obtained_marks: parseFloat(assessment.obtained_marks),
                    max_marks: parseFloat(assessment.max_marks),
                });
            }
        }

        // 4. Determine the current semester from class_details
        const semMatch = student.class_details ? student.class_details.match(/SEM\s*(\d+)/i) : null;
        const currentSemester = semMatch ? parseInt(semMatch[1]) : 0;

        // 5. Build the current_semester array (matching scraped data format)
        const currentSemSubjects = subjectsResult.rows
            .filter(s => s.semester === currentSemester)
            .map(subject => {
                const assessments = assessmentsMap[subject.id] || [];

                const tests = assessments.map(a => ({
                    test_name: this._assessmentTypeToTestName(a.type),
                    marks_obtained: a.obtained_marks,
                    max_marks: a.max_marks,
                    class_average: 0,
                }));

                return {
                    code: subject.subject_code,
                    name: subject.subject_name,
                    eligibility: "Unknown",
                    attendance_details: {
                        present_classes: subject.attendance_present || 0,
                        absent_classes: subject.attendance_absent || 0,
                        still_to_go: subject.attendance_remaining || 0,
                        classes: { present_dates: [], absent_dates: [] },
                    },
                    cie_details: {
                        tests,
                    },
                };
            });

        // 6. Fetch exam history from PostgreSQL
        const examHistory = await this._getExamHistory(normalizedUsn);

        // 7. Build the response in the same shape the frontend expects
        return {
            name: student.name,
            usn: student.usn,
            class_details: student.class_details,
            cgpa: student.cgpa ? parseFloat(student.cgpa) : null,
            last_updated: student.last_updated
                ? student.last_updated.toISOString().replace('T', ' ').substring(0, 19)
                : null,
            current_semester: currentSemSubjects,
            exam_history: student.exam_history || [],
        };
    }

    /**
     * Reads exam history for a student from PostgreSQL.
     * Returns data in the same shape the frontend expects.
     */
    async _getExamHistory(usn) {
        // This method is now legacy as exam_history is stored as JSONB in students table.
        // Keeping it for potential backward compatibility or if needed by other services.
        const semestersResult = await pool.query(
            `SELECT id, semester_label, sgpa, credits_earned
             FROM exam_history_semesters
             WHERE UPPER(usn) = $1
             ORDER BY id ASC`,
            [usn.toUpperCase()]
        );

        if (semestersResult.rows.length === 0) {
            return [];
        }

        const semesterIds = semestersResult.rows.map(s => s.id);

        const coursesResult = await pool.query(
            `SELECT semester_id, course_code, course_name, gpa, grade
             FROM exam_history_courses
             WHERE semester_id = ANY($1)
             ORDER BY semester_id, id ASC`,
            [semesterIds]
        );

        const coursesMap = {};
        for (const course of coursesResult.rows) {
            const sid = course.semester_id;
            if (!coursesMap[sid]) coursesMap[sid] = [];
            coursesMap[sid].push({
                code: course.course_code,
                name: course.course_name,
                gpa: course.gpa ? String(course.gpa) : "0",
                grade: course.grade,
            });
        }

        return semestersResult.rows.map(sem => ({
            semester: sem.semester_label,
            sgpa: sem.sgpa ? String(sem.sgpa) : "0",
            credits_earned: sem.credits_earned ? String(sem.credits_earned) : "0",
            courses: coursesMap[sem.id] || [],
        }));
    }

    /**
     * Converts normalized assessment type (e.g. "T1") back to the test_name
     * format the frontend expects (e.g. "T 1").
     */
    _assessmentTypeToTestName(type) {
        if (!type) return type;
        const match = type.match(/^([A-Z]+)(\d+)$/);
        if (match) {
            const prefix = match[1];
            const num = match[2];
            if (prefix === 'T') return `T ${num}`;
            if (prefix === 'AQ') return `A/Q ${num}`;
        }
        return type;
    }

    /**
     * Syncs normalized student data from FastAPI into PostgreSQL.
     * This is called by the /api/students/sync endpoint.
     * Now also syncs exam_history if present in the data.
     */
    async syncStudents(studentsData) {
        const results = {
            success: [],
            errors: []
        };

        for (const usn in studentsData) {
            const student = studentsData[usn];
            const client = await pool.connect();

            try {
                await client.query('BEGIN');

                // 1. Upsert student (including exam_history as JSONB)
                await client.query(`
                    INSERT INTO students (usn, name, class_details, cgpa, last_updated, exam_history)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (usn)
                    DO UPDATE SET
                        name = EXCLUDED.name,
                        class_details = EXCLUDED.class_details,
                        cgpa = EXCLUDED.cgpa,
                        last_updated = EXCLUDED.last_updated,
                        exam_history = EXCLUDED.exam_history;
                `, [
                    student.usn,
                    student.name,
                    student.class_details,
                    isNaN(parseFloat(student.cgpa)) ? null : parseFloat(student.cgpa),
                    student.last_updated,
                    JSON.stringify(student.exam_history || [])
                ]);

                // 2. Derive semester from class_details
                const semMatch = student.class_details ? student.class_details.match(/SEM\s*(\d+)/i) : null;
                const semester = semMatch ? parseInt(semMatch[1]) : 0;

                // 3. Process subjects
                if (student.subjects && Array.isArray(student.subjects)) {
                    for (const subject of student.subjects) {
                        const subjectResult = await client.query(`
                            INSERT INTO student_subjects (
                                usn, semester, subject_code, subject_name,
                                attendance_present, attendance_absent,
                                attendance_remaining, attendance_percentage
                            )
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                            ON CONFLICT (usn, semester, subject_code)
                            DO UPDATE SET
                                attendance_present = EXCLUDED.attendance_present,
                                attendance_absent = EXCLUDED.attendance_absent,
                                attendance_remaining = EXCLUDED.attendance_remaining,
                                attendance_percentage = EXCLUDED.attendance_percentage
                            RETURNING id;
                        `, [
                            student.usn,
                            semester,
                            subject.code,
                            subject.name,
                            subject.attendance_details?.present ?? 0,
                            subject.attendance_details?.absent ?? 0,
                            subject.attendance_details?.remaining ?? 0,
                            subject.attendance_details?.percentage ?? (subject.attendance ?? 0)
                        ]);

                        const studentSubjectId = subjectResult.rows[0].id;

                        // 4. Process assessments
                        if (subject.assessments && Array.isArray(subject.assessments)) {
                            for (const assessment of subject.assessments) {
                                await client.query(`
                                    INSERT INTO student_assessments (
                                        student_subject_id, assessment_type,
                                        obtained_marks, max_marks
                                    )
                                    VALUES ($1, $2, $3, $4)
                                    ON CONFLICT (student_subject_id, assessment_type)
                                    DO UPDATE SET
                                        obtained_marks = EXCLUDED.obtained_marks,
                                        max_marks = EXCLUDED.max_marks;
                                `, [
                                    studentSubjectId,
                                    assessment.type,
                                    assessment.obtained_marks,
                                    assessment.max_marks
                                ]);
                            }
                        }
                    }
                }

                // 5. Logic to sync exam_history to separate tables is now removed 
                // as it's stored as JSONB in the students table in step 1.

                await client.query('COMMIT');
                results.success.push(usn);
            } catch (error) {
                await client.query('ROLLBACK');
                console.error(`Error syncing student ${usn}:`, error);
                results.errors.push({ usn, error: error.message });
            } finally {
                client.release();
            }
        }

        return results;
    }
}

const studentService = new StudentService();
export const syncStudents = (data) => studentService.syncStudents(data);
export default studentService;
