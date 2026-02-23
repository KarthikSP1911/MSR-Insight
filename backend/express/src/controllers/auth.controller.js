import authService from "../services/auth.service.js";

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

      const result = await authService.register(usn, dob);

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: result, // { usn, sessionId }
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

      const result = await authService.login(usn, dob);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: result, // { usn, sessionId }
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const sessionId = req.headers["x-session-id"];

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: "No session ID provided",
        });
      }

      await authService.logout(sessionId);

      return res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();