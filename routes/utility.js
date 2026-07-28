const express = require('express');
const router = express.Router();
const utilityController = require('../controllers/utilityController');
const upload = require('../middleware/upload');

// @route   POST /api/utility/convert
router.post('/convert', upload.single('image'), utilityController.convertFormat);

// @route   POST /api/utility/compress
router.post('/compress', upload.single('image'), utilityController.compressImage);

// @route   POST /api/utility/resize
router.post('/resize', upload.single('image'), utilityController.resizeImage);

// @route   POST /api/utility/rotate-flip
router.post('/rotate-flip', upload.single('image'), utilityController.rotateFlip);

// @route   POST /api/utility/crop
router.post('/crop', upload.single('image'), utilityController.cropImage);

// @route   POST /api/utility/base64
router.post('/base64', upload.single('image'), utilityController.convertToBase64);

// @route   POST /api/utility/metadata
router.post('/metadata', upload.single('image'), utilityController.getMetadata);

// @route   POST /api/utility/watermark
router.post('/watermark', upload.single('image'), utilityController.applyWatermark);

module.exports = router;
