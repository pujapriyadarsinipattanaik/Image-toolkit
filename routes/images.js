const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   POST /api/images/upload
// @desc    Upload image file
// @access  Private
router.post('/upload', authMiddleware, upload.single('image'), imageController.uploadImage);

// @route   POST /api/images/save-edited
// @desc    Save edited canvas base64 image
// @access  Private
router.post('/save-edited', authMiddleware, imageController.saveEditedImage);

// @route   GET /api/images/history
// @desc    Get current user's image history
// @access  Private
router.get('/history', authMiddleware, imageController.getHistory);

// @route   GET /api/images/stats
// @desc    Get user dashboard stats
// @access  Private
router.get('/stats', authMiddleware, imageController.getStats);

// @route   DELETE /api/images/:id
// @desc    Delete single image
// @access  Private
router.delete('/:id', authMiddleware, imageController.deleteImage);

module.exports = router;
