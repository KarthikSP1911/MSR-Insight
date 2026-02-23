import User from "../models/user.model.js";

class UserRepository {
  async findByUSN(usn) {
    return await User.findOne({ username: usn });
  }

  async create(userData) {
    return await User.create(userData);
  }
}

export default new UserRepository();