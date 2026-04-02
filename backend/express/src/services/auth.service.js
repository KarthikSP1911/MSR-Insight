import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import userRepository from "../repositories/user.repository.js";
import proctorRepository from "../repositories/proctor.repository.js";
import redisClient from "../config/redis.config.js";

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
   * Refactored Student Login:
   * Uses userRepository.findByCredentials to handle both USN and DOB in a single query.
   */
  async login(usn, dob) {
    if (!usn || !dob) {
      throw new Error("USN and Date of Birth are required");
    }

    // Single query check for both USN and DOB
    const user = await userRepository.findByCredentials(usn, dob);

    if (!user) {
      console.warn(`[Student Auth] Failed attempt for ${usn} with DOB ${dob}`);
      throw new Error("Invalid USN or Date of Birth");
    }

    const normalizedUSN = user.usn.toUpperCase();

    // Handle sessions as before
    const sessionId = randomUUID();
    await redisClient.set(`session:${sessionId}`, `student:${normalizedUSN}`, { EX: 2592000 });
    await redisClient.set(`usn:${normalizedUSN}`, sessionId, { EX: 2592000 });

    // Trigger background scrape to update JSONB details if needed/on login
    try {
      const { triggerScrape } = await import("./report.service.js");
      // Fire and forget scrape in background
      triggerScrape(normalizedUSN, dob).catch(e => console.error("[Login Scrape Error]", e.message));
    } catch (e) {
       console.error("[Login Scrape Import Error]", e);
    }

    return { 
      usn: normalizedUSN, 
      sessionId, 
      needsSync: !user.details || Object.keys(user.details).length === 0 
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
    console.log(`[Auth] Proctor login attempt for: ${normalizedId}`);

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