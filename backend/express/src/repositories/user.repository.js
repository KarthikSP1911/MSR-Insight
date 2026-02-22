const User = require("../models/user.model");

class UserRepository {
  async findByUsername(username) {
    return await User.findOne({ username });
  }

  async create(userData) {
    return await User.create(userData);
  }
}

module.exports = new UserRepository();