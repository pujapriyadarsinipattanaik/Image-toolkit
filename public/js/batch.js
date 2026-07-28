/**
 * PIXORA AI - BATCH IMAGE PROCESSING ENGINE MODULE
 */

class BatchProcessor {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.batchDropzone = document.getElementById('batchDropzone');
    this.batchFileInput = document.getElementById('batchFileInput');
    this.batchFileList = document.getElementById('batchFileList');

    this.batchActionSelect = document.getElementById('batchActionSelect');
    this.batchFormatSelect = document.getElementById('batchFormatSelect');
    this.batchQualityRange = document.getElementById('batchQualityRange');
    this.batchQualityVal = document.getElementById('batchQualityVal');
    this.runBatchBtn = document.getElementById('runBatchBtn');
    this.clearBatchBtn = document.getElementById('clearBatchBtn');

    this.batchProgressWrap = document.getElementById('batchProgressWrap');
    this.batchProgressBarFill = document.getElementById('batchProgressBarFill');
    this.batchStatusText = document.getElementById('batchStatusText');
  }

  bindEvents() {
    if (!this.batchDropzone) return;

    this.batchDropzone.addEventListener('click', () => this.batchFileInput.click());

    this.batchFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        this.addFiles(Array.from(e.target.files));
      }
    });

    // Drag over / drop
    ['dragenter', 'dragover'].forEach(name => {
      this.batchDropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.batchDropzone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      this.batchDropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.batchDropzone.classList.remove('drag-over');
      });
    });

    this.batchDropzone.addEventListener('drop', (e) => {
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || f.name.endsWith('.heic'));
      if (files.length > 0) this.addFiles(files);
    });

    this.batchQualityRange.addEventListener('input', (e) => {
      this.batchQualityVal.textContent = `${e.target.value}%`;
    });

    this.runBatchBtn.addEventListener('click', () => this.processQueue());
    this.clearBatchBtn.addEventListener('click', () => this.clearQueue());
  }

  addFiles(files) {
    files.forEach(file => {
      const item = {
        id: 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        file,
        name: file.name,
        size: file.size,
        status: 'pending', // pending, processing, completed, error
        result: null
      };
      this.queue.push(item);
    });
    this.renderQueue();
    window.showToast(`Added ${files.length} file(s) to batch queue`, 'info');
  }

  clearQueue() {
    this.queue = [];
    this.renderQueue();
    this.batchProgressWrap.classList.add('hidden');
  }

  renderQueue() {
    if (!this.batchFileList) return;
    this.batchFileList.innerHTML = '';

    if (this.queue.length === 0) {
      this.batchFileList.innerHTML = `
        <div class="empty-state p-3 text-center">
          <p class="subtext">Queue is empty. Drop files above to start batch processing.</p>
        </div>
      `;
      return;
    }

    this.queue.forEach(item => {
      const row = document.createElement('div');
      row.className = `batch-item-row ${item.status}`;
      
      const sizeMb = (item.size / (1024 * 1024)).toFixed(2);
      const statusIcon = item.status === 'completed' ? '<i class="fa-solid fa-circle-check text-success"></i>' :
                         item.status === 'processing' ? '<i class="fa-solid fa-spinner fa-spin text-cyan"></i>' :
                         item.status === 'error' ? '<i class="fa-solid fa-circle-xmark text-danger"></i>' :
                         '<i class="fa-regular fa-clock"></i>';

      let downloadBtn = '';
      if (item.status === 'completed' && item.result && item.result.url) {
        downloadBtn = `<button class="btn btn-sm btn-primary download-batch-item" data-url="${item.result.url}" data-name="${item.result.filename || 'processed'}"><i class="fa-solid fa-download"></i></button>`;
      }

      row.innerHTML = `
        <div class="batch-item-left">
          ${statusIcon}
          <span class="batch-item-name">${item.name}</span>
          <span class="batch-item-size">(${sizeMb} MB)</span>
        </div>
        <div class="batch-item-right">
          <span class="badge badge-status">${item.status.toUpperCase()}</span>
          ${downloadBtn}
        </div>
      `;

      if (downloadBtn) {
        row.querySelector('.download-batch-item').addEventListener('click', (e) => {
          const url = e.currentTarget.getAttribute('data-url');
          const name = e.currentTarget.getAttribute('data-name');
          const a = document.createElement('a');
          a.href = url;
          a.download = name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        });
      }

      this.batchFileList.appendChild(row);
    });
  }

  async processQueue() {
    if (this.queue.length === 0) {
      window.showToast('Please add files to the batch queue first', 'error');
      return;
    }
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.runBatchBtn.disabled = true;
    this.batchProgressWrap.classList.remove('hidden');

    const action = this.batchActionSelect.value; // convert, compress
    const targetFormat = this.batchFormatSelect.value;
    const quality = this.batchQualityRange.value;

    let completedCount = 0;
    const total = this.queue.length;

    for (let i = 0; i < total; i++) {
      const item = this.queue[i];
      if (item.status === 'completed') {
        completedCount++;
        continue;
      }

      item.status = 'processing';
      this.renderQueue();

      this.batchStatusText.textContent = `Processing (${i + 1}/${total}): ${item.name}...`;
      this.batchProgressBarFill.style.width = `${Math.round((i / total) * 100)}%`;

      try {
        const formData = new FormData();
        formData.append('image', item.file);

        let res;
        if (action === 'convert') {
          formData.append('targetFormat', targetFormat);
          formData.append('quality', quality);
          res = await ApiService.convertFormat(formData);
        } else {
          formData.append('quality', quality);
          formData.append('format', targetFormat);
          res = await ApiService.compressImage(formData);
        }

        if (res && res.success) {
          item.status = 'completed';
          item.result = res;
        } else {
          item.status = 'error';
        }
      } catch (err) {
        item.status = 'error';
      }

      completedCount++;
      this.batchProgressBarFill.style.width = `${Math.round((completedCount / total) * 100)}%`;
      this.renderQueue();
    }

    this.isProcessing = false;
    this.runBatchBtn.disabled = false;
    this.batchStatusText.textContent = `Batch Processing Complete! (${completedCount} items processed)`;
    window.showToast('Batch processing finished!', 'success');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.BatchProcessor = new BatchProcessor();
});
