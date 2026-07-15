import { jest } from '@jest/globals';

const mockGetProctorsWithStudentCount = jest.fn();
const mockUpsertProctor = jest.fn();
const mockGetCounts = jest.fn();
const mockGetProctorById = jest.fn();
const mockUpsertStudent = jest.fn();
const mockUpsertProctorStudentMap = jest.fn();
const mockHash = jest.fn();

jest.unstable_mockModule('../../src/repositories/admin.repository.js', () => ({
    default: {
        getProctorsWithStudentCount: mockGetProctorsWithStudentCount,
        upsertProctor: mockUpsertProctor,
        getCounts: mockGetCounts,
        getProctorById: mockGetProctorById,
        upsertStudent: mockUpsertStudent,
        upsertProctorStudentMap: mockUpsertProctorStudentMap
    }
}));

jest.unstable_mockModule('bcrypt', () => ({
    default: {
        hash: mockHash
    }
}));

const adminService = (await import('../../src/services/admin.service.js')).default;

describe('Admin Service Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getProctors', () => {
        it('should return mapped proctors with student counts', async () => {
            mockGetProctorsWithStudentCount.mockResolvedValue([
                {
                    proctor_id: 'P1',
                    name: 'John',
                    phone: '123',
                    email: 'a@b.c',
                    student_maps: [1, 2, 3]
                }
            ]);

            const result = await adminService.getProctors('2027');
            expect(result).toHaveLength(1);
            expect(result[0].studentCount).toBe(3);
            expect(result[0].proctorId).toBe('P1');
        });
    });

    describe('addOrUpdateProctor', () => {
        it('should hash password and normalize ID', async () => {
            mockHash.mockResolvedValue('hashed_pwd');
            mockUpsertProctor.mockResolvedValue({ proctor_id: 'P1' });

            await adminService.addOrUpdateProctor('p1', 'pass', 'John', null, null);

            expect(mockHash).toHaveBeenCalledWith('pass', 10);
            expect(mockUpsertProctor).toHaveBeenCalledWith('P1', {
                password_hash: 'hashed_pwd',
                name: 'John',
                phone: null,
                email: null
            });
        });
    });

    describe('getDashboardStats', () => {
        it('should calculate unassigned correctly', async () => {
            mockGetCounts.mockResolvedValue({
                totalProctors: 10,
                totalStudents: 100,
                assignedCount: 80
            });

            const result = await adminService.getDashboardStats('2027');
            expect(result.unassignedCount).toBe(20);
            expect(result.totalProctors).toBe(10);
        });

        it('should not return negative unassigned counts', async () => {
            mockGetCounts.mockResolvedValue({
                totalProctors: 10,
                totalStudents: 100,
                assignedCount: 120 // Data anomaly
            });

            const result = await adminService.getDashboardStats('2027');
            expect(result.unassignedCount).toBe(0);
        });
    });

    describe('assignStudentToProctor', () => {
        it('should throw error if proctor not found', async () => {
            mockGetProctorById.mockResolvedValue(null);

            await expect(adminService.assignStudentToProctor('P1', { usn: '1MS21CS001' }, '2027'))
                .rejects.toThrow('Proctor not found');
        });

        it('should assign student correctly', async () => {
            mockGetProctorById.mockResolvedValue({ proctor_id: 'P1' });
            mockUpsertStudent.mockResolvedValue(true);
            mockUpsertProctorStudentMap.mockResolvedValue({ success: true });

            const result = await adminService.assignStudentToProctor('p1', { usn: '1ms21cs001' }, '2027');

            expect(mockUpsertStudent).toHaveBeenCalledWith('1MS21CS001', { usn: '1ms21cs001' });
            expect(mockUpsertProctorStudentMap).toHaveBeenCalledWith('P1', '1MS21CS001', '2027');
            expect(result.success).toBe(true);
        });
    });
});
