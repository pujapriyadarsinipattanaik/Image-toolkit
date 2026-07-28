const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { ImageAdapter } = require('../models/Image');

// Preset style prompt enhancers
const STYLE_PROMPTS = {
  cyberpunk: ', futuristic cyberpunk aesthetics, neon lights, high tech synthwave vibe, octane render 8k hdr',
  anime: ', Japanese anime art style, vibrant studio ghibli inspired details, crisp linework, digital painting',
  photorealistic: ', 8k resolution, photorealistic masterpiece, ultra detailed 35mm photograph, soft cinematic lighting',
  '3d-render': ', 3d render, blender 3d style, smooth textures, vibrant pastel colors, ambient occlusion, 4k studio render',
  fantasy: ', epic fantasy illustration, mystical atmosphere, magical aura, detailed concept art by trend on artstation',
  synthwave: ', 80s synthwave retro style, glowing grid, purple-cyan color palette, retro-futurism'
};

// Generate AI Image from prompt
exports.generateImage = async (req, res) => {
  try {
    const { prompt, style = 'none', width = 1024, height = 1024, seed } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter a text prompt for image generation' });
    }

    // Append style modifiers
    let enhancedPrompt = prompt.trim();
    if (style && STYLE_PROMPTS[style]) {
      enhancedPrompt += STYLE_PROMPTS[style];
    }

    const randomSeed = seed || Math.floor(Math.random() * 1000000);
    const sanitizedPrompt = encodeURIComponent(enhancedPrompt);

    // Call synthesis service (Pollinations.ai open API engine)
    const imageUrl = `https://pollinations.ai/p/${sanitizedPrompt}?width=${width}&height=${height}&seed=${randomSeed}&model=flux&nologo=true`;

    console.log(`Generating AI Image with prompt: "${enhancedPrompt}"`);

    // Download generated image binary to local storage
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 30000 });
    const buffer = Buffer.from(response.data);

    const filename = `ai-gen-${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;
    const uploadDir = path.join(__dirname, '../uploads');
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/${filename}`;

    // Save to user image history
    const imageRecord = await ImageAdapter.create({
      userId: req.user.id,
      filename: filename,
      url: relativeUrl,
      originalName: `AI: ${prompt.substring(0, 30)}...`,
      type: 'generated',
      prompt: prompt,
      toolUsed: 'AI Generator',
      parameters: {
        enhancedPrompt,
        style,
        width,
        height,
        seed: randomSeed
      },
      width: parseInt(width),
      height: parseInt(height),
      sizeBytes: buffer.length
    });

    res.status(201).json({
      success: true,
      message: 'AI Image generated successfully!',
      image: imageRecord,
      imageUrl: relativeUrl
    });

  } catch (error) {
    console.error('AI Generation Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI image. Please check prompt or try again.',
      error: error.message
    });
  }
};

// AI Prompt Enhancer helper
exports.enhancePrompt = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    const modifiers = [
      'ultra-detailed masterpiece',
      'cinematic atmosphere & dramatic volumetric lighting',
      'trending on ArtStation 8K resolution',
      'intricate textures and harmonious color grading'
    ];

    const enhanced = `${prompt.trim()}, ${modifiers.join(', ')}`;

    res.json({
      success: true,
      original: prompt,
      enhanced
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Prompt enhancement failed' });
  }
};
