const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');

// @route   POST /api/ai/generate
// @desc    Generate image from text prompt
// @access  Private
router.post('/generate', authMiddleware, aiController.generateImage);

// @route   POST /api/ai/enhance-prompt
// @desc    Enhance user text prompt
// @access  Private
router.post('/enhance-prompt', authMiddleware, aiController.enhancePrompt);

module.exports = router;
