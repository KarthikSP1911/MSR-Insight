export class DataNormalizer {
    static standardizeAssessmentType(rawName) {
        if (!rawName) return "";
        const name = rawName.toUpperCase().trim();
        
        if (/T\s*1/.test(name) || name === "T1") return "T1";
        if (/T\s*2/.test(name) || name === "T2") return "T2";
        if (/T\s*3/.test(name) || name === "T3") return "T3";
        if (/T\s*4/.test(name) || name === "T4") return "T4";
        
        if (/A\/Q\s*1/.test(name) || /AQ\s*1/.test(name)) return "AQ1";
        if (/A\/Q\s*2/.test(name) || /AQ\s*2/.test(name)) return "AQ2";
        if (/A\/Q\s*3/.test(name) || /AQ\s*3/.test(name)) return "AQ3";
            
        if (name.includes("FINAL") && name.includes("CIE")) {
            return "FINAL CIE";
        }
            
        return "";
    }

    static isValidNumeric(val) {
        if (val === null || val === undefined) return false;
        if (typeof val === 'number') return !isNaN(val);
        if (typeof val === 'string') {
            const cleanVal = val.trim();
            if (cleanVal === "" || cleanVal === "-" || cleanVal === " - ") return false;
            const parsed = parseFloat(cleanVal);
            return !isNaN(parsed);
        }
        return false;
    }

    static normalizeStudentRecord(scrapedRecord) {
        const currentSem = scrapedRecord.current_semester || [];
        const normalizedSubjects = [];

        for (const entry of currentSem) {
            const subjectCode = entry.code || "N/A";
            const subjectName = entry.name || "Unknown Subject";
            
            // Attendance Object
            const attDetails = entry.attendance_details || {};
            const present = parseInt(attDetails.present_classes || 0, 10);
            const absent = parseInt(attDetails.absent_classes || 0, 10);
            const remaining = parseInt(attDetails.still_to_go || 0, 10);
            
            const classesDetails = attDetails.classes || {};
            const presentDates = classesDetails.present_dates || [];
            const absentDates = classesDetails.absent_dates || [];
            
            const total = present + absent;
            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
            
            const attendanceObj = {
                present,
                absent,
                remaining,
                percentage,
                present_dates: presentDates,
                absent_dates: absentDates
            };
            
            // Assessments
            const cieDetails = entry.cie_details || {};
            const rawTests = cieDetails.tests || [];
            const assessments = [];

            for (const t of rawTests) {
                const stdType = this.standardizeAssessmentType(t.test_name || "");
                if (!stdType) continue;
                
                const obtained = t.marks_obtained;
                const classAvg = t.class_average || 0;
                
                if (!this.isValidNumeric(obtained)) continue;
                
                const obtainedVal = parseFloat(obtained);
                const classAvgVal = this.isValidNumeric(classAvg) ? parseFloat(classAvg) : 0.0;
                
                assessments.push({
                    type: stdType,
                    obtained_marks: obtainedVal,
                    class_average: classAvgVal
                });
            }
            
            // Calculate Total Marks
            const getVal = (tType) => {
                const a = assessments.find(x => x.type === tType);
                if (a) {
                    const val = parseFloat(a.obtained_marks);
                    return !isNaN(val) ? val : 0.0;
                }
                return 0.0;
            };

            const valT1 = getVal("T1");
            const valT2 = getVal("T2");
            const valAq1 = getVal("AQ1");
            const valAq2 = getVal("AQ2");

            const testAvg = (valT1 > 0 && valT2 > 0) ? Math.round((valT1 + valT2) / 2) : Math.max(valT1, valT2);
            const totalMarks = testAvg + valAq1 + valAq2;
            
            normalizedSubjects.push({
                code: String(subjectCode),
                name: String(subjectName),
                marks: totalMarks,
                attendance: percentage,
                attendance_details: attendanceObj,
                assessments: assessments
            });
        }

        const classDetails = scrapedRecord.class_details || "";
        const currentYear = DataNormalizer.deriveCurrentYearFromClassDetails(classDetails);

        return {
            usn: scrapedRecord.usn,
            name: scrapedRecord.name,
            class_details: scrapedRecord.class_details,
            cgpa: scrapedRecord.cgpa,
            last_updated: scrapedRecord.last_updated,
            current_year: currentYear,
            subjects: normalizedSubjects,
            exam_history: scrapedRecord.exam_history || []
        };
    }

    /** B.E. programme: year = ceil(semester / 2), e.g. SEM 06 → year 3 */
    static deriveCurrentYearFromClassDetails(classDetails) {
        if (!classDetails || typeof classDetails !== "string") return 0;
        const m = classDetails.match(/\bSEM\s*0*(\d+)\b/i);
        if (!m) return 0;
        const sem = parseInt(m[1], 10);
        if (Number.isNaN(sem) || sem <= 0) return 0;
        return Math.ceil(sem / 2);
    }
}
