const sharp = require('sharp');
const heicConvert = require('heic-convert');
const path = require('path');
const fs = require('fs');

// Helper to get image buffer (from uploaded multer file or raw buffer)
const getBufferFromFile = async (file) => {
  let buffer = fs.readFileSync(file.path);
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Check if HEIC/HEIF file
  if (ext === '.heic' || ext === '.heif' || file.mimetype === 'image/heic' || file.mimetype === 'image/heif') {
    try {
      buffer = await heicConvert({
        buffer: buffer,
        format: 'JPEG',
        quality: 0.92
      });
    } catch (e) {
      console.warn('HEIC Conversion Fallback Warning:', e.message);
    }
  }
  return buffer;
};

// 1. Convert Image Format (JPG, PNG, WebP, HEIC to JPG/PNG/WebP)
exports.convertFormat = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const targetFormat = (req.body.targetFormat || 'jpeg').toLowerCase();
    const quality = parseInt(req.body.quality) || 90;
    const inputBuffer = await getBufferFromFile(req.file);

    let sharpInstance = sharp(inputBuffer);

    let outputFormat = 'jpeg';
    let mimeType = 'image/jpeg';
    let ext = '.jpg';

    if (targetFormat === 'png') {
      sharpInstance = sharpInstance.png({ quality: Math.min(100, Math.max(1, quality)) });
      outputFormat = 'png';
      mimeType = 'image/png';
      ext = '.png';
    } else if (targetFormat === 'webp') {
      sharpInstance = sharpInstance.webp({ quality: Math.min(100, Math.max(1, quality)) });
      outputFormat = 'webp';
      mimeType = 'image/webp';
      ext = '.webp';
    } else {
      sharpInstance = sharpInstance.jpeg({ quality: Math.min(100, Math.max(1, quality)), mozjpeg: true });
      outputFormat = 'jpeg';
      mimeType = 'image/jpeg';
      ext = '.jpg';
    }

    const outputBuffer = await sharpInstance.toBuffer();
    const metadata = await sharp(outputBuffer).metadata();

    const outputFilename = `converted-${Date.now()}${ext}`;
    const outputPath = path.join(__dirname, '../uploads', outputFilename);
    fs.writeFileSync(outputPath, outputBuffer);

    const relativeUrl = `/uploads/${outputFilename}`;

    res.json({
      success: true,
      message: `Image converted to ${targetFormat.toUpperCase()} successfully`,
      filename: outputFilename,
      url: relativeUrl,
      format: outputFormat,
      mimeType: mimeType,
      originalSize: req.file.size,
      convertedSize: outputBuffer.length,
      width: metadata.width,
      height: metadata.height,
      base64: `data:${mimeType};base64,${outputBuffer.toString('base64')}`
    });

  } catch (error) {
    console.error('Format Conversion Error:', error);
    res.status(500).json({ success: false, message: 'Error converting image format: ' + error.message });
  }
};

// 2. Compress Image
exports.compressImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const quality = parseInt(req.body.quality) || 60;
    const format = (req.body.format || 'jpeg').toLowerCase();
    const inputBuffer = await getBufferFromFile(req.file);

    let sharpInstance = sharp(inputBuffer);
    let mimeType = 'image/jpeg';
    let ext = '.jpg';

    if (format === 'png') {
      sharpInstance = sharpInstance.png({ compressionLevel: 9, quality: Math.min(100, Math.max(1, quality)) });
      mimeType = 'image/png';
      ext = '.png';
    } else if (format === 'webp') {
      sharpInstance = sharpInstance.webp({ quality: Math.min(100, Math.max(1, quality)) });
      mimeType = 'image/webp';
      ext = '.webp';
    } else {
      sharpInstance = sharpInstance.jpeg({ quality: Math.min(100, Math.max(1, quality)), mozjpeg: true });
      mimeType = 'image/jpeg';
      ext = '.jpg';
    }

    const outputBuffer = await sharpInstance.toBuffer();
    const metadata = await sharp(outputBuffer).metadata();

    const outputFilename = `compressed-${Date.now()}${ext}`;
    const outputPath = path.join(__dirname, '../uploads', outputFilename);
    fs.writeFileSync(outputPath, outputBuffer);

    const relativeUrl = `/uploads/${outputFilename}`;
    const savedPercentage = (((req.file.size - outputBuffer.length) / req.file.size) * 100).toFixed(1);

    res.json({
      success: true,
      message: 'Image compressed successfully',
      url: relativeUrl,
      filename: outputFilename,
      originalSize: req.file.size,
      compressedSize: outputBuffer.length,
      savedPercentage: savedPercentage > 0 ? savedPercentage : 0,
      width: metadata.width,
      height: metadata.height,
      base64: `data:${mimeType};base64,${outputBuffer.toString('base64')}`
    });
  } catch (error) {
    console.error('Compression Error:', error);
    res.status(500).json({ success: false, message: 'Image compression failed: ' + error.message });
  }
};

// 3. Resize Image
exports.resizeImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const width = parseInt(req.body.width) || null;
    const height = parseInt(req.body.height) || null;
    const maintainAspect = req.body.maintainAspect === 'true' || req.body.maintainAspect === true;
    const fit = maintainAspect ? 'inside' : 'fill';

    if (!width && !height) {
      return res.status(400).json({ success: false, message: 'Please specify target width or height' });
    }

    const inputBuffer = await getBufferFromFile(req.file);
    const outputBuffer = await sharp(inputBuffer)
      .resize({ width, height, fit })
      .toBuffer();

    const metadata = await sharp(outputBuffer).metadata();
    const outputFilename = `resized-${Date.now()}.png`;
    const outputPath = path.join(__dirname, '../uploads', outputFilename);
    fs.writeFileSync(outputPath, outputBuffer);

    const relativeUrl = `/uploads/${outputFilename}`;

    res.json({
      success: true,
      message: `Image resized to ${metadata.width}x${metadata.height}px`,
      url: relativeUrl,
      filename: outputFilename,
      width: metadata.width,
      height: metadata.height,
      sizeBytes: outputBuffer.length,
      base64: `data:image/png;base64,${outputBuffer.toString('base64')}`
    });
  } catch (error) {
    console.error('Resize Error:', error);
    res.status(500).json({ success: false, message: 'Image resize failed: ' + error.message });
  }
};

// 4. Rotate & Flip Image
exports.rotateFlip = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const angle = parseInt(req.body.angle) || 0;
    const flipHorizontal = req.body.flipHorizontal === 'true' || req.body.flipHorizontal === true;
    const flipVertical = req.body.flipVertical === 'true' || req.body.flipVertical === true;

    const inputBuffer = await getBufferFromFile(req.file);
    let sharpInstance = sharp(inputBuffer);

    if (angle > 0) sharpInstance = sharpInstance.rotate(angle);
    if (flipHorizontal) sharpInstance = sharpInstance.flop();
    if (flipVertical) sharpInstance = sharpInstance.flip();

    const outputBuffer = await sharpInstance.toBuffer();
    const metadata = await sharp(outputBuffer).metadata();

    const outputFilename = `transformed-${Date.now()}.png`;
    const outputPath = path.join(__dirname, '../uploads', outputFilename);
    fs.writeFileSync(outputPath, outputBuffer);

    const relativeUrl = `/uploads/${outputFilename}`;

    res.json({
      success: true,
      message: 'Image transformation applied',
      url: relativeUrl,
      filename: outputFilename,
      width: metadata.width,
      height: metadata.height,
      sizeBytes: outputBuffer.length,
      base64: `data:image/png;base64,${outputBuffer.toString('base64')}`
    });
  } catch (error) {
    console.error('Rotate/Flip Error:', error);
    res.status(500).json({ success: false, message: 'Transformation failed: ' + error.message });
  }
};

// 5. Crop Image
exports.cropImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const left = parseInt(req.body.x) || 0;
    const top = parseInt(req.body.y) || 0;
    const width = parseInt(req.body.width);
    const height = parseInt(req.body.height);

    if (!width || !height) {
      return res.status(400).json({ success: false, message: 'Invalid crop parameters' });
    }

    const inputBuffer = await getBufferFromFile(req.file);
    const outputBuffer = await sharp(inputBuffer)
      .extract({ left, top, width, height })
      .toBuffer();

    const outputFilename = `cropped-${Date.now()}.png`;
    const outputPath = path.join(__dirname, '../uploads', outputFilename);
    fs.writeFileSync(outputPath, outputBuffer);

    const relativeUrl = `/uploads/${outputFilename}`;

    res.json({
      success: true,
      message: 'Image cropped successfully',
      url: relativeUrl,
      filename: outputFilename,
      width,
      height,
      sizeBytes: outputBuffer.length,
      base64: `data:image/png;base64,${outputBuffer.toString('base64')}`
    });
  } catch (error) {
    console.error('Crop Error:', error);
    res.status(500).json({ success: false, message: 'Crop failed: ' + error.message });
  }
};

// 6. Convert Image to Base64 String
exports.convertToBase64 = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const inputBuffer = await getBufferFromFile(req.file);
    const metadata = await sharp(inputBuffer).metadata();

    const mimeType = req.file.mimetype && req.file.mimetype.startsWith('image/')
      ? req.file.mimetype
      : `image/${metadata.format || 'png'}`;

    const rawBase64 = inputBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${rawBase64}`;

    res.json({
      success: true,
      message: 'Base64 string generated successfully',
      originalName: req.file.originalname,
      mimeType: mimeType,
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      sizeBytes: req.file.size,
      rawBase64: rawBase64,
      dataUrl: dataUrl
    });
  } catch (error) {
    console.error('Base64 Conversion Error:', error);
    res.status(500).json({ success: false, message: 'Base64 conversion failed: ' + error.message });
  }
};

// 7. Get Image EXIF & Properties Metadata
exports.getMetadata = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const inputBuffer = await getBufferFromFile(req.file);
    const metadata = await sharp(inputBuffer).metadata();

    const aspectRatio = metadata.width && metadata.height
      ? (metadata.width / metadata.height).toFixed(2)
      : 'N/A';

    res.json({
      success: true,
      filename: req.file.originalname,
      fileSize: req.file.size,
      fileSizeFormatted: (req.file.size / (1024 * 1024)).toFixed(2) + ' MB',
      mimeType: req.file.mimetype,
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      aspectRatio: `${aspectRatio} (${metadata.width}:${metadata.height})`,
      space: metadata.space || 'srgb',
      channels: metadata.channels || 3,
      depth: metadata.depth || '8-bit',
      density: metadata.density || 72,
      hasAlpha: metadata.hasAlpha || false,
      isProgressive: metadata.isProgressive || false,
      exif: metadata.exif ? 'EXIF Data Present' : 'None'
    });

  } catch (error) {
    console.error('Get Metadata Error:', error);
    res.status(500).json({ success: false, message: 'Failed to extract metadata: ' + error.message });
  }
};

// 8. Apply Watermark Overlay (Text or Image Watermark)
exports.applyWatermark = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const text = req.body.text || '© VisionAI Studio';
    const color = req.body.color || '#ffffff';
    const opacity = parseFloat(req.body.opacity) || 0.6;
    const fontSize = parseInt(req.body.fontSize) || 36;
    const position = req.body.position || 'bottom-right';

    const inputBuffer = await getBufferFromFile(req.file);
    const metadata = await sharp(inputBuffer).metadata();

    // Create SVG overlay buffer for text watermark
    const svgText = `
      <svg width="${metadata.width}" height="${metadata.height}">
        <style>
          .wm-text {
            fill: ${color};
            font-size: ${fontSize}px;
            font-family: Arial, sans-serif;
            font-weight: bold;
            opacity: ${opacity};
          }
        </style>
        <text x="50%" y="90%" text-anchor="middle" class="wm-text">${text}</text>
      </svg>
    `;

    const svgBuffer = Buffer.from(svgText);
    const outputBuffer = await sharp(inputBuffer)
      .composite([{ input: svgBuffer, top: 0, left: 0 }])
      .toBuffer();

    const outputFilename = `watermarked-${Date.now()}.png`;
    const outputPath = path.join(__dirname, '../uploads', outputFilename);
    fs.writeFileSync(outputPath, outputBuffer);

    const relativeUrl = `/uploads/${outputFilename}`;

    res.json({
      success: true,
      message: 'Watermark applied successfully',
      url: relativeUrl,
      filename: outputFilename,
      width: metadata.width,
      height: metadata.height,
      base64: `data:image/png;base64,${outputBuffer.toString('base64')}`
    });
  } catch (error) {
    console.error('Watermark Error:', error);
    res.status(500).json({ success: false, message: 'Watermark failed: ' + error.message });
  }
};
