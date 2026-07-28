const mongoose = require('mongoose');
const { getDbState } = require('../config/db');

const ImageSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  filename: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    default: 'Untitled Image'
  },
  type: {
    type: String,
    enum: ['uploaded', 'generated', 'edited'],
    default: 'uploaded'
  },
  prompt: {
    type: String,
    default: ''
  },
  toolUsed: {
    type: String,
    default: ''
  },
  parameters: {
    type: Object,
    default: {}
  },
  width: {
    type: Number,
    default: 0
  },
  height: {
    type: Number,
    default: 0
  },
  sizeBytes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const MongoImage = mongoose.model('Image', ImageSchema);

// Hybrid Data Layer helper
class ImageAdapter {
  static async findByUserId(userId) {
    const { isConnectedToMongo, memoryDb } = getDbState();
    if (isConnectedToMongo) {
      return await MongoImage.find({ userId }).sort({ createdAt: -1 });
    }
    return memoryDb.images
      .filter(img => img.userId.toString() === userId.toString())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async findById(id) {
    const { isConnectedToMongo, memoryDb } = getDbState();
    if (isConnectedToMongo) {
      return await MongoImage.findById(id);
    }
    return memoryDb.images.find(img => img._id.toString() === id.toString());
  }

  static async create(imageData) {
    const { isConnectedToMongo, memoryDb } = getDbState();
    if (isConnectedToMongo) {
      const img = new MongoImage(imageData);
      return await img.save();
    }
    const newImg = {
      _id: 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      ...imageData,
      createdAt: new Date()
    };
    memoryDb.images.push(newImg);
    return newImg;
  }

  static async deleteById(id, userId) {
    const { isConnectedToMongo, memoryDb } = getDbState();
    if (isConnectedToMongo) {
      return await MongoImage.findOneAndDelete({ _id: id, userId });
    }
    const index = memoryDb.images.findIndex(
      img => img._id.toString() === id.toString() && img.userId.toString() === userId.toString()
    );
    if (index !== -1) {
      const [deleted] = memoryDb.images.splice(index, 1);
      return deleted;
    }
    return null;
  }

  static async getStats(userId) {
    const images = await this.findByUserId(userId);
    const totalCount = images.length;
    const generatedCount = images.filter(i => i.type === 'generated').length;
    const editedCount = images.filter(i => i.type === 'edited').length;
    const uploadedCount = images.filter(i => i.type === 'uploaded').length;
    const totalSizeBytes = images.reduce((sum, i) => sum + (i.sizeBytes || 0), 0);

    return {
      totalCount,
      generatedCount,
      editedCount,
      uploadedCount,
      totalSizeBytes
    };
  }
}

module.exports = { MongoImage, ImageAdapter };
