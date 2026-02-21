const authService = require("../services/auth.service");

class AuthController {
  async register(req, res, next) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Username and Date of Birth required",
        });
      }

      const result = await authService.register(username, password);

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();