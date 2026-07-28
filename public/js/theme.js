/**
 * VISION AI - THEME SWITCHER MODULE (DARK / LIGHT MODE)
 */

class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem('visionai_theme') || 'dark';
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);

    document.addEventListener('DOMContentLoaded', () => {
      this.bindBtn();
    });
  }

  bindBtn() {
    this.toggleBtn = document.getElementById('themeToggleBtn');
    if (this.toggleBtn) {
      this.updateBtnIcon();
      this.toggleBtn.addEventListener('click', () => this.toggle());
    }
  }

  toggle() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('visionai_theme', this.currentTheme);
    this.applyTheme(this.currentTheme);
    this.updateBtnIcon();
    window.showToast(`Switched to ${this.currentTheme.toUpperCase()} theme`, 'info');
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  updateBtnIcon() {
    if (!this.toggleBtn) return;
    if (this.currentTheme === 'light') {
      this.toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
      this.toggleBtn.title = 'Switch to Dark Mode';
    } else {
      this.toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
      this.toggleBtn.title = 'Switch to Light Mode';
    }
  }
}

window.ThemeManager = new ThemeManager();
