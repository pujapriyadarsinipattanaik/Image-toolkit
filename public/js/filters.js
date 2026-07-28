/**
 * VISION AI - CANVAS FILTERS & ENHANCEMENT MATRIX ENGINE
 */

class FilterEngine {
  // Apply Adjustments (Brightness, Contrast, Saturation, Sharpness, Blur, Exposure)
  static applyAdjustments(ctx, width, height, options = {}) {
    const {
      brightness = 0,
      contrast = 0,
      saturation = 0,
      sharpness = 0,
      blur = 0
    } = options;

    if (width <= 0 || height <= 0) return;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Convert values
    const bMult = 1 + (brightness / 100);
    const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    const sMult = 1 + (saturation / 100);

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // 1. Brightness
      r *= bMult;
      g *= bMult;
      b *= bMult;

      // 2. Contrast
      r = cFactor * (r - 128) + 128;
      g = cFactor * (g - 128) + 128;
      b = cFactor * (b - 128) + 128;

      // 3. Saturation
      const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
      r = gray + sMult * (r - gray);
      g = gray + sMult * (g - gray);
      b = gray + sMult * (b - gray);

      data[i] = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, b));
    }

    ctx.putImageData(imageData, 0, 0);

    // 4. Sharpness convolution kernel if enabled
    if (sharpness > 0) {
      this.applyConvolution(ctx, width, height, [
        0, -1, 0,
        -1, 5 + (sharpness / 20), -1,
        0, -1, 0
      ]);
    }
  }

  // Preset Style Filters
  static applyPresetFilter(ctx, width, height, filterType) {
    if (filterType === 'normal') return;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (filterType === 'cyberpunk') {
        data[i] = Math.min(255, r * 1.2 + 20);      // Boost Red
        data[i + 1] = Math.min(255, g * 0.7);       // Dim Green
        data[i + 2] = Math.min(255, b * 1.5 + 40);  // Boost Cyan/Blue
      } else if (filterType === 'duotone') {
        const avg = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i] = Math.min(255, (avg / 255) * 127 + 0);    // Cyan R
        data[i + 1] = Math.min(255, (avg / 255) * 242 + 0); // Cyan G
        data[i + 2] = Math.min(255, (avg / 255) * 254 + 50);// Cyan B
      } else if (filterType === 'vintage') {
        data[i] = Math.min(255, r * 0.9 + 40);
        data[i + 1] = Math.min(255, g * 0.85 + 20);
        data[i + 2] = Math.min(255, b * 0.7);
      } else if (filterType === 'sepia') {
        data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
        data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
        data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
      } else if (filterType === 'grayscale') {
        const avg = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i] = avg;
        data[i + 1] = avg;
        data[i + 2] = avg;
      } else if (filterType === 'invert') {
        data[i] = 255 - r;
        data[i + 1] = 255 - g;
        data[i + 2] = 255 - b;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Edge Detection Filter
    if (filterType === 'edge') {
      this.applyConvolution(ctx, width, height, [
        -1, -1, -1,
        -1,  8, -1,
        -1, -1, -1
      ]);
    }
  }

  // 3x3 Convolution Matrix Processing
  static applyConvolution(ctx, width, height, weights) {
    const srcData = ctx.getImageData(0, 0, width, height);
    const src = srcData.data;
    const output = ctx.createImageData(width, height);
    const dst = output.data;

    const side = Math.round(Math.sqrt(weights.length));
    const halfSide = Math.floor(side / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dstOff = (y * width + x) * 4;
        let r = 0, g = 0, b = 0;

        for (let cy = 0; cy < side; cy++) {
          for (let cx = 0; cx < side; cx++) {
            const scx = Math.min(width - 1, Math.max(0, x + cx - halfSide));
            const scy = Math.min(height - 1, Math.max(0, y + cy - halfSide));
            const srcOff = (scy * width + scx) * 4;
            const wt = weights[cy * side + cx];

            r += src[srcOff] * wt;
            g += src[srcOff + 1] * wt;
            b += src[srcOff + 2] * wt;
          }
        }

        dst[dstOff] = Math.min(255, Math.max(0, r));
        dst[dstOff + 1] = Math.min(255, Math.max(0, g));
        dst[dstOff + 2] = Math.min(255, Math.max(0, b));
        dst[dstOff + 3] = src[dstOff + 3];
      }
    }

    ctx.putImageData(output, 0, 0);
  }
}

window.FilterEngine = FilterEngine;
