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
    await userRepository.create({ usn: normalizedUSN, dob });

    const sessionId = randomUUID();
    await redisClient.set(`session:${sessionId}`, `student:${normalizedUSN}`, { EX: 2592000 });
    await redisClient.set(`usn:${normalizedUSN}`, sessionId, { EX: 2592000 });

    return { usn: normalizedUSN, sessionId };
  }

  async login(usn, dob) {
    const user = await userRepository.findByUSN(usn);

    if (!user || user.dob !== dob) {
      throw new Error("Invalid USN or Date of Birth");
    }

    const normalizedUSN = user.usn.toUpperCase();

    // Check for existing session
    const existingSessionId = await redisClient.get(`usn:${normalizedUSN}`);
    if (existingSessionId) {
      await redisClient.expire(`session:${existingSessionId}`, 2592000);
      return { usn: normalizedUSN, sessionId: existingSessionId };
    }

    const sessionId = randomUUID();
    // Store prefixed identity to distinguish between Student and Proctor
    await redisClient.set(`session:${sessionId}`, `student:${normalizedUSN}`, { EX: 2592000 });
    await redisClient.set(`usn:${normalizedUSN}`, sessionId, { EX: 2592000 });

    return { usn: normalizedUSN, sessionId };
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
      console.warn(`[Auth] Proctor not found: ${normalizedId}`);
      const err = new Error("Proctor not found");
      err.statusCode = 404;
      throw err;
    }

    let passwordValid = false;
    if (proctor.password.startsWith("$2b$") || proctor.password.startsWith("$2a$")) {
      passwordValid = await bcrypt.compare(password, proctor.password);
    } else {
      passwordValid = proctor.password === password;
    }

    if (!passwordValid) {
      console.warn(`[Auth] Invalid password for proctor: ${normalizedId}`);
      const err = new Error("Invalid Proctor ID or Password");
      err.statusCode = 401;
      throw err;
    }

    const existingSessionId = await redisClient.get(`proctor:${normalizedId}`);
    if (existingSessionId) {
      await redisClient.expire(`session:${existingSessionId}`, 2592000);
      console.log(`[Auth] Reusing existing session for proctor: ${normalizedId}`);
      return { proctorId: normalizedId, sessionId: existingSessionId };
    }

    const sessionId = randomUUID();
    await redisClient.set(`session:${sessionId}`, `proctor:${normalizedId}`, { EX: 2592000 });
    await redisClient.set(`proctor:${normalizedId}`, sessionId, { EX: 2592000 });

    console.log(`[Auth] New session created for proctor: ${normalizedId}`);
    return { proctorId: normalizedId, sessionId };
  }

  async logout(sessionId) {
    const identity = await redisClient.get(`session:${sessionId}`);
    if (identity) {
      if (identity.startsWith("student:")) {
        const usn = identity.split(":")[1];
        await redisClient.del(`usn:${usn}`);
      } else if (identity.startsWith("proctor:")) {
        const pId = identity.split(":")[1];
        await redisClient.del(`proctor:${pId}`);
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

    if (identity.startsWith("student:")) {
      const usn = identity.split(":")[1];
      const user = await userRepository.findByUSN(usn);
      if (!user) {
        const err = new Error("Student not found");
        err.statusCode = 404;
        throw err;
      }
      return { ...user, role: 'student' };
    } else if (identity.startsWith("proctor:")) {
      const pId = identity.split(":")[1];
      const proctor = await proctorRepository.findByProctorId(pId);
      if (!proctor) {
        const err = new Error("Proctor not found");
        err.statusCode = 404;
        throw err;
      }
      // Don't return password
      const { password, ...proctorData } = proctor;
      return { ...proctorData, role: 'proctor' };
    }

    throw new Error("Invalid identity type");
  }
}

export default new AuthService();