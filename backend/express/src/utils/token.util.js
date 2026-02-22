const jwt = require("jsonwebtoken");

class TokenUtil {
  generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
  }
}

module.exports = new TokenUtil();