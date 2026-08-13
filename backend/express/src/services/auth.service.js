import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import userRepository from "../repositories/user.repository.js";
import proctorRepository from "../repositories/proctor.repository.js";
import redisClient from "../config/redis.config.js";
import logger from '../utils/logger.js';
import studentService from "./student.service.js";
import { decryptText } from "../utils/crypto.js";

class AuthService {
  async register(usn, dob) {
    const existingUser = await userRepository.findByUSN(usn);

    if (existingUser) {
      throw new Error("User already exists");
    }

    const normalizedUSN = usn.toUpperCase();
    await userRepository.create({
      usn: normalizedUSN,
      dob, // Standardized as DD-MM-YYYY in backend/frontend
      current_year: 1,
      details: {},
    });

    const sessionId = randomUUID();
    await redisClient.set(`session:${sessionId}`, `student:${normalizedUSN}`, { EX: 2592000 });
    await redisClient.set(`usn:${normalizedUSN}`, sessionId, { EX: 2592000 });

    return { usn: normalizedUSN, sessionId };
  }

  /**
   * Student Login with Secondary Verification Layer:
   * Supports stage 2 Father/Mother Mobile or ABC ID 4-digit PIN verification.
   */
  async login(usn, dob, authType, last4Digits, forceResync = false) {
    if (!usn || !dob) {
      throw new Error("USN and Date of Birth are required");
    }

    const normalizedUSN = usn.toUpperCase();
    let user = await userRepository.findByCredentials(normalizedUSN, dob);
    let existingStudent = await studentService.getStudentDashboard(normalizedUSN);

    const hasStoredPin = Boolean(existingStudent?.encrypted_pin || existingStudent?.details?.encrypted_pin);
    const hasNewPinProvided = Boolean(last4Digits);

    // Instant Login ONLY if student exists, has details, HAS a stored PIN, forceResync is false, and no new PIN was provided to update
    if (user && existingStudent && existingStudent.details && Object.keys(existingStudent.details).length > 0 && hasStoredPin && !forceResync && !hasNewPinProvided) {
      const sessionId = randomUUID();
      await redisClient.set(`session:${sessionId}`, `student:${normalizedUSN}`, { EX: 2592000 });
      await redisClient.set(`usn:${normalizedUSN}`, sessionId, { EX: 2592000 });
      return { usn: normalizedUSN, sessionId };
    }

    // Determine secondary verification details
    let targetAuthType = authType || existingStudent?.auth_type || existingStudent?.details?.auth_type;
    let targetPin = last4Digits;

    if (!targetPin && (existingStudent?.encrypted_pin || existingStudent?.details?.encrypted_pin)) {
      targetPin = decryptText(existingStudent.encrypted_pin || existingStudent.details.encrypted_pin);
    }

    // If PIN or auth method is missing, prompt frontend for secondary details
    if (!targetPin || !targetAuthType) {
      logger.info(`[Student Auth] USN ${normalizedUSN} not found in DB (or re-syncing). Requesting secondary auth parameters...`);
      return {
        requiresSecondaryAuth: true,
        message: "First-time login or PIN update requires secondary portal verification details (Father/Mother Mobile or ABC ID last 4 digits)."
      };
    }

    logger.warn(`[Student Auth] Scraping portal for ${normalizedUSN} using secondary credentials...`);
    try {
      const { scrapeAndSyncStudent } = await import("./puppeteerScraper.service.js");
      await scrapeAndSyncStudent(normalizedUSN, dob, targetAuthType, targetPin);
      
      user = await userRepository.findByCredentials(normalizedUSN, dob);
      if (!user) {
        throw new Error("Failed to retrieve student records from portal after scraping.");
      }
    } catch (err) {
      logger.error(`[Student Auth] Scraping failed for ${normalizedUSN}: ${err.message}`);
      throw new Error(err.message || "Invalid credentials or unable to fetch records from portal.");
    }

    const sessionId = randomUUID();
    await redisClient.set(`session:${sessionId}`, `student:${normalizedUSN}`, { EX: 2592000 });
    await redisClient.set(`usn:${normalizedUSN}`, sessionId, { EX: 2592000 });

    return { 
      usn: normalizedUSN, 
      sessionId, 
      needsSync: false 
    };
  }

  async proctorRegister(proctorId, password, name, phone, email) {
    const normalizedId = proctorId.toUpperCase();
    const existing = await proctorRepository.findByProctorId(normalizedId);
    if (existing) {
      const err = new Error("Proctor already exists");
      err.statusCode = 409;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return await proctorRepository.create({
      proctor_id: normalizedId,
      password_hash: hashedPassword,
      name,
      phone,
      email,
    });
  }

  async proctorLogin(proctorId, password) {
    const normalizedId = proctorId.toUpperCase();
    logger.info(`[Auth] Proctor login attempt for: ${normalizedId}`);

    const proctor = await proctorRepository.findByProctorId(normalizedId);

    if (!proctor) {
      const err = new Error("Proctor not found");
      err.statusCode = 404;
      throw err;
    }

    const passwordValid = await bcrypt.compare(password, proctor.password_hash);

    if (!passwordValid) {
      const err = new Error("Invalid Proctor ID or Password");
      err.statusCode = 401;
      throw err;
    }

    const existingSessionId = await redisClient.get(`proctor:${normalizedId}`);
    if (existingSessionId) {
      await redisClient.expire(`session:${existingSessionId}`, 2592000);
      return { proctorId: normalizedId, sessionId: existingSessionId };
    }

    const sessionId = randomUUID();
    await redisClient.set(`session:${sessionId}`, `proctor:${normalizedId}`, { EX: 2592000 });
    await redisClient.set(`proctor:${normalizedId}`, sessionId, { EX: 2592000 });

    return { proctorId: normalizedId, sessionId };
  }

  async logout(sessionId) {
    const identity = await redisClient.get(`session:${sessionId}`);
    if (identity) {
      const [role, id] = identity.split(":");
      if (role === 'student') {
        await redisClient.del(`usn:${id}`);
      } else if (role === 'proctor') {
        await redisClient.del(`proctor:${id}`);
      }
    }
    await redisClient.del(`session:${sessionId}`);
  }

  async getProfile(sessionId) {
    const identity = await redisClient.get(`session:${sessionId}`);
    if (!identity) {
      const err = new Error("Session expired or invalid");
      err.statusCode = 401;
      throw err;
    }

    const [role, id] = identity.split(":");

    if (role === 'student') {
      const user = await userRepository.findByUSN(id);
      if (!user) throw new Error("Student not found");
      return { ...user, role: 'student' };
    } else if (role === 'proctor') {
      const proctor = await proctorRepository.findByProctorId(id);
      if (!proctor) throw new Error("Proctor not found");
      const { password_hash, ...proctorData } = proctor;
      return { ...proctorData, role: 'proctor' };
    }

    throw new Error("Invalid identity type");
  }
}

export default new AuthService();