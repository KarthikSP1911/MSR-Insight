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

    await userRepository.create({ username: usn, dob });

    const sessionId = randomUUID();
    await redisClient.set(`session:${sessionId}`, usn, { EX: 2592000 });
    await redisClient.set(`usn:${usn}`, sessionId, { EX: 2592000 });

    return { usn, sessionId };
  }

  async login(usn, dob) {
    const user = await userRepository.findByUSN(usn);

    if (!user || user.dob !== dob) {
      throw new Error("Invalid USN or Date of Birth");
    }

    const existingSessionId = await redisClient.get(`usn:${usn}`);
    if (existingSessionId) {
      await redisClient.expire(`session:${existingSessionId}`, 2592000);
      return { usn, sessionId: existingSessionId };
    }

    const sessionId = randomUUID();
    await redisClient.set(`session:${sessionId}`, usn, { EX: 2592000 });
    await redisClient.set(`usn:${usn}`, sessionId, { EX: 2592000 });

    return { usn, sessionId };
  }

  async proctorRegister(proctorId, password, name) {
    const normalizedId = proctorId.toUpperCase();
    const existing = await proctorRepository.findByProctorId(normalizedId);
    if (existing) {
      const err = new Error("Proctor already exists");
      err.statusCode = 409;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return await proctorRepository.create({
      proctorId: normalizedId,
      password: hashedPassword,
      name,
    });
  }

  async proctorLogin(proctorId, password) {
    const normalizedId = proctorId.toUpperCase();
    console.log(`[Auth] Proctor login attempt for: ${normalizedId}`);

    const proctor = await proctorRepository.findByProctorId(normalizedId);

    if (!proctor) {
      console.warn(`[Auth] Proctor not found: ${proctorId}`);
      const err = new Error("Proctor not found");
      err.statusCode = 404;
      throw err;
    }

    // Support both bcrypt hashed and legacy plaintext passwords
    let passwordValid = false;
    if (proctor.password.startsWith("$2b$") || proctor.password.startsWith("$2a$")) {
      passwordValid = await bcrypt.compare(password, proctor.password);
    } else {
      passwordValid = proctor.password === password;
    }

    if (!passwordValid) {
      console.warn(`[Auth] Invalid password for proctor: ${proctorId}`);
      const err = new Error("Invalid Proctor ID or Password");
      err.statusCode = 401;
      throw err;
    }

    // Reuse existing session or create new
    const existingSessionId = await redisClient.get(`proctor:${proctorId}`);
    if (existingSessionId) {
      await redisClient.expire(`session:${existingSessionId}`, 2592000);
      console.log(`[Auth] Reusing existing session for proctor: ${proctorId}`);
      return { proctorId, sessionId: existingSessionId };
    }

    const sessionId = randomUUID();
    await redisClient.set(`session:${sessionId}`, proctorId, { EX: 2592000 });
    await redisClient.set(`proctor:${proctorId}`, sessionId, { EX: 2592000 });

    console.log(`[Auth] New session created for proctor: ${proctorId}`);
    return { proctorId, sessionId };
  }

  async logout(sessionId) {
    const usn = await redisClient.get(`session:${sessionId}`);
    if (usn) {
      await redisClient.del(`usn:${usn}`);
    }
    await redisClient.del(`session:${sessionId}`);
  }
}

export default new AuthService();