import prisma from "../config/db.config.js";
import logger from '../utils/logger.js';
import { encryptText } from '../utils/crypto.js';

class StudentService {
  /**
   * Reads a student's full data record including top level columns and JSONB details.
   * @param {string} usn
   * @returns {Promise<Object|null>} Student record
   */
  async getStudentDashboard(usn) {
    const normalizedUsn = usn.toUpperCase();

    const student = await prisma.student.findUnique({
      where: { usn: normalizedUsn },
      select: {
          usn: true,
          name: true,
          dob: true,
          phone: true,
          email: true,
          current_year: true,
          auth_type: true,
          encrypted_pin: true,
          details: true,
      }
    });

    if (!student) {
      return null;
    }

    return student;
  }

  /**
   * Syncs student data from Scraper/FastAPI as columns and JSON blob.
   * Handles UPSERT logic directly into PostgreSQL.
   */
  async syncStudents(studentsData) {
    const results = {
      success: [],
      errors: [],
    };

    for (const usn in studentsData) {
      const studentData = studentsData[usn];
      const normalizedUsn = usn.toUpperCase();

      try {
        const existingStudent = await prisma.student.findUnique({
          where: { usn: normalizedUsn },
          select: { details: true, auth_type: true, encrypted_pin: true }
        });
        const existingDetails = existingStudent?.details || {};

        let authType = studentData.auth_type || existingStudent?.auth_type || existingDetails.auth_type || null;
        let encryptedPin = existingStudent?.encrypted_pin || existingDetails.encrypted_pin || null;

        if (studentData.last4Digits || studentData.pin) {
          const plainPin = String(studentData.last4Digits || studentData.pin);
          encryptedPin = encryptText(plainPin);
        } else if (studentData.encrypted_pin) {
          encryptedPin = studentData.encrypted_pin;
        }

        const detailsPayload = {
          cgpa: studentData.cgpa,
          class_details: studentData.class_details,
          last_updated: studentData.last_updated,
          subjects: studentData.subjects,
          exam_history: studentData.exam_history || [],
          placement: studentData.placement || existingDetails.placement || null,
          auth_type: authType,
          encrypted_pin: encryptedPin,
        };

        await prisma.student.upsert({
          where: { usn: normalizedUsn },
          update: {
            name: studentData.name,
            dob: studentData.dob,
            auth_type: authType,
            encrypted_pin: encryptedPin,
            details: detailsPayload,
            current_year: studentData.current_year || 0,
          },
          create: {
            usn: normalizedUsn,
            name: studentData.name,
            dob: studentData.dob,
            auth_type: authType,
            encrypted_pin: encryptedPin,
            details: detailsPayload,
            current_year: studentData.current_year || 0,
          },
        });
        results.success.push(normalizedUsn);
      } catch (error) {
        logger.error(`Error syncing student ${normalizedUsn}:`, error.message);
        results.errors.push({ usn: normalizedUsn, error: error.message });
      }
    }

    return results;
  }
}

const studentService = new StudentService();
export const syncStudents = (data) => studentService.syncStudents(data);
export default studentService;
