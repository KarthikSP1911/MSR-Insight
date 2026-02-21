const bcrypt = require("bcryptjs");
const userRepository = require("../repositories/user.repository");
const redisClient = require("../config/redis.config");
const tokenUtil = require("../utils/token.util");

class AuthService {
  async register(username, dob) {
    const existingUser = await userRepository.findByUsername(username);

    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(dob, 10);

    const newUser = await userRepository.create({
      username,
      password: hashedPassword,
    });

    const token = tokenUtil.generateToken({
      id: newUser._id,
      username: newUser.username,
    });

    // Save token in Redis
    await redisClient.set(
      `auth:${newUser._id}`,
      token,
      { EX: 3600 } // 1 hour expiry
    );

    return {
      user: {
        id: newUser._id,
        username: newUser.username,
      },
      token,
    };
  }
}

module.exports = new AuthService();