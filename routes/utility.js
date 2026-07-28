const express = require('express');
const router = express.Router();
const utilityController = require('../controllers/utilityController');
const upload = require('../middleware/upload');

// @route   POST /api/utility/convert
// @desc    Convert image format (JPG, PNG, WebP, HEIC to JPG)
router.post('/convert', upload.single('image'), utilityController.convertFormat);

// @route   POST /api/utility/compress
// @desc    Compress image to reduce file size
router.post('/compress', upload.single('image'), utilityController.compressImage);

// @route   POST /api/utility/resize
// @desc    Resize image width & height
router.post('/resize', upload.single('image'), utilityController.resizeImage);

// @route   POST /api/utility/rotate-flip
// @desc    Rotate and flip image
router.post('/rotate-flip', upload.single('image'), utilityController.rotateFlip);

// @route   POST /api/utility/crop
// @desc    Crop image region
router.post('/crop', upload.single('image'), utilityController.cropImage);

// @route   POST /api/utility/base64
// @desc    Convert image to Base64 / Data URL
router.post('/base64', upload.single('image'), utilityController.convertToBase64);

module.exports = router;
