const mongoose = require('mongoose');
const { getDbState } = require('../config/db');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 2
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const MongoUser = mongoose.model('User', UserSchema);

// Hybrid Data Layer helper
class UserAdapter {
  static async findByEmail(email) {
    const { isConnectedToMongo, memoryDb } = getDbState();
    if (isConnectedToMongo) {
      return await MongoUser.findOne({ email: email.toLowerCase() });
    }
    return memoryDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  static async findById(id) {
    const { isConnectedToMongo, memoryDb } = getDbState();
    if (isConnectedToMongo) {
      return await MongoUser.findById(id).select('-password');
    }
    const user = memoryDb.users.find(u => u._id.toString() === id.toString());
    if (!user) return null;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async create(userData) {
    const { isConnectedToMongo, memoryDb } = getDbState();
    if (isConnectedToMongo) {
      const user = new MongoUser(userData);
      return await user.save();
    }
    const newUser = {
      _id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      ...userData,
      email: userData.email.toLowerCase(),
      createdAt: new Date()
    };
    memoryDb.users.push(newUser);
    return newUser;
  }
}

module.exports = { MongoUser, UserAdapter };
