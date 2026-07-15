import { jest } from '@jest/globals';

const mockFindUnique = jest.fn();
const mockUpsert = jest.fn();

jest.unstable_mockModule('../../src/config/db.config.js', () => ({
    default: {
        student: {
            findUnique: mockFindUnique,
            upsert: mockUpsert,
        }
    }
}));

const { default: studentService, syncStudents } = await import('../../src/services/student.service.js');

describe('StudentService Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getStudentDashboard', () => {
        it('should return student dashboard data if student exists', async () => {
            const mockData = { usn: '1MS21CS001', name: 'John Doe', details: { cgpa: 9.0 } };
            mockFindUnique.mockResolvedValue(mockData);

            const result = await studentService.getStudentDashboard('1ms21cs001');

            expect(mockFindUnique).toHaveBeenCalledWith({
                where: { usn: '1MS21CS001' },
                select: expect.any(Object),
            });
            expect(result).toEqual(mockData);
        });

        it('should return null if student does not exist', async () => {
            mockFindUnique.mockResolvedValue(null);

            const result = await studentService.getStudentDashboard('1ms21cs001');

            expect(result).toBeNull();
        });
    });

    describe('syncStudents', () => {
        it('should successfully sync students and return success list', async () => {
            const mockData = {
                '1MS21CS001': {
                    name: 'John', dob: '01-01-2000', current_year: 3,
                    cgpa: 9.0, class_details: 'A', last_updated: '2023-01-01', subjects: []
                }
            };

            mockUpsert.mockResolvedValue({});

            const result = await syncStudents(mockData);

            expect(mockUpsert).toHaveBeenCalledTimes(1);
            expect(result.success).toContain('1MS21CS001');
            expect(result.errors.length).toBe(0);
        });

        it('should catch errors during sync and return them in error list', async () => {
            const mockData = {
                '1MS21CS001': {
                    name: 'John', dob: '01-01-2000', current_year: 3,
                }
            };

            mockUpsert.mockRejectedValue(new Error('DB Error'));

            const result = await syncStudents(mockData);

            expect(mockUpsert).toHaveBeenCalledTimes(1);
            expect(result.errors.length).toBe(1);
            expect(result.errors[0].error).toBe('DB Error');
            expect(result.success.length).toBe(0);
        });
    });
});
