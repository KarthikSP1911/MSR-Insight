import authService from "../services/auth.service.js";
import { notifyRagSync } from "../services/report.service.js";
import logger from '../utils/logger.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
};

class AuthController {
  async register(req, res, next) {
    try {
      const { usn, dob } = req.body;

      if (!usn || !dob) {
        return res.status(400).json({
          success: false,
          message: "USN and Date of Birth are required",
        });
      }

      const { sessionId, ...data } = await authService.register(usn, dob);

      res.cookie("session_id", sessionId, cookieOptions);

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: data,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { usn, dob } = req.body;

      if (!usn || !dob) {
        return res.status(400).json({
          success: false,
          message: "USN and Date of Birth are required",
        });
      }

      const { sessionId, ...data } = await authService.login(usn, dob);

      res.cookie("session_id", sessionId, cookieOptions);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: data,
      });
    } catch (error) {
      next(error);
    }
  }

  async proctorRegister(req, res, next) {
    try {
      const { proctorId, password, name } = req.body;

      if (!proctorId || !password) {
        return res.status(400).json({
          success: false,
          message: "Proctor ID and Password are required",
        });
      }

      await authService.proctorRegister(proctorId, password, name);

      return res.status(201).json({
        success: true,
        message: "Proctor registered successfully",
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async proctorLogin(req, res, next) {
    try {
      const { proctorId, password } = req.body;

      if (!proctorId || !password) {
        return res.status(400).json({
          success: false,
          message: "Proctor ID and Password are required",
        });
      }

      const { sessionId, ...data } = await authService.proctorLogin(proctorId, password);
      
      // Trigger RAG sync on login so vectors are fresh for the session
      notifyRagSync();

      res.cookie("session_id", sessionId, cookieOptions);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: data,
      });
    } catch (error) {
      logger.error("[ProctorLogin Error]", error.message);
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async logout(req, res, next) {
    try {
      // Fallback to headers for backwards compatibility during migration, but prefer cookies
      const sessionId = req.cookies?.session_id || req.headers["x-session-id"];

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: "No session ID provided",
        });
      }

      await authService.logout(sessionId);

      res.clearCookie("session_id");

      return res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async profile(req, res, next) {
    try {
      const sessionId = req.cookies?.session_id || req.headers["x-session-id"];

      if (!sessionId) {
        return res.status(401).json({
          success: false,
          message: "No session ID provided",
        });
      }

      const result = await authService.getProfile(sessionId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }
}

export default new AuthController();