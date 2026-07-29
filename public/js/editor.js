/**
 * PIXORA AI - CANVAS STUDIO & IMAGE EDITOR ENGINE
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

    this.isMouseDown = false;
    this.brushSize = 30;
    this.currentFilter = 'normal';
    this.currentToolPanel = 'panel-crop';
    this.loadedImage = null;
    this.originalImageData = null;
    this.loadedFilename = 'Edited Artwork';

    // Interactive mouse state
    this.activeSticker = '⭐';
    this.lastStickerPos = null;
    this.watermarkPos = null;
    this.cropDragStart = null;
    this.currentCropBox = null; // { x, y, width, height }

    // Zoom & Pan state
    this.zoomLevel = 1.0;
    this.panX = 0;
    this.panY = 0;

    // Before/After Split Comparison state
    this.isSplitMode = false;
    this.splitPosition = 0.5;

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

    // Background Removal & Matting
    this.bgToleranceRange = document.getElementById('bgToleranceRange');
    this.bgFeatherRange = document.getElementById('bgFeatherRange');
    this.bgKeyMode = document.getElementById('bgKeyMode');
    this.processBgRemovalBtn = document.getElementById('processBgRemovalBtn');
    this.pickBgColorBtn = document.getElementById('pickBgColorBtn');
    this.eyedropperContainer = document.getElementById('eyedropperContainer');
    this.selectedBgColorPreview = document.getElementById('selectedBgColorPreview');
    this.pickedBgColor = { r: 255, g: 255, b: 255 };
    this.isPickingBgColor = false;

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
    if (this.zoomInBtn) this.zoomInBtn.addEventListener('click', () => this.changeZoom(0.15));
    if (this.zoomOutBtn) this.zoomOutBtn.addEventListener('click', () => this.changeZoom(-0.15));
    if (this.zoomResetBtn) this.zoomResetBtn.addEventListener('click', () => this.resetZoom());
    if (this.toggleSplitBtn) this.toggleSplitBtn.addEventListener('click', () => this.toggleSplitMode());
    if (this.metadataBtn) this.metadataBtn.addEventListener('click', () => this.inspectMetadata());

    // Tool Sidebar Tabs Switching
    this.toolTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const targetPanel = e.currentTarget.getAttribute('data-panel');
        this.toolTabs.forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');

        this.toolPanels.forEach(p => p.classList.remove('active'));
        const panel = document.getElementById(targetPanel);
        if (panel) panel.classList.add('active');

        this.currentToolPanel = targetPanel;
        this.updateCanvasMouseBehavior();
      });
    });

    // Crop Aspect Ratio Presets
    document.querySelectorAll('.crop-preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.crop-preset-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');

        if (!this.loadedImage) return;

        const ratio = e.currentTarget.getAttribute('data-ratio');
        const imgW = this.mainCanvas.width;
        const imgH = this.mainCanvas.height;

        let targetW = imgW;
        let targetH = imgH;

        if (ratio === '1:1') {
          const side = Math.min(imgW, imgH);
          targetW = side;
          targetH = side;
        } else if (ratio === '16:9') {
          targetW = imgW;
          targetH = Math.round(imgW * (9 / 16));
        } else if (ratio === '4:3') {
          targetW = imgW;
          targetH = Math.round(imgW * (3 / 4));
        }

        if (this.resizeWidth) this.resizeWidth.value = targetW;
        if (this.resizeHeight) this.resizeHeight.value = targetH;

        // Auto calculate centered crop box overlay
        const cropX = Math.max(0, Math.floor((imgW - targetW) / 2));
        const cropY = Math.max(0, Math.floor((imgH - targetH) / 2));
        this.currentCropBox = { x: cropX, y: cropY, width: targetW, height: targetH };
        this.drawCropBoxOverlay();
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

    // Background Removal & Color Replacement Action
    if (this.bgToleranceRange) {
      this.bgToleranceRange.addEventListener('input', (e) => {
        const val = document.getElementById('bgToleranceVal');
        if (val) val.textContent = e.target.value;
      });
    }
    if (this.bgFeatherRange) {
      this.bgFeatherRange.addEventListener('input', (e) => {
        const val = document.getElementById('bgFeatherVal');
        if (val) val.textContent = `${e.target.value}px`;
      });
    }
    if (this.bgKeyMode) {
      this.bgKeyMode.addEventListener('change', (e) => {
        if (e.target.value === 'picker') {
          if (this.eyedropperContainer) this.eyedropperContainer.classList.remove('hidden');
          this.activateEyedropperMode();
        } else {
          if (this.eyedropperContainer) this.eyedropperContainer.classList.add('hidden');
          this.isPickingBgColor = false;
          this.updateCanvasMouseBehavior();
        }
      });
    }
    if (this.pickBgColorBtn) {
      this.pickBgColorBtn.addEventListener('click', () => this.activateEyedropperMode());
    }
    if (this.processBgRemovalBtn) {
      this.processBgRemovalBtn.addEventListener('click', () => this.removeBackground());
    }

    // Background Replacement Color Chips
    document.querySelectorAll('.bg-replace-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        document.querySelectorAll('.bg-replace-chip').forEach(c => c.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const color = e.currentTarget.getAttribute('data-color');
        this.replaceBackgroundColor(color);
      });
    });

    // Eraser brush slider
    if (this.brushSizeRange) {
      this.brushSizeRange.addEventListener('input', (e) => {
        this.brushSize = parseInt(e.target.value);
        const val = document.getElementById('brushSizeVal');
        if (val) val.textContent = `${this.brushSize}px`;
      });
    }

    // UNIFIED CANVAS MOUSE LISTENERS (Crop, Eraser, Stickers, Watermark)
    if (this.maskCanvas) {
      this.maskCanvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
      this.maskCanvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
      this.maskCanvas.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));
      this.maskCanvas.addEventListener('mouseleave', (e) => this.handleCanvasMouseUp(e));
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
        this.stickerChips.forEach(c => c.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.activeSticker = e.currentTarget.getAttribute('data-sticker');
        window.showToast(`Sticker ${this.activeSticker} selected. Click or drag on image to place it.`, 'info');
      });
    });
  }

  // Get mouse coordinates relative to original canvas resolution
  getCanvasCoords(e) {
    const rect = this.maskCanvas.getBoundingClientRect();
    const scaleX = this.maskCanvas.width / rect.width;
    const scaleY = this.maskCanvas.height / rect.height;

    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY)
    };
  }

  activateEyedropperMode() {
    this.isPickingBgColor = true;
    if (this.maskCanvas) {
      this.maskCanvas.style.pointerEvents = 'auto';
      this.maskCanvas.style.cursor = 'crosshair';
    }
    window.showToast('Eyedropper active: Click anywhere on the image to select target background color.', 'info');
  }

  // Configure mouse pointer-events and cursor based on active sidebar tool tab
  updateCanvasMouseBehavior() {
    if (!this.maskCanvas) return;

    if (this.isPickingBgColor || (this.currentToolPanel === 'panel-bg' && this.bgKeyMode && this.bgKeyMode.value === 'picker')) {
      this.maskCanvas.style.pointerEvents = 'auto';
      this.maskCanvas.style.cursor = 'crosshair';
    } else if (this.currentToolPanel === 'panel-eraser') {
      this.maskCanvas.style.pointerEvents = 'auto';
      this.maskCanvas.style.cursor = 'crosshair';
      window.showToast('Magic Eraser active. Brush over unwanted elements.', 'info');
    } else if (this.currentToolPanel === 'panel-crop') {
      this.maskCanvas.style.pointerEvents = 'auto';
      this.maskCanvas.style.cursor = 'crosshair';
      window.showToast('Crop Tool active. Drag mouse on image to select crop region.', 'info');
    } else if (this.currentToolPanel === 'panel-stickers') {
      this.maskCanvas.style.pointerEvents = 'auto';
      this.maskCanvas.style.cursor = 'pointer';
      window.showToast(`Sticker ${this.activeSticker} active. Click or drag on image to place.`, 'info');
    } else if (this.currentToolPanel === 'panel-watermark') {
      this.maskCanvas.style.pointerEvents = 'auto';
      this.maskCanvas.style.cursor = 'pointer';
      window.showToast('Watermark Tool active. Click or drag on image to position text.', 'info');
    } else {
      this.maskCanvas.style.pointerEvents = 'none';
      this.maskCanvas.style.cursor = 'default';
    }
  }

  // Unified MouseDown Event
  handleCanvasMouseDown(e) {
    if (!this.loadedImage) return;
    this.isMouseDown = true;
    const pos = this.getCanvasCoords(e);

    if (this.isPickingBgColor || (this.currentToolPanel === 'panel-bg' && this.bgKeyMode && this.bgKeyMode.value === 'picker')) {
      this.pickColorFromCanvas(pos);
      return;
    }

    if (this.currentToolPanel === 'panel-eraser') {
      this.startMaskDraw(pos);
    } else if (this.currentToolPanel === 'panel-crop') {
      this.cropDragStart = pos;
      this.currentCropBox = null;
      this.clearMask();
    } else if (this.currentToolPanel === 'panel-stickers') {
      this.stampStickerAt(pos.x, pos.y);
    } else if (this.currentToolPanel === 'panel-watermark') {
      this.stampWatermarkAt(pos.x, pos.y);
    }
  }

  pickColorFromCanvas(pos) {
    if (!this.ctx || !this.loadedImage) return;
    const pixel = this.ctx.getImageData(pos.x, pos.y, 1, 1).data;
    this.pickedBgColor = { r: pixel[0], g: pixel[1], b: pixel[2] };
    const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
    if (this.selectedBgColorPreview) {
      this.selectedBgColorPreview.style.backgroundColor = hex;
    }
    this.isPickingBgColor = false;
    this.updateCanvasMouseBehavior();
    window.showToast(`Target color picked: RGB(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`, 'success');
  }

  // Unified MouseMove Event
  handleCanvasMouseMove(e) {
    if (!this.loadedImage || !this.isMouseDown) return;
    const pos = this.getCanvasCoords(e);

    if (this.currentToolPanel === 'panel-eraser') {
      this.drawMask(pos);
    } else if (this.currentToolPanel === 'panel-crop' && this.cropDragStart) {
      const cropX = Math.min(this.cropDragStart.x, pos.x);
      const cropY = Math.min(this.cropDragStart.y, pos.y);
      const cropW = Math.abs(pos.x - this.cropDragStart.x);
      const cropH = Math.abs(pos.y - this.cropDragStart.y);

      if (cropW > 5 && cropH > 5) {
        this.currentCropBox = { x: cropX, y: cropY, width: cropW, height: cropH };
        if (this.resizeWidth) this.resizeWidth.value = cropW;
        if (this.resizeHeight) this.resizeHeight.value = cropH;
        this.drawCropBoxOverlay();
      }
    } else if (this.currentToolPanel === 'panel-stickers') {
      this.stampStickerAt(pos.x, pos.y, false);
    } else if (this.currentToolPanel === 'panel-watermark') {
      this.stampWatermarkAt(pos.x, pos.y, false);
    }
  }

  // Unified MouseUp Event
  handleCanvasMouseUp(e) {
    if (this.isMouseDown && this.currentToolPanel === 'panel-crop' && this.currentCropBox) {
      window.showToast(`Selected crop area: ${this.currentCropBox.width}x${this.currentCropBox.height}px. Click Apply Crop / Resize.`, 'info');
    }
    this.isMouseDown = false;
    this.cropDragStart = null;
  }

  // Draw Visual Crop Box Selection Overlay on Mask Canvas
  drawCropBoxOverlay() {
    if (!this.currentCropBox) return;

    const { x, y, width, height } = this.currentCropBox;
    const canvasW = this.maskCanvas.width;
    const canvasH = this.maskCanvas.height;

    this.maskCtx.clearRect(0, 0, canvasW, canvasH);

    // Dimmed translucent overlay outside crop box
    this.maskCtx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    this.maskCtx.fillRect(0, 0, canvasW, y); // Top
    this.maskCtx.fillRect(0, y + height, canvasW, canvasH - (y + height)); // Bottom
    this.maskCtx.fillRect(0, y, x, height); // Left
    this.maskCtx.fillRect(x + width, y, canvasW - (x + width), height); // Right

    // Glowing cyan selection border
    this.maskCtx.strokeStyle = '#00f2fe';
    this.maskCtx.lineWidth = 3;
    this.maskCtx.setLineDash([6, 4]);
    this.maskCtx.strokeRect(x, y, width, height);
    this.maskCtx.setLineDash([]);

    // Corner handle squares
    this.maskCtx.fillStyle = '#00f2fe';
    const handleSize = Math.max(8, Math.min(20, Math.round(canvasW / 80)));
    this.maskCtx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
    this.maskCtx.fillRect(x + width - handleSize/2, y - handleSize/2, handleSize, handleSize);
    this.maskCtx.fillRect(x - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
    this.maskCtx.fillRect(x + width - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
  }

  // Stamp Sticker at Mouse Coordinate (x, y)
  stampStickerAt(x, y, isNewAction = true) {
    if (!this.loadedImage || !this.activeSticker) return;

    if (isNewAction) this.saveState();

    this.ctx.drawImage(this.loadedImage, 0, 0, this.mainCanvas.width, this.mainCanvas.height);
    this.applyCurrentFiltersAndAdjustments();

    this.ctx.save();
    this.ctx.font = `${Math.round(this.mainCanvas.width * 0.08)}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.activeSticker, x, y);
    this.ctx.restore();

    this.lastStickerPos = { x, y };
  }

  // Stamp Watermark Text at Mouse Coordinate (x, y)
  stampWatermarkAt(x, y, isNewAction = true) {
    if (!this.loadedImage) return;

    if (isNewAction) this.saveState();

    const text = this.wmTextInput ? this.wmTextInput.value.trim() : '© PixoraAI Studio';
    const color = this.wmTextColor ? this.wmTextColor.value : '#ffffff';
    const fontSize = this.wmFontSize ? parseInt(this.wmFontSize.value) : 36;

    this.ctx.drawImage(this.loadedImage, 0, 0, this.mainCanvas.width, this.mainCanvas.height);
    this.applyCurrentFiltersAndAdjustments();

    this.ctx.save();
    this.ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = 0.75;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x, y);
    this.ctx.restore();

    this.watermarkPos = { x, y };
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
      this.currentCropBox = null;

      if (this.dimensionsBadge) {
        this.dimensionsBadge.textContent = `${img.width} x ${img.height} px`;
      }
      if (this.resizeWidth) this.resizeWidth.value = img.width;
      if (this.resizeHeight) this.resizeHeight.value = img.height;

      this.emptyState.classList.add('hidden');
      this.canvasWrap.classList.remove('hidden');

      this.resetZoom();
      this.updateCanvasMouseBehavior();
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

    this.ctx.putImageData(this.originalImageData, 0, 0);

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

    const text = this.wmTextInput ? this.wmTextInput.value.trim() : '© PixoraAI Studio';
    this.stampWatermarkAt(this.mainCanvas.width / 2, this.mainCanvas.height - 50);
    window.showToast(`Watermark "${text}" added to canvas!`, 'success');
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

  // CIELAB Color Conversion Helpers for Perceptual Color Matching
  rgbToLab(r, g, b) {
    let rN = r / 255, gN = g / 255, bN = b / 255;
    rN = rN > 0.04045 ? Math.pow((rN + 0.055) / 1.055, 2.4) : rN / 12.92;
    gN = gN > 0.04045 ? Math.pow((gN + 0.055) / 1.055, 2.4) : gN / 12.92;
    bN = bN > 0.04045 ? Math.pow((bN + 0.055) / 1.055, 2.4) : bN / 12.92;

    let x = (rN * 0.4124 + gN * 0.3576 + bN * 0.1805) * 100 / 95.047;
    let y = (rN * 0.2126 + gN * 0.7152 + bN * 0.0722) * 100 / 100.000;
    let z = (rN * 0.0193 + gN * 0.1192 + bN * 0.9505) * 100 / 108.883;

    x = x > 0.008856 ? Math.cbrt(x) : (7.787 * x) + (16 / 116);
    y = y > 0.008856 ? Math.cbrt(y) : (7.787 * y) + (16 / 116);
    z = z > 0.008856 ? Math.cbrt(z) : (7.787 * z) + (16 / 116);

    return {
      l: (116 * y) - 16,
      a: 500 * (x - y),
      b: 200 * (y - z)
    };
  }

  cielabDeltaE(lab1, lab2) {
    return Math.sqrt(
      Math.pow(lab1.l - lab2.l, 2) +
      Math.pow(lab1.a - lab2.a, 2) +
      Math.pow(lab1.b - lab2.b, 2)
    );
  }

  // Alpha Feathering / Smooth Anti-Aliasing Filter
  applyAlphaFeathering(data, width, height, featherRadius) {
    if (featherRadius <= 0) return;

    const alphaMap = new Uint8ClampedArray(width * height);
    for (let i = 0; i < alphaMap.length; i++) {
      alphaMap[i] = data[i * 4 + 3];
    }

    const blurredAlpha = new Uint8ClampedArray(width * height);
    const r = Math.min(featherRadius, 10);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0, count = 0;
        for (let dy = -r; dy <= r; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= height) continue;
          for (let dx = -r; dx <= r; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= width) continue;
            sum += alphaMap[ny * width + nx];
            count++;
          }
        }
        blurredAlpha[y * width + x] = Math.round(sum / count);
      }
    }

    for (let i = 0; i < blurredAlpha.length; i++) {
      data[i * 4 + 3] = blurredAlpha[i];
    }
  }

  // High-Quality Studio AI Background Removal
  removeBackground() {
    if (!this.loadedImage) {
      window.showToast('Please load an image first', 'warning');
      return;
    }

    this.saveState();
    window.showToast('Processing HD Background Removal...', 'info');

    const width = this.mainCanvas.width;
    const height = this.mainCanvas.height;
    const imageData = this.ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const tolerance = parseInt(this.bgToleranceRange ? this.bgToleranceRange.value : 35);
    const featherRadius = parseInt(this.bgFeatherRange ? this.bgFeatherRange.value : 3);
    const keyMode = this.bgKeyMode ? this.bgKeyMode.value : 'smart-lab';

    // Collect target background colors (LAB space)
    let bgSamples = [];

    if (keyMode === 'picker' && this.pickedBgColor) {
      bgSamples.push(this.rgbToLab(this.pickedBgColor.r, this.pickedBgColor.g, this.pickedBgColor.b));
    } else if (keyMode === 'green') {
      bgSamples.push(this.rgbToLab(0, 255, 0));
      bgSamples.push(this.rgbToLab(15, 230, 15));
    } else if (keyMode === 'white') {
      bgSamples.push(this.rgbToLab(255, 255, 255));
      bgSamples.push(this.rgbToLab(240, 240, 240));
    } else if (keyMode === 'dark') {
      bgSamples.push(this.rgbToLab(10, 10, 10));
      bgSamples.push(this.rgbToLab(30, 30, 30));
    } else {
      // Smart Multi-Border Edge Sampling (Top, Bottom, Left, Right outer pixel ring)
      const sampleStep = Math.max(1, Math.floor(width / 50));
      
      // Top & Bottom edges
      for (let x = 0; x < width; x += sampleStep) {
        bgSamples.push(this.rgbToLab(data[x * 4], data[x * 4 + 1], data[x * 4 + 2]));
        const bIdx = ((height - 1) * width + x) * 4;
        bgSamples.push(this.rgbToLab(data[bIdx], data[bIdx + 1], data[bIdx + 2]));
      }

      // Left & Right edges
      const yStep = Math.max(1, Math.floor(height / 50));
      for (let y = 0; y < height; y += yStep) {
        const lIdx = (y * width) * 4;
        bgSamples.push(this.rgbToLab(data[lIdx], data[lIdx + 1], data[lIdx + 2]));
        const rIdx = (y * width + (width - 1)) * 4;
        bgSamples.push(this.rgbToLab(data[rIdx], data[rIdx + 1], data[rIdx + 2]));
      }
    }

    const deltaThreshold = tolerance * 0.9;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];
        const pixelLab = this.rgbToLab(r, g, b);

        // Find minimum Delta E distance to sampled background colors
        let minDeltaE = Infinity;
        for (let i = 0; i < bgSamples.length; i++) {
          const dE = this.cielabDeltaE(pixelLab, bgSamples[i]);
          if (dE < minDeltaE) minDeltaE = dE;
        }

        // Green Spill Suppression for Green Screen
        if (keyMode === 'green' && g > r && g > b) {
          const maxRB = Math.max(r, b);
          if (g > maxRB) data[idx + 1] = maxRB;
        }

        if (minDeltaE < deltaThreshold) {
          const alphaFactor = Math.max(0, Math.min(1, minDeltaE / deltaThreshold));
          data[idx + 3] = Math.round(alphaFactor * 255 * (alphaFactor > 0.4 ? 1 : alphaFactor));
        } else if (minDeltaE < deltaThreshold * 1.4) {
          const alphaRatio = (minDeltaE - deltaThreshold) / (deltaThreshold * 0.4);
          data[idx + 3] = Math.round(Math.min(255, data[idx + 3] * alphaRatio));
        }
      }
    }

    // Apply Edge Feathering for smooth anti-aliased cutout
    if (featherRadius > 0) {
      this.applyAlphaFeathering(data, width, height, featherRadius);
    }

    this.ctx.putImageData(imageData, 0, 0);

    const updatedImg = new Image();
    updatedImg.onload = () => {
      this.loadedImage = updatedImg;
      this.originalImageData = this.ctx.getImageData(0, 0, width, height);
    };
    updatedImg.src = this.mainCanvas.toDataURL('image/png');

    window.showToast('Background cleanly removed with HD smooth edges!', 'success');
  }

  // Replace background with Colors, Gradients, or Custom Images
  replaceBackgroundColor(color) {
    if (!this.loadedImage) {
      window.showToast('Please load an image first', 'info');
      return;
    }

    this.saveState();
    const width = this.mainCanvas.width;
    const height = this.mainCanvas.height;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');

    // Fill background (Solid or Studio Gradients)
    if (color.startsWith('gradient-')) {
      let grad;
      if (color === 'gradient-sunset') {
        grad = tempCtx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#ff7e5f');
        grad.addColorStop(1, '#feb47b');
      } else if (color === 'gradient-cyber') {
        grad = tempCtx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#00c6ff');
        grad.addColorStop(1, '#0072ff');
      } else if (color === 'gradient-studio') {
        grad = tempCtx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width);
        grad.addColorStop(0, '#2b5876');
        grad.addColorStop(1, '#4e4376');
      } else if (color === 'gradient-gold') {
        grad = tempCtx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#bf953f');
        grad.addColorStop(0.5, '#fcf6ba');
        grad.addColorStop(1, '#b38728');
      }
      tempCtx.fillStyle = grad;
      tempCtx.fillRect(0, 0, width, height);
    } else if (color !== 'transparent') {
      tempCtx.fillStyle = color;
      tempCtx.fillRect(0, 0, width, height);
    }

    tempCtx.drawImage(this.mainCanvas, 0, 0);
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.drawImage(tempCanvas, 0, 0);

    const updatedImg = new Image();
    updatedImg.onload = () => {
      this.loadedImage = updatedImg;
      this.originalImageData = this.ctx.getImageData(0, 0, width, height);
    };
    window.showToast('Background updated!', 'success');
  }

  // Magic Eraser Mask Drawing
  startMaskDraw(pos) {
    this.drawMask(pos);
  }

  drawMask(pos) {
    this.maskCtx.fillStyle = 'rgba(255, 8, 68, 0.65)';
    this.maskCtx.beginPath();
    this.maskCtx.arc(pos.x, pos.y, this.brushSize / 2, 0, Math.PI * 2);
    this.maskCtx.fill();
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

  // True Crop & Resize Canvas
  applyResize() {
    if (!this.loadedImage) {
      window.showToast('Please load an image first', 'info');
      return;
    }

    const newWidth = parseInt(this.resizeWidth.value);
    const newHeight = parseInt(this.resizeHeight.value);

    if (!newWidth || !newHeight || newWidth <= 0 || newHeight <= 0) {
      window.showToast('Invalid dimensions', 'error');
      return;
    }

    this.saveState();

    const currentW = this.mainCanvas.width;
    const currentH = this.mainCanvas.height;

    // Calculate crop region (use user mouse crop selection if available, else center crop)
    let cropX = 0;
    let cropY = 0;
    let cropW = newWidth;
    let cropH = newHeight;

    if (this.currentCropBox && this.currentCropBox.width > 5 && this.currentCropBox.height > 5) {
      cropX = this.currentCropBox.x;
      cropY = this.currentCropBox.y;
      cropW = this.currentCropBox.width;
      cropH = this.currentCropBox.height;
    } else if (cropW <= currentW && cropH <= currentH) {
      cropX = Math.floor((currentW - cropW) / 2);
      cropY = Math.floor((currentH - cropH) / 2);
    } else {
      const targetRatio = newWidth / newHeight;
      const currentRatio = currentW / currentH;

      if (currentRatio > targetRatio) {
        cropH = currentH;
        cropW = Math.floor(currentH * targetRatio);
        cropX = Math.floor((currentW - cropW) / 2);
        cropY = 0;
      } else {
        cropW = currentW;
        cropH = Math.floor(currentW / targetRatio);
        cropX = 0;
        cropY = Math.floor((currentH - cropH) / 2);
      }
    }

    // Render cropped section to temporary canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';
    tempCtx.drawImage(
      this.mainCanvas,
      cropX, cropY, cropW, cropH,
      0, 0, newWidth, newHeight
    );

    // Resize main and mask canvases
    this.mainCanvas.width = newWidth;
    this.mainCanvas.height = newHeight;
    this.maskCanvas.width = newWidth;
    this.maskCanvas.height = newHeight;

    this.ctx.drawImage(tempCanvas, 0, 0);

    // Update loaded image base reference
    const updatedImg = new Image();
    updatedImg.onload = () => {
      this.loadedImage = updatedImg;
      this.originalImageData = this.ctx.getImageData(0, 0, newWidth, newHeight);
    };
    updatedImg.src = tempCanvas.toDataURL('image/png');

    if (this.dimensionsBadge) {
      this.dimensionsBadge.textContent = `${newWidth} x ${newHeight} px`;
    }
    this.clearMask();
    this.currentCropBox = null;

    window.showToast(`Cropped & resized canvas to ${newWidth}x${newHeight}px`, 'success');
  }

  // Export & Download Image
  downloadImage(format = 'png') {
    if (!this.loadedImage) return;

    const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
    const dataUrl = this.mainCanvas.toDataURL(mimeType, 0.92);

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `PixoraAI-${this.loadedFilename.replace(/\.[^/.]+$/, "")}.${format}`;
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
