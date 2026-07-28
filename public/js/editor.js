/**
 * VISION AI - CANVAS STUDIO & IMAGE EDITOR ENGINE
 */

class CanvasEditor {
  constructor() {
    this.mainCanvas = document.getElementById('mainCanvas');
    this.maskCanvas = document.getElementById('maskCanvas');
    this.ctx = this.mainCanvas.getContext('2d');
    this.maskCtx = this.maskCanvas.getContext('2d');

    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = 20;

    this.isDrawingMask = false;
    this.brushSize = 30;
    this.currentFilter = 'normal';
    this.loadedImage = null;
    this.originalImageData = null;
    this.loadedFilename = 'Edited Artwork';

    // Zoom & Pan state
    this.zoomLevel = 1.0;
    this.panX = 0;
    this.panY = 0;

    // Before/After Split Comparison state
    this.isSplitMode = false;
    this.splitPosition = 0.5; // 0 to 1

    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.emptyState = document.getElementById('editorEmptyState');
    this.canvasWrap = document.getElementById('canvasWrap');
    this.fileInput = document.getElementById('editorFileInput');
    this.triggerUploadBtn = document.getElementById('triggerUploadBtn');

    this.dimensionsBadge = document.getElementById('imageDimensions');

    this.undoBtn = document.getElementById('undoBtn');
    this.redoBtn = document.getElementById('redoBtn');

    this.saveToHistoryBtn = document.getElementById('saveToHistoryBtn');
    this.downloadDropdownBtn = document.getElementById('downloadDropdownBtn');
    this.exportMenu = document.getElementById('exportMenu');

    // Toolbar Zoom & Split controls
    this.zoomInBtn = document.getElementById('btnZoomIn');
    this.zoomOutBtn = document.getElementById('btnZoomOut');
    this.zoomResetBtn = document.getElementById('btnZoomReset');
    this.zoomValDisplay = document.getElementById('zoomValDisplay');
    this.toggleSplitBtn = document.getElementById('btnToggleSplit');
    this.metadataBtn = document.getElementById('btnMetadata');

    // Sidebar Panels & Controls
    this.toolTabs = document.querySelectorAll('.editor-tool-tab');
    this.toolPanels = document.querySelectorAll('.tool-panel');

    // Adjustment Sliders
    this.brightnessRange = document.getElementById('brightnessRange');
    this.contrastRange = document.getElementById('contrastRange');
    this.saturationRange = document.getElementById('saturationRange');
    this.sharpnessRange = document.getElementById('sharpnessRange');
    this.blurRange = document.getElementById('blurRange');
    this.resetAdjustmentsBtn = document.getElementById('resetAdjustmentsBtn');

    // Filter Cards
    this.filterCards = document.querySelectorAll('.filter-card');

    // Background Removal
    this.bgToleranceRange = document.getElementById('bgToleranceRange');
    this.bgKeyMode = document.getElementById('bgKeyMode');
    this.processBgRemovalBtn = document.getElementById('processBgRemovalBtn');

    // Eraser
    this.brushSizeRange = document.getElementById('brushSizeRange');
    this.clearMaskBtn = document.getElementById('clearMaskBtn');
    this.runObjectRemovalBtn = document.getElementById('runObjectRemovalBtn');

    // Crop / Resize
    this.resizeWidth = document.getElementById('resizeWidth');
    this.resizeHeight = document.getElementById('resizeHeight');
    this.applyCropBtn = document.getElementById('applyCropBtn');

    // Text & Sticker Controls
    this.wmTextInput = document.getElementById('wmTextInput');
    this.wmTextColor = document.getElementById('wmTextColor');
    this.wmFontSize = document.getElementById('wmFontSize');
    this.applyWatermarkBtn = document.getElementById('applyWatermarkBtn');

    this.addTextBtn = document.getElementById('addTextBtn');
    this.stickerChips = document.querySelectorAll('.sticker-chip');
  }

  bindEvents() {
    // Upload File Trigger
    if (this.triggerUploadBtn) {
      this.triggerUploadBtn.addEventListener('click', () => this.fileInput.click());
    }
    if (this.fileInput) {
      this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    }

    // Undo / Redo
    if (this.undoBtn) this.undoBtn.addEventListener('click', () => this.undo());
    if (this.redoBtn) this.redoBtn.addEventListener('click', () => this.redo());

    // Export & Save
    if (this.saveToHistoryBtn) this.saveToHistoryBtn.addEventListener('click', () => this.saveToCloud());
    if (this.downloadDropdownBtn) {
      this.downloadDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.exportMenu.classList.toggle('hidden');
      });
    }

    document.addEventListener('click', () => {
      if (this.exportMenu) this.exportMenu.classList.add('hidden');
    });

    document.querySelectorAll('.export-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const format = e.currentTarget.getAttribute('data-format');
        this.downloadImage(format);
      });
    });

    // Zoom & Split Controls
    if (this.zoomInBtn) {
      this.zoomInBtn.addEventListener('click', () => this.changeZoom(0.15));
    }
    if (this.zoomOutBtn) {
      this.zoomOutBtn.addEventListener('click', () => this.changeZoom(-0.15));
    }
    if (this.zoomResetBtn) {
      this.zoomResetBtn.addEventListener('click', () => this.resetZoom());
    }

    if (this.toggleSplitBtn) {
      this.toggleSplitBtn.addEventListener('click', () => this.toggleSplitMode());
    }

    if (this.metadataBtn) {
      this.metadataBtn.addEventListener('click', () => this.inspectMetadata());
    }

    // Tool Sidebar Tabs
    this.toolTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const targetPanel = e.currentTarget.getAttribute('data-panel');
        this.toolTabs.forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');

        this.toolPanels.forEach(p => p.classList.remove('active'));
        const panel = document.getElementById(targetPanel);
        if (panel) panel.classList.add('active');
      });
    });

    // Adjustment Sliders Event Listeners
    const updateAdjustments = () => this.applyCurrentFiltersAndAdjustments();
    [this.brightnessRange, this.contrastRange, this.saturationRange, this.sharpnessRange, this.blurRange].forEach(slider => {
      if (slider) {
        slider.addEventListener('input', (e) => {
          const valId = `${e.target.id.replace('Range', 'Val')}`;
          const label = document.getElementById(valId);
          if (label) label.textContent = e.target.value;
          updateAdjustments();
        });
      }
    });

    if (this.resetAdjustmentsBtn) {
      this.resetAdjustmentsBtn.addEventListener('click', () => {
        this.brightnessRange.value = 0;
        this.contrastRange.value = 0;
        this.saturationRange.value = 0;
        this.sharpnessRange.value = 0;
        this.blurRange.value = 0;
        ['brightnessVal', 'contrastVal', 'saturationVal', 'sharpnessVal', 'blurVal'].forEach(id => {
          const label = document.getElementById(id);
          if (label) label.textContent = '0';
        });
        updateAdjustments();
      });
    }

    // Filter Cards
    this.filterCards.forEach(card => {
      card.addEventListener('click', (e) => {
        this.filterCards.forEach(c => c.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentFilter = e.currentTarget.getAttribute('data-filter');
        updateAdjustments();
      });
    });

    // Background Removal Action
    if (this.bgToleranceRange) {
      this.bgToleranceRange.addEventListener('input', (e) => {
        const val = document.getElementById('bgToleranceVal');
        if (val) val.textContent = e.target.value;
      });
    }
    if (this.processBgRemovalBtn) {
      this.processBgRemovalBtn.addEventListener('click', () => this.removeBackground());
    }

    // Eraser
    if (this.brushSizeRange) {
      this.brushSizeRange.addEventListener('input', (e) => {
        this.brushSize = parseInt(e.target.value);
        const val = document.getElementById('brushSizeVal');
        if (val) val.textContent = `${this.brushSize}px`;
      });
    }

    if (this.maskCanvas) {
      this.maskCanvas.addEventListener('mousedown', (e) => this.startMaskDraw(e));
      this.maskCanvas.addEventListener('mousemove', (e) => this.drawMask(e));
      this.maskCanvas.addEventListener('mouseup', () => this.stopMaskDraw());
      this.maskCanvas.addEventListener('mouseleave', () => this.stopMaskDraw());
    }

    if (this.clearMaskBtn) this.clearMaskBtn.addEventListener('click', () => this.clearMask());
    if (this.runObjectRemovalBtn) this.runObjectRemovalBtn.addEventListener('click', () => this.eraseMaskedArea());

    // Crop / Resize
    if (this.applyCropBtn) this.applyCropBtn.addEventListener('click', () => this.applyResize());

    // Watermark & Text Overlay
    if (this.applyWatermarkBtn) {
      this.applyWatermarkBtn.addEventListener('click', () => this.addWatermarkText());
    }

    // Stickers
    this.stickerChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        const emoji = e.currentTarget.getAttribute('data-sticker');
        this.addStickerEmoji(emoji);
      });
    });
  }

  // Load Image File
  handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    this.loadedFilename = file.name || 'Uploaded Image';
    const reader = new FileReader();
    reader.onload = (event) => {
      this.loadImageFromUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  }

  // Load Image From Data URL or Remote Link
  loadImageFromUrl(url) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.loadedImage = img;
      this.mainCanvas.width = img.width;
      this.mainCanvas.height = img.height;
      this.maskCanvas.width = img.width;
      this.maskCanvas.height = img.height;

      this.ctx.drawImage(img, 0, 0);
      this.originalImageData = this.ctx.getImageData(0, 0, img.width, img.height);

      this.clearMask();

      if (this.dimensionsBadge) {
        this.dimensionsBadge.textContent = `${img.width} x ${img.height} px`;
      }
      if (this.resizeWidth) this.resizeWidth.value = img.width;
      if (this.resizeHeight) this.resizeHeight.value = img.height;

      this.emptyState.classList.add('hidden');
      this.canvasWrap.classList.remove('hidden');

      this.resetZoom();
      this.undoStack = [];
      this.redoStack = [];
      this.saveState();
    };
    img.src = url;
  }

  // Zoom & Pan
  changeZoom(delta) {
    this.zoomLevel = Math.max(0.2, Math.min(4.0, this.zoomLevel + delta));
    this.applyCanvasTransform();
  }

  resetZoom() {
    this.zoomLevel = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.applyCanvasTransform();
  }

  applyCanvasTransform() {
    if (this.canvasWrap) {
      this.canvasWrap.style.transform = `scale(${this.zoomLevel}) translate(${this.panX}px, ${this.panY}px)`;
    }
    if (this.zoomValDisplay) {
      this.zoomValDisplay.textContent = `${Math.round(this.zoomLevel * 100)}%`;
    }
  }

  // Before/After Split Comparison View
  toggleSplitMode() {
    if (!this.loadedImage || !this.originalImageData) return;
    this.isSplitMode = !this.isSplitMode;

    if (this.isSplitMode) {
      this.toggleSplitBtn.classList.add('active');
      this.renderSplitComparison();
      window.showToast('Before-After Split View active', 'info');
    } else {
      this.toggleSplitBtn.classList.remove('active');
      this.applyCurrentFiltersAndAdjustments();
      window.showToast('Exited Split View', 'info');
    }
  }

  renderSplitComparison() {
    if (!this.originalImageData) return;

    const width = this.mainCanvas.width;
    const height = this.mainCanvas.height;
    const splitX = Math.floor(width * this.splitPosition);

    // Left side: original image
    this.ctx.putImageData(this.originalImageData, 0, 0);

    // Draw vertical divider line
    this.ctx.strokeStyle = '#00f2fe';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(splitX, 0);
    this.ctx.lineTo(splitX, height);
    this.ctx.stroke();
  }

  // Inspect EXIF & Metadata
  async inspectMetadata() {
    if (!this.loadedImage) {
      window.showToast('Please load an image first', 'info');
      return;
    }

    const dataUrl = this.mainCanvas.toDataURL('image/png');
    window.showToast('Inspecting image metadata...', 'info');

    try {
      const res = await ApiService.request('/utility/metadata', {
        method: 'POST',
        body: JSON.stringify({ image: dataUrl }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (res && res.success) {
        alert(`EXIF & Image Properties:\n\nFormat: ${res.format.toUpperCase()}\nResolution: ${res.width} x ${res.height} px\nAspect Ratio: ${res.aspectRatio}\nColor Space: ${res.space}\nChannels: ${res.channels}`);
      }
    } catch (e) {
      alert(`Image Details:\n\nResolution: ${this.mainCanvas.width} x ${this.mainCanvas.height} px\nAspect Ratio: ${(this.mainCanvas.width / this.mainCanvas.height).toFixed(2)}`);
    }
  }

  // Add Watermark & Text Overlay
  addWatermarkText() {
    if (!this.loadedImage) return;

    this.saveState();
    const text = this.wmTextInput ? this.wmTextInput.value.trim() : '© VisionAI Studio';
    const color = this.wmTextColor ? this.wmTextColor.value : '#ffffff';
    const fontSize = this.wmFontSize ? parseInt(this.wmFontSize.value) : 36;

    this.ctx.save();
    this.ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = 0.7;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, this.mainCanvas.width / 2, this.mainCanvas.height - 40);
    this.ctx.restore();

    window.showToast('Watermark added to canvas!', 'success');
  }

  addStickerEmoji(emoji) {
    if (!this.loadedImage || !emoji) return;

    this.saveState();
    this.ctx.save();
    this.ctx.font = '60px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(emoji, this.mainCanvas.width / 2, this.mainCanvas.height / 2);
    this.ctx.restore();

    window.showToast(`Sticker ${emoji} added!`, 'success');
  }

  // Save Canvas State for Undo
  saveState() {
    if (this.undoStack.length >= this.maxHistory) {
      this.undoStack.shift();
    }
    this.undoStack.push(this.ctx.getImageData(0, 0, this.mainCanvas.width, this.mainCanvas.height));
    this.redoStack = [];
    this.updateUndoRedoBtns();
  }

  undo() {
    if (this.undoStack.length > 1) {
      this.redoStack.push(this.undoStack.pop());
      const previousState = this.undoStack[this.undoStack.length - 1];
      this.ctx.putImageData(previousState, 0, 0);
      this.updateUndoRedoBtns();
      window.showToast('Undo successful', 'info');
    }
  }

  redo() {
    if (this.redoStack.length > 0) {
      const nextState = this.redoStack.pop();
      this.undoStack.push(nextState);
      this.ctx.putImageData(nextState, 0, 0);
      this.updateUndoRedoBtns();
      window.showToast('Redo successful', 'info');
    }
  }

  updateUndoRedoBtns() {
    if (this.undoBtn) this.undoBtn.disabled = this.undoStack.length <= 1;
    if (this.redoBtn) this.redoBtn.disabled = this.redoStack.length === 0;
  }

  // Apply Adjustments & Filters to base image
  applyCurrentFiltersAndAdjustments() {
    if (!this.loadedImage) return;

    this.ctx.drawImage(this.loadedImage, 0, 0, this.mainCanvas.width, this.mainCanvas.height);

    FilterEngine.applyPresetFilter(this.ctx, this.mainCanvas.width, this.mainCanvas.height, this.currentFilter);

    FilterEngine.applyAdjustments(this.ctx, this.mainCanvas.width, this.mainCanvas.height, {
      brightness: parseInt(this.brightnessRange ? this.brightnessRange.value : 0),
      contrast: parseInt(this.contrastRange ? this.contrastRange.value : 0),
      saturation: parseInt(this.saturationRange ? this.saturationRange.value : 0),
      sharpness: parseInt(this.sharpnessRange ? this.sharpnessRange.value : 0),
      blur: parseInt(this.blurRange ? this.blurRange.value : 0)
    });
  }

  // Smart AI Background Removal Algorithm
  removeBackground() {
    if (!this.loadedImage) return;

    this.saveState();
    const width = this.mainCanvas.width;
    const height = this.mainCanvas.height;
    const imageData = this.ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const tolerance = parseInt(this.bgToleranceRange ? this.bgToleranceRange.value : 30);
    const keyMode = this.bgKeyMode ? this.bgKeyMode.value : 'auto';

    let sampleR = 255, sampleG = 255, sampleB = 255;
    if (keyMode === 'auto') {
      sampleR = (data[0] + data[(width - 1) * 4] + data[(height - 1) * width * 4]) / 3;
      sampleG = (data[1] + data[(width - 1) * 4 + 1] + data[(height - 1) * width * 4 + 1]) / 3;
      sampleB = (data[2] + data[(width - 1) * 4 + 2] + data[(height - 1) * width * 4 + 2]) / 3;
    } else if (keyMode === 'white') {
      sampleR = 240; sampleG = 240; sampleB = 240;
    } else if (keyMode === 'dark') {
      sampleR = 20; sampleG = 20; sampleB = 20;
    } else if (keyMode === 'green') {
      sampleR = 0; sampleG = 255; sampleB = 0;
    }

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const diff = Math.sqrt(
        Math.pow(r - sampleR, 2) +
        Math.pow(g - sampleG, 2) +
        Math.pow(b - sampleB, 2)
      );

      if (diff < tolerance * 2.5) {
        const alpha = Math.max(0, (diff / (tolerance * 2.5)) * 255);
        data[i + 3] = alpha;
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
    window.showToast('Background removed successfully!', 'success');
  }

  // Magic Eraser Mask Drawing
  startMaskDraw(e) {
    this.isDrawingMask = true;
    this.drawMask(e);
  }

  drawMask(e) {
    if (!this.isDrawingMask) return;

    const rect = this.maskCanvas.getBoundingClientRect();
    const scaleX = this.maskCanvas.width / rect.width;
    const scaleY = this.maskCanvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    this.maskCtx.fillStyle = 'rgba(255, 8, 68, 0.65)';
    this.maskCtx.beginPath();
    this.maskCtx.arc(x, y, this.brushSize / 2, 0, Math.PI * 2);
    this.maskCtx.fill();
  }

  stopMaskDraw() {
    this.isDrawingMask = false;
  }

  clearMask() {
    this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
  }

  // Magic Eraser Object Removal
  eraseMaskedArea() {
    if (!this.loadedImage) return;

    this.saveState();
    const width = this.mainCanvas.width;
    const height = this.mainCanvas.height;

    const imgData = this.ctx.getImageData(0, 0, width, height);
    const maskData = this.maskCtx.getImageData(0, 0, width, height);

    const imgPixels = imgData.data;
    const maskPixels = maskData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        if (maskPixels[idx + 3] > 0) {
          let sumR = 0, sumG = 0, sumB = 0, count = 0;
          const radius = Math.max(5, Math.floor(this.brushSize / 2));

          for (let dy = -radius; dy <= radius; dy += 2) {
            for (let dx = -radius; dx <= radius; dx += 2) {
              const nx = x + dx;
              const ny = y + dy;

              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIdx = (ny * width + nx) * 4;
                if (maskPixels[nIdx + 3] === 0) {
                  sumR += imgPixels[nIdx];
                  sumG += imgPixels[nIdx + 1];
                  sumB += imgPixels[nIdx + 2];
                  count++;
                }
              }
            }
          }

          if (count > 0) {
            imgPixels[idx] = sumR / count;
            imgPixels[idx + 1] = sumG / count;
            imgPixels[idx + 2] = sumB / count;
          }
        }
      }
    }

    this.ctx.putImageData(imgData, 0, 0);
    this.clearMask();
    window.showToast('Unwanted object erased cleanly!', 'success');
  }

  // Resize / Crop canvas
  applyResize() {
    const newWidth = parseInt(this.resizeWidth.value);
    const newHeight = parseInt(this.resizeHeight.value);

    if (!newWidth || !newHeight || newWidth <= 0 || newHeight <= 0) {
      window.showToast('Invalid dimensions', 'error');
      return;
    }

    this.saveState();

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(this.mainCanvas, 0, 0, newWidth, newHeight);

    this.mainCanvas.width = newWidth;
    this.mainCanvas.height = newHeight;
    this.maskCanvas.width = newWidth;
    this.maskCanvas.height = newHeight;

    this.ctx.drawImage(tempCanvas, 0, 0);
    if (this.dimensionsBadge) {
      this.dimensionsBadge.textContent = `${newWidth} x ${newHeight} px`;
    }
    this.clearMask();

    window.showToast(`Resized canvas to ${newWidth}x${newHeight}px`, 'success');
  }

  // Export & Download Image
  downloadImage(format = 'png') {
    if (!this.loadedImage) return;

    const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
    const dataUrl = this.mainCanvas.toDataURL(mimeType, 0.92);

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `VisionAI-${this.loadedFilename.replace(/\.[^/.]+$/, "")}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.showToast(`Exported as ${format.toUpperCase()}`, 'success');
  }

  // Save edited canvas image to user cloud history
  async saveToCloud() {
    if (!this.loadedImage) return;
    if (!window.Auth || !window.Auth.isAuthenticated()) {
      window.showToast('Please sign in to save creations to your account', 'info');
      if (window.Auth) window.Auth.showModal();
      return;
    }

    const dataUrl = this.mainCanvas.toDataURL('image/png');

    try {
      const res = await ApiService.saveEditedImage({
        base64Data: dataUrl,
        originalName: this.loadedFilename,
        toolUsed: 'Canvas Studio',
        parameters: { filter: this.currentFilter }
      });

      if (res.success) {
        window.showToast('Artwork saved to cloud history!', 'success');
        if (window.App) window.App.refreshDashboardStats();
      }
    } catch (err) {
      window.showToast('Failed to save artwork', 'error');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.Editor = new CanvasEditor();
});
