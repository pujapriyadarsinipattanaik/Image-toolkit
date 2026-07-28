/**
 * PIXORA AI - UTILITY & FORMAT CONVERTER STUDIO MODULE
 */

class UtilityStudio {
  constructor() {
    this.selectedFile = null;
    this.processedResult = null;
    this.activeOperation = 'compress';
    this.rotateAngle = 0;
    this.flipH = false;
    this.flipV = false;

    this.initElements();
    this.bindEvents();
  }

  initElements() {
    // Dropzone & File Input
    this.dropzone = document.getElementById('utilDropzone');
    this.fileInput = document.getElementById('utilFileInput');
    this.fileInfoBar = document.getElementById('utilFileInfoBar');
    this.fileNameDisplay = document.getElementById('utilFileName');
    this.fileSizeDisplay = document.getElementById('utilFileSize');
    this.removeFileBtn = document.getElementById('utilRemoveFileBtn');

    // Operation Tab Buttons
    this.opTabs = document.querySelectorAll('.util-op-tab');
    this.opPanels = document.querySelectorAll('.util-op-panel');

    // Compress Controls
    this.compressQualityRange = document.getElementById('compressQualityRange');
    this.compressQualityVal = document.getElementById('compressQualityVal');
    this.compressFormatSelect = document.getElementById('compressFormatSelect');
    this.runCompressBtn = document.getElementById('runCompressBtn');

    // Convert Controls
    this.targetFormatChips = document.querySelectorAll('.convert-chip');
    this.selectedTargetFormat = 'jpeg';
    this.convertQualityRange = document.getElementById('convertQualityRange');
    this.convertQualityVal = document.getElementById('convertQualityVal');
    this.runConvertBtn = document.getElementById('runConvertBtn');

    // Resize Controls
    this.resizeWidthInput = document.getElementById('utilResizeWidth');
    this.resizeHeightInput = document.getElementById('utilResizeHeight');
    this.aspectLockCheckbox = document.getElementById('utilAspectLock');
    this.runResizeBtn = document.getElementById('runResizeBtn');

    // Rotate & Flip Controls
    this.btnRotateLeft = document.getElementById('btnRotateLeft');
    this.btnRotateRight = document.getElementById('btnRotateRight');
    this.btnRotate180 = document.getElementById('btnRotate180');
    this.btnFlipH = document.getElementById('btnFlipH');
    this.btnFlipV = document.getElementById('btnFlipV');
    this.runRotateFlipBtn = document.getElementById('runRotateFlipBtn');

    // Base64 Controls
    this.runBase64Btn = document.getElementById('runBase64Btn');
    this.base64ResultBox = document.getElementById('base64ResultBox');
    this.base64DataUrlText = document.getElementById('base64DataUrlText');
    this.copyDataUrlBtn = document.getElementById('copyDataUrlBtn');
    this.copyRawBase64Btn = document.getElementById('copyRawBase64Btn');

    // Progress Bar & Result Stage
    this.progressBarWrap = document.getElementById('utilProgressBarWrap');
    this.progressBarFill = document.getElementById('utilProgressBarFill');
    this.progressStatusText = document.getElementById('utilProgressStatusText');

    this.resultContainer = document.getElementById('utilResultContainer');
    this.resultImage = document.getElementById('utilResultImage');
    this.resultStats = document.getElementById('utilResultStats');
    this.downloadResultBtn = document.getElementById('utilDownloadResultBtn');
    this.sendToStudioBtn = document.getElementById('utilSendToStudioBtn');
  }

  bindEvents() {
    // Dropzone Click
    this.dropzone.addEventListener('click', (e) => {
      if (e.target.closest('#utilRemoveFileBtn')) return;
      this.fileInput.click();
    });

    this.fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.setFile(e.target.files[0]);
      }
    });

    // Drag and Drop Events
    ['dragenter', 'dragover'].forEach(eventName => {
      this.dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropzone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      this.dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropzone.classList.remove('drag-over');
      });
    });

    this.dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        this.setFile(files[0]);
      }
    });

    this.removeFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.clearFile();
    });

    // Operation Tab Toggles
    this.opTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const targetOp = e.currentTarget.getAttribute('data-op');
        this.opTabs.forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');

        this.opPanels.forEach(p => p.classList.remove('active'));
        document.getElementById(`op-panel-${targetOp}`).classList.add('active');
        this.activeOperation = targetOp;
      });
    });

    // Compress Sliders
    this.compressQualityRange.addEventListener('input', (e) => {
      this.compressQualityVal.textContent = `${e.target.value}%`;
    });

    // Convert Chips & Sliders
    this.targetFormatChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        this.targetFormatChips.forEach(c => c.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.selectedTargetFormat = e.currentTarget.getAttribute('data-format');
      });
    });

    this.convertQualityRange.addEventListener('input', (e) => {
      this.convertQualityVal.textContent = `${e.target.value}%`;
    });

    // Rotate / Flip Buttons
    this.btnRotateLeft.addEventListener('click', () => {
      this.rotateAngle = (this.rotateAngle - 90 + 360) % 360;
      this.updateRotateBtnStates();
    });
    this.btnRotateRight.addEventListener('click', () => {
      this.rotateAngle = (this.rotateAngle + 90) % 360;
      this.updateRotateBtnStates();
    });
    this.btnRotate180.addEventListener('click', () => {
      this.rotateAngle = (this.rotateAngle + 180) % 360;
      this.updateRotateBtnStates();
    });
    this.btnFlipH.addEventListener('click', () => {
      this.flipH = !this.flipH;
      this.btnFlipH.classList.toggle('active', this.flipH);
    });
    this.btnFlipV.addEventListener('click', () => {
      this.flipV = !this.flipV;
      this.btnFlipV.classList.toggle('active', this.flipV);
    });

    // Action Handlers
    this.runCompressBtn.addEventListener('click', () => this.executeCompress());
    this.runConvertBtn.addEventListener('click', () => this.executeConvert());
    this.runResizeBtn.addEventListener('click', () => this.executeResize());
    this.runRotateFlipBtn.addEventListener('click', () => this.executeRotateFlip());
    this.runBase64Btn.addEventListener('click', () => this.executeBase64());

    // Copy Base64 Buttons
    this.copyDataUrlBtn.addEventListener('click', () => {
      if (this.processedResult && this.processedResult.dataUrl) {
        navigator.clipboard.writeText(this.processedResult.dataUrl);
        window.showToast('Data URL copied to clipboard!', 'success');
      }
    });

    this.copyRawBase64Btn.addEventListener('click', () => {
      if (this.processedResult && this.processedResult.rawBase64) {
        navigator.clipboard.writeText(this.processedResult.rawBase64);
        window.showToast('Raw Base64 string copied to clipboard!', 'success');
      }
    });

    // Download & Send to Studio
    this.downloadResultBtn.addEventListener('click', () => {
      if (this.processedResult && this.processedResult.url) {
        const a = document.createElement('a');
        a.href = this.processedResult.url;
        a.download = this.processedResult.filename || 'Processed-Image';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });

    this.sendToStudioBtn.addEventListener('click', () => {
      if (this.processedResult && this.processedResult.url && window.Editor) {
        window.Editor.loadImageFromUrl(this.processedResult.url);
        if (window.App) window.App.switchTab('editor');
        window.showToast('Image loaded into Canvas Studio!', 'success');
      }
    });
  }

  updateRotateBtnStates() {
    window.showToast(`Rotation set to ${this.rotateAngle}°`, 'info');
  }

  setFile(file) {
    this.selectedFile = file;
    this.fileNameDisplay.textContent = file.name;
    const mb = (file.size / (1024 * 1024)).toFixed(2);
    this.fileSizeDisplay.textContent = `${mb} MB (${file.type || 'Image'})`;
    this.fileInfoBar.classList.remove('hidden');

    window.showToast(`Selected file: ${file.name}`, 'info');
  }

  clearFile() {
    this.selectedFile = null;
    this.fileInput.value = '';
    this.fileInfoBar.classList.add('hidden');
    this.resultContainer.classList.add('hidden');
    this.base64ResultBox.classList.add('hidden');
  }

  showProgress(statusText = 'Processing image...') {
    this.progressBarWrap.classList.remove('hidden');
    this.progressStatusText.textContent = statusText;
    this.progressBarFill.style.width = '0%';
    setTimeout(() => { this.progressBarFill.style.width = '70%'; }, 100);
  }

  hideProgress() {
    this.progressBarFill.style.width = '100%';
    setTimeout(() => {
      this.progressBarWrap.classList.add('hidden');
    }, 400);
  }

  validateFile() {
    if (!this.selectedFile) {
      window.showToast('Please select or drop an image file first', 'error');
      return false;
    }
    return true;
  }

  // 1. Execute Compression
  async executeCompress() {
    if (!this.validateFile()) return;

    this.showProgress('Compressing image size...');
    const formData = new FormData();
    formData.append('image', this.selectedFile);
    formData.append('quality', this.compressQualityRange.value);
    formData.append('format', this.compressFormatSelect.value);

    try {
      const res = await ApiService.compressImage(formData);
      this.hideProgress();
      if (res.success) {
        this.processedResult = res;
        this.showResult(res, `Compressed size: ${(res.compressedSize / 1024).toFixed(1)} KB (Saved ${res.savedPercentage}%)`);
        window.showToast(`Saved ${res.savedPercentage}% filesize!`, 'success');
      }
    } catch (err) {
      this.hideProgress();
      window.showToast('Compression failed: ' + err.message, 'error');
    }
  }

  // 2. Execute Format Conversion
  async executeConvert() {
    if (!this.validateFile()) return;

    this.showProgress(`Converting to ${this.selectedTargetFormat.toUpperCase()}...`);
    const formData = new FormData();
    formData.append('image', this.selectedFile);
    formData.append('targetFormat', this.selectedTargetFormat);
    formData.append('quality', this.convertQualityRange.value);

    try {
      const res = await ApiService.convertFormat(formData);
      this.hideProgress();
      if (res.success) {
        this.processedResult = res;
        this.showResult(res, `Converted to ${res.format.toUpperCase()} (${(res.convertedSize / 1024).toFixed(1)} KB)`);
        window.showToast(`Converted to ${res.format.toUpperCase()} successfully!`, 'success');
      }
    } catch (err) {
      this.hideProgress();
      window.showToast('Format conversion failed: ' + err.message, 'error');
    }
  }

  // 3. Execute Resize
  async executeResize() {
    if (!this.validateFile()) return;

    const width = this.resizeWidthInput.value;
    const height = this.resizeHeightInput.value;

    if (!width && !height) {
      window.showToast('Please enter target width or height', 'error');
      return;
    }

    this.showProgress('Resizing image dimensions...');
    const formData = new FormData();
    formData.append('image', this.selectedFile);
    if (width) formData.append('width', width);
    if (height) formData.append('height', height);
    formData.append('maintainAspect', this.aspectLockCheckbox.checked);

    try {
      const res = await ApiService.resizeImage(formData);
      this.hideProgress();
      if (res.success) {
        this.processedResult = res;
        this.showResult(res, `Resized dimensions: ${res.width} x ${res.height} px`);
        window.showToast(`Resized to ${res.width}x${res.height}px!`, 'success');
      }
    } catch (err) {
      this.hideProgress();
      window.showToast('Resize failed: ' + err.message, 'error');
    }
  }

  // 4. Execute Rotate & Flip
  async executeRotateFlip() {
    if (!this.validateFile()) return;

    this.showProgress('Applying transformation...');
    const formData = new FormData();
    formData.append('image', this.selectedFile);
    formData.append('angle', this.rotateAngle);
    formData.append('flipHorizontal', this.flipH);
    formData.append('flipVertical', this.flipV);

    try {
      const res = await ApiService.rotateFlipImage(formData);
      this.hideProgress();
      if (res.success) {
        this.processedResult = res;
        this.showResult(res, `Transformed: ${this.rotateAngle}° Rotate, Flip H:${this.flipH}, V:${this.flipV}`);
        window.showToast('Image transformed successfully!', 'success');
      }
    } catch (err) {
      this.hideProgress();
      window.showToast('Transformation failed: ' + err.message, 'error');
    }
  }

  // 5. Execute Base64 Generator
  async executeBase64() {
    if (!this.validateFile()) return;

    this.showProgress('Generating Base64 string...');
    const formData = new FormData();
    formData.append('image', this.selectedFile);

    try {
      const res = await ApiService.convertToBase64(formData);
      this.hideProgress();
      if (res.success) {
        this.processedResult = res;
        this.base64DataUrlText.value = res.dataUrl;
        this.base64ResultBox.classList.remove('hidden');
        window.showToast('Base64 generated! Click Copy to use.', 'success');
      }
    } catch (err) {
      this.hideProgress();
      window.showToast('Base64 conversion failed: ' + err.message, 'error');
    }
  }

  showResult(result, statText = '') {
    this.resultImage.src = result.url;
    this.resultStats.textContent = statText || `${result.width}x${result.height}px`;
    this.resultContainer.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.UtilityStudio = new UtilityStudio();
});
