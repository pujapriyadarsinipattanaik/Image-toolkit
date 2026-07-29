/**
 * PIXORA AI - MASTER APPLICATION CONTROLLER
 */

class Application {
  constructor() {
    this.currentTab = 'dashboard';
    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.navTabs = document.querySelectorAll('.nav-tab');
    this.tabPages = document.querySelectorAll('.tab-page');
    this.switchTabBtns = document.querySelectorAll('.switch-tab-btn');
    this.quickUploadBtn = document.getElementById('quickUploadBtn');
    
    // Stats Elements
    this.statTotalCount = document.getElementById('statTotalCount');
    this.statGeneratedCount = document.getElementById('statGeneratedCount');
    this.statEditedCount = document.getElementById('statEditedCount');
    this.statStorageCount = document.getElementById('statStorageCount');
    this.recentCreationsGrid = document.getElementById('recentCreationsGrid');
  }

  bindEvents() {
    // Navigation Tabs
    this.navTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-tab');
        this.switchTab(target);
      });
    });

    // Switch Tab Buttons inside hero & cards
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.switch-tab-btn');
      if (btn) {
        const target = btn.getAttribute('data-target');
        this.switchTab(target);
      }

      // Tool shortcut button click
      const toolBtn = e.target.closest('.open-tool-btn');
      if (toolBtn) {
        const tool = toolBtn.getAttribute('data-tool');
        this.openStudioTool(tool);
      }
    });

    // Quick Upload Button in Topbar
    this.quickUploadBtn.addEventListener('click', () => {
      this.switchTab('utilities');
      const fileInput = document.getElementById('utilFileInput');
      if (fileInput) fileInput.click();
    });

    // Global Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl + Z = Undo in Editor
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (this.currentTab === 'editor' && window.Editor) {
          e.preventDefault();
          window.Editor.undo();
        }
      }
      // Ctrl + Y or Ctrl + Shift + Z = Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        if (this.currentTab === 'editor' && window.Editor) {
          e.preventDefault();
          window.Editor.redo();
        }
      }
    });

    // Load initial stats after DOM ready
    setTimeout(() => {
      this.refreshDashboardStats();
    }, 500);
  }

  switchTab(tabId) {
    this.currentTab = tabId;

    this.navTabs.forEach(tab => {
      if (tab.getAttribute('data-tab') === tabId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    this.tabPages.forEach(page => {
      if (page.id === `tab-${tabId}`) {
        page.classList.add('active');
      } else {
        page.classList.remove('active');
      }
    });

    if (tabId === 'history' && window.HistoryGallery) {
      window.HistoryGallery.loadHistory();
    }
    if (tabId === 'dashboard') {
      this.refreshDashboardStats();
    }
  }

  openStudioTool(toolName) {
    this.switchTab('editor');
    let panelId = 'panel-crop';

    if (toolName === 'bg-remover') panelId = 'panel-bg';
    if (toolName === 'eraser') panelId = 'panel-eraser';
    if (toolName === 'enhance') panelId = 'panel-adjust';

    const targetTab = document.querySelector(`.editor-tool-tab[data-panel="${panelId}"]`);
    if (targetTab) targetTab.click();
  }

  onAuthChange() {
    this.refreshDashboardStats();
    if (window.HistoryGallery) window.HistoryGallery.loadHistory();
  }

  async refreshDashboardStats() {
    if (!window.Auth || !window.Auth.isAuthenticated()) {
      this.statTotalCount.textContent = '0';
      this.statGeneratedCount.textContent = '0';
      this.statEditedCount.textContent = '0';
      this.statStorageCount.textContent = '0 MB';
      this.recentCreationsGrid.innerHTML = `
        <div class="empty-state glass-card" style="grid-column: 1/-1; padding: 2.5rem; text-align: center;">
          <i class="fa-regular fa-image" style="font-size: 2.5rem; margin-bottom: 0.75rem; opacity: 0.4;"></i>
          <p style="margin-bottom: 1rem;">Please sign in to save and track your creations.</p>
          <button type="button" class="btn btn-primary btn-sm open-auth-btn">
            <i class="fa-solid fa-right-to-bracket"></i> Sign In / Register Now
          </button>
        </div>
      `;
      const openAuthBtn = this.recentCreationsGrid.querySelector('.open-auth-btn');
      if (openAuthBtn) {
        openAuthBtn.addEventListener('click', () => {
          if (window.Auth) window.Auth.showModal();
        });
      }
      return;
    }

    try {
      const statsRes = await ApiService.getStats();
      if (statsRes.success && statsRes.stats) {
        const s = statsRes.stats;
        this.statTotalCount.textContent = s.totalCount || 0;
        this.statGeneratedCount.textContent = s.generatedCount || 0;
        this.statEditedCount.textContent = s.editedCount || 0;
        const mb = ((s.totalSizeBytes || 0) / (1024 * 1024)).toFixed(1);
        this.statStorageCount.textContent = `${mb} MB`;
      }

      // Load Recent 4 Images
      const historyRes = await ApiService.getHistory();
      if (historyRes.success && historyRes.images) {
        const recent = historyRes.images.slice(0, 4);
        if (recent.length === 0) {
          this.recentCreationsGrid.innerHTML = `
            <div class="empty-state glass-card" style="grid-column: 1/-1; padding: 2.5rem; text-align: center;">
              <i class="fa-regular fa-image" style="font-size: 2.5rem; margin-bottom: 0.75rem; opacity: 0.4;"></i>
              <p>No creations yet. Generate your first image or upload one to get started!</p>
            </div>
          `;
          return;
        }

        this.recentCreationsGrid.innerHTML = '';
        recent.forEach(img => {
          const card = document.createElement('div');
          card.className = 'gallery-card glass-card';
          card.innerHTML = `
            <span class="card-badge">${img.type.toUpperCase()}</span>
            <img src="${img.url}" alt="${img.originalName || 'Recent Creation'}">
            <div class="gallery-overlay">
              <h4 style="font-size: 0.9rem; font-weight: 700;">${img.originalName || 'Untitled'}</h4>
            </div>
          `;
          card.addEventListener('click', () => {
            if (window.HistoryGallery) window.HistoryGallery.showDetailModal(img);
          });
          this.recentCreationsGrid.appendChild(card);
        });
      }
    } catch (err) {
      console.warn('Failed to load dashboard stats:', err.message);
    }
  }
}

// Global Toast Notification System
window.showToast = function(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconClass = type === 'success' ? 'fa-solid fa-circle-check' :
                    type === 'error' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-info';

  toast.innerHTML = `
    <i class="${iconClass}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

document.addEventListener('DOMContentLoaded', () => {
  window.App = new Application();
});
