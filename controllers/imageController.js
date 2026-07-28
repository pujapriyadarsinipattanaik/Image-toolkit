const fs = require('fs');
const path = require('path');
const { ImageAdapter } = require('../models/Image');

// Upload image
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const relativeUrl = `/uploads/${req.file.filename}`;
    const fullPath = req.file.path;

    const imageRecord = await ImageAdapter.create({
      userId: req.user.id,
      filename: req.file.filename,
      url: relativeUrl,
      originalName: req.file.originalname || 'Uploaded Image',
      type: 'uploaded',
      sizeBytes: req.file.size || 0
    });

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      image: imageRecord
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, message: 'Error processing image upload' });
  }
};

// Save edited canvas image (Base64 data URL string)
exports.saveEditedImage = async (req, res) => {
  try {
    const { base64Data, originalName, toolUsed, parameters } = req.body;

    if (!base64Data) {
      return res.status(400).json({ success: false, message: 'No image data provided' });
    }

    // Extract mime and base64 content
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, message: 'Invalid Base64 image format' });
    }

    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `edited-${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;
    const uploadDir = path.join(__dirname, '../uploads');
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/${filename}`;

    const imageRecord = await ImageAdapter.create({
      userId: req.user.id,
      filename: filename,
      url: relativeUrl,
      originalName: originalName || 'Edited Artwork',
      type: 'edited',
      toolUsed: toolUsed || 'Canvas Studio',
      parameters: parameters || {},
      sizeBytes: buffer.length
    });

    res.status(201).json({
      success: true,
      message: 'Edited image saved to history',
      image: imageRecord
    });
  } catch (error) {
    console.error('Save Edited Error:', error);
    res.status(500).json({ success: false, message: 'Failed to save edited image' });
  }
};

// Get User Image History
exports.getHistory = async (req, res) => {
  try {
    const images = await ImageAdapter.findByUserId(req.user.id);
    res.json({
      success: true,
      count: images.length,
      images
    });
  } catch (error) {
    console.error('Get History Error:', error);
    res.status(500).json({ success: false, message: 'Failed to load user image history' });
  }
};

// Get User Dashboard Stats
exports.getStats = async (req, res) => {
  try {
    const stats = await ImageAdapter.getStats(req.user.id);
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get Stats Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve dashboard statistics' });
  }
};

// Delete Image
exports.deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedImage = await ImageAdapter.deleteById(id, req.user.id);

    if (!deletedImage) {
      return res.status(404).json({ success: false, message: 'Image not found or unauthorized' });
    }

    // Try deleting physical file if exists
    if (deletedImage.filename) {
      const filePath = path.join(__dirname, '../uploads', deletedImage.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('Physical file deletion error:', e.message);
        }
      }
    }

    res.json({
      success: true,
      message: 'Image deleted successfully',
      id
    });
  } catch (error) {
    console.error('Delete Image Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete image' });
  }
};
