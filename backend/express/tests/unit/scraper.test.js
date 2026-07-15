import { DataNormalizer } from '../../src/services/scraper/dataNormalizer.js';
import * as htmlParser from '../../src/services/scraper/htmlParser.js';
import * as cheerio from 'cheerio';

describe('DataNormalizer Tests', () => {
    describe('standardizeAssessmentType', () => {
        it('should correctly standardize assessment names', () => {
            expect(DataNormalizer.standardizeAssessmentType('T 1')).toBe('T1');
            expect(DataNormalizer.standardizeAssessmentType('T2 ')).toBe('T2');
            expect(DataNormalizer.standardizeAssessmentType('A/Q 1')).toBe('AQ1');
            expect(DataNormalizer.standardizeAssessmentType('AQ2')).toBe('AQ2');
            expect(DataNormalizer.standardizeAssessmentType('FINAL CIE')).toBe('FINAL CIE');
            expect(DataNormalizer.standardizeAssessmentType('Unknown Type')).toBe('');
            expect(DataNormalizer.standardizeAssessmentType(null)).toBe('');
        });
    });

    describe('isValidNumeric', () => {
        it('should correctly identify valid numerics', () => {
            expect(DataNormalizer.isValidNumeric(10)).toBe(true);
            expect(DataNormalizer.isValidNumeric(0)).toBe(true);
            expect(DataNormalizer.isValidNumeric('15.5')).toBe(true);
            expect(DataNormalizer.isValidNumeric('-')).toBe(false);
            expect(DataNormalizer.isValidNumeric(' - ')).toBe(false);
            expect(DataNormalizer.isValidNumeric('')).toBe(false);
            expect(DataNormalizer.isValidNumeric(null)).toBe(false);
            expect(DataNormalizer.isValidNumeric(undefined)).toBe(false);
        });
    });

    describe('deriveCurrentYearFromClassDetails', () => {
        it('should derive correct year from sem string', () => {
            expect(DataNormalizer.deriveCurrentYearFromClassDetails('B.E. SEM 06 SECTION A')).toBe(3);
            expect(DataNormalizer.deriveCurrentYearFromClassDetails('SEM 1')).toBe(1);
            expect(DataNormalizer.deriveCurrentYearFromClassDetails('SEM 08')).toBe(4);
            expect(DataNormalizer.deriveCurrentYearFromClassDetails('SEM 05')).toBe(3);
            expect(DataNormalizer.deriveCurrentYearFromClassDetails('Invalid details')).toBe(0);
        });
    });

    describe('normalizeStudentRecord', () => {
        it('should normalize raw scraped data correctly', () => {
            const raw = {
                usn: '1MS21CS001',
                name: 'John Doe',
                class_details: 'B.E. SEM 06',
                cgpa: '9.2',
                current_semester: [
                    {
                        code: 'CS601',
                        name: 'Software Engineering',
                        attendance_details: {
                            present_classes: 30,
                            absent_classes: 10,
                            still_to_go: 5,
                            classes: { present_dates: [], absent_dates: [] }
                        },
                        cie_details: {
                            tests: [
                                { test_name: 'T 1', marks_obtained: '25', class_average: '20' },
                                { test_name: 'T 2', marks_obtained: '28', class_average: '21' },
                                { test_name: 'A/Q 1', marks_obtained: '9', class_average: '8' }
                            ]
                        }
                    }
                ],
                exam_history: []
            };

            const result = DataNormalizer.normalizeStudentRecord(raw);
            
            expect(result.usn).toBe('1MS21CS001');
            expect(result.current_year).toBe(3);
            expect(result.subjects.length).toBe(1);
            
            const subj = result.subjects[0];
            expect(subj.code).toBe('CS601');
            expect(subj.attendance).toBe(75); // 30 / (30+10) * 100
            
            // Total marks = max/avg of T1 and T2 + AQ1 + AQ2.
            // Avg(25, 28) = Math.round(53/2) = 27. + AQ1(9) = 36.
            expect(subj.marks).toBe(36);
        });
    });
});

describe('htmlParser Tests', () => {
    describe('extractChartDataJsonArray', () => {
        it('should extract JSON from script tags', () => {
            const html = `
                <script>
                    var chartData = [{"xaxis":"T 1","col1":22.5,"col2":30,"linevalue":28},{"xaxis":"T 2","col1":24,"col2":30,"linevalue":29}];
                </script>
            `;
            const result = htmlParser.extractChartDataJsonArray(html);
            expect(result).toBe(`[{"xaxis":"T 1","col1":22.5,"col2":30,"linevalue":28},{"xaxis":"T 2","col1":24,"col2":30,"linevalue":29}]`);
        });

        it('should return null if no chartData found', () => {
            expect(htmlParser.extractChartDataJsonArray('<div>Hello</div>')).toBeNull();
        });
    });

    describe('extractCourseRowsFromDashboard', () => {
        it('should extract course rows correctly', () => {
            const html = `
                <table class="dash_od_row">
                    <tbody>
                        <tr>
                            <td>CS601(4)</td>
                            <td>Software Engineering</td>
                            <td><a href="index.php?task=attendencelist&id=1">Att</a></td>
                            <td><a href="index.php?task=ciedetails&id=1">CIE</a></td>
                        </tr>
                    </tbody>
                </table>
            `;
            const $ = cheerio.load(html);
            const courses = htmlParser.extractCourseRowsFromDashboard($);
            expect(courses.length).toBe(1);
            expect(courses[0].code).toBe('CS601');
            expect(courses[0].name).toBe('Software Engineering');
            expect(courses[0].attLink).toBe('index.php?task=attendencelist&id=1');
        });
    });
});
