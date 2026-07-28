/**
 * VISION AI - GALLERY & CREATION HISTORY MODULE
 */

class HistoryGallery {
  constructor() {
    this.images = [];
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.selectedImage = null;

    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.galleryGrid = document.getElementById('galleryGrid');
    this.searchBox = document.getElementById('gallerySearch');
    this.filterTabs = document.querySelectorAll('.filter-tab');

    // Detail Modal
    this.detailModal = document.getElementById('imageDetailModal');
    this.closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
    this.detailModalImg = document.getElementById('detailModalImg');
    this.detailTitle = document.getElementById('detailTitle');
    this.detailBadge = document.getElementById('detailBadge');
    this.detailPrompt = document.getElementById('detailPrompt');
    this.detailDate = document.getElementById('detailDate');

    this.detailOpenInEditor = document.getElementById('detailOpenInEditor');
    this.detailDownloadPng = document.getElementById('detailDownloadPng');
    this.detailShareBtn = document.getElementById('detailShareBtn');
    this.detailDeleteBtn = document.getElementById('detailDeleteBtn');
  }

  bindEvents() {
    // Search input
    this.searchBox.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.render();
    });

    // Category filter tabs
    this.filterTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.filterTabs.forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentFilter = e.currentTarget.getAttribute('data-filter');
        this.render();
      });
    });

    // Modal Close
    this.closeDetailModalBtn.addEventListener('click', () => this.hideModal());
    this.detailModal.addEventListener('click', (e) => {
      if (e.target === this.detailModal) this.hideModal();
    });

    // Detail Modal Actions
    this.detailOpenInEditor.addEventListener('click', () => {
      if (this.selectedImage && window.Editor) {
        window.Editor.loadImageFromUrl(this.selectedImage.url);
        this.hideModal();
        if (window.App) window.App.switchTab('editor');
        window.showToast('Loaded into Canvas Studio', 'success');
      }
    });

    this.detailDownloadPng.addEventListener('click', () => {
      if (this.selectedImage) {
        const a = document.createElement('a');
        a.href = this.selectedImage.url;
        a.download = `VisionAI-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });

    this.detailShareBtn.addEventListener('click', async () => {
      if (!this.selectedImage) return;

      const shareData = {
        title: this.selectedImage.originalName || 'VisionAI Artwork',
        text: this.selectedImage.prompt || 'Check out my AI artwork created with VisionAI!',
        url: window.location.origin + this.selectedImage.url
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (e) {
          console.log('Share canceled');
        }
      } else {
        // Fallback: Copy link to clipboard
        navigator.clipboard.writeText(shareData.url);
        window.showToast('Image URL copied to clipboard!', 'success');
      }
    });

    this.detailDeleteBtn.addEventListener('click', async () => {
      if (!this.selectedImage) return;
      if (!confirm('Are you sure you want to delete this creation?')) return;

      try {
        await ApiService.deleteImage(this.selectedImage._id);
        this.hideModal();
        window.showToast('Image deleted', 'info');
        this.loadHistory();
        if (window.App) window.App.refreshDashboardStats();
      } catch (err) {
        window.showToast('Failed to delete image', 'error');
      }
    });
  }

  async loadHistory() {
    if (!window.Auth || !window.Auth.isAuthenticated()) {
      this.images = [];
      this.render();
      return;
    }

    try {
      const res = await ApiService.getHistory();
      if (res.success && res.images) {
        this.images = res.images;
        this.render();
      }
    } catch (err) {
      console.error('Error loading history:', err);
    }
  }

  render() {
    this.galleryGrid.innerHTML = '';

    let filtered = this.images;

    // Filter by type
    if (this.currentFilter !== 'all') {
      filtered = filtered.filter(img => img.type === this.currentFilter);
    }

    // Filter by search
    if (this.searchQuery) {
      filtered = filtered.filter(img => 
        (img.originalName && img.originalName.toLowerCase().includes(this.searchQuery)) ||
        (img.prompt && img.prompt.toLowerCase().includes(this.searchQuery))
      );
    }

    if (filtered.length === 0) {
      this.galleryGrid.innerHTML = `
        <div class="empty-state glass-card" style="grid-column: 1 / -1; padding: 3rem;">
          <i class="fa-regular fa-image" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
          <p>No creations found in gallery.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(img => {
      const card = document.createElement('div');
      card.className = 'gallery-card glass-card';
      
      const badgeText = img.type === 'generated' ? 'AI Art' : img.type === 'edited' ? 'Edited' : 'Uploaded';

      card.innerHTML = `
        <span class="card-badge">${badgeText}</span>
        <img src="${img.url}" alt="${img.originalName || 'Artwork'}">
        <div class="gallery-overlay">
          <h4 style="font-size: 0.95rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${img.originalName || 'Untitled'}</h4>
          <p style="font-size: 0.78rem; color: var(--text-muted);">${new Date(img.createdAt).toLocaleDateString()}</p>
        </div>
      `;

      card.addEventListener('click', () => this.showDetailModal(img));
      this.galleryGrid.appendChild(card);
    });
  }

  showDetailModal(image) {
    this.selectedImage = image;
    this.detailModalImg.src = image.url;
    this.detailTitle.textContent = image.originalName || 'Creation Details';
    this.detailBadge.textContent = image.type.toUpperCase();
    this.detailPrompt.textContent = image.prompt || 'No text prompt recorded for this upload.';
    this.detailDate.textContent = new Date(image.createdAt).toLocaleString();

    this.detailModal.classList.remove('hidden');
  }

  hideModal() {
    this.detailModal.classList.add('hidden');
    this.selectedImage = null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.HistoryGallery = new HistoryGallery();
});
