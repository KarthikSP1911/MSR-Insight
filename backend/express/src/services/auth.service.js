import { randomUUID } from "crypto";
import userRepository from "../repositories/user.repository.js";
import redisClient from "../config/redis.config.js";

class AuthService {
  async register(usn, dob) {
    const existingUser = await userRepository.findByUSN(usn);

    if (existingUser) {
      throw new Error("User already exists");
    }

    await userRepository.create({
      username: usn,
      dob,
    });

    // Generate a unique session ID
    const sessionId = randomUUID();

    // Forward lookup:  session:<sessionId>  → usn
    await redisClient.set(`session:${sessionId}`, usn, { EX: 2592000 });

    // Reverse lookup:  usn:<usn>  → sessionId  (so login() can reuse this session)
    await redisClient.set(`usn:${usn}`, sessionId, { EX: 2592000 });

    return { usn, sessionId };
  }

  async login(usn, dob) {
    const user = await userRepository.findByUSN(usn);

    if (!user || user.dob !== dob) {
      throw new Error("Invalid USN or Date of Birth");
    }

    // Check if a session already exists for this USN
    const existingSessionId = await redisClient.get(`usn:${usn}`);
    if (existingSessionId) {
      // Refresh TTL and reuse the same session
      await redisClient.expire(`session:${existingSessionId}`, 2592000);
      return { usn, sessionId: existingSessionId };
    }

    // Create a new session
    const sessionId = randomUUID();

    // Forward lookup:  session:<sessionId>  → usn
    await redisClient.set(`session:${sessionId}`, usn, { EX: 2592000 });

    // Reverse lookup:  usn:<usn>  → sessionId  (to reuse sessions on login)
    await redisClient.set(`usn:${usn}`, sessionId, { EX: 2592000 });

    return { usn, sessionId };
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