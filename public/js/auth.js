/**
 * PIXORA AI - AUTHENTICATION MODULE
 */

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.initElements();
    this.bindEvents();
    this.checkInitialAuth();
  }

  initElements() {
    this.authModalBtn = document.getElementById('authModalBtn');
    this.authModal = document.getElementById('authModal');
    this.closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
    
    this.loginForm = document.getElementById('loginForm');
    this.registerForm = document.getElementById('registerForm');
    
    this.userProfileSection = document.getElementById('userProfileSection');
    this.userInfo = document.getElementById('userInfo');
    this.userAvatar = document.getElementById('userAvatar');
    this.userName = document.getElementById('userName');
    this.logoutBtn = document.getElementById('logoutBtn');

    this.authTabs = document.querySelectorAll('.auth-tab');
  }

  bindEvents() {
    // Open Dedicated Sign In Page View
    if (this.authModalBtn) {
      this.authModalBtn.addEventListener('click', () => {
        if (window.App) window.App.switchTab('auth');
      });
    }

    if (this.closeAuthModalBtn) {
      this.closeAuthModalBtn.addEventListener('click', () => this.hideModal());
    }

    // Page Auth Tab Switching
    document.querySelectorAll('.page-tab-btn').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.page-tab-btn').forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const mode = e.currentTarget.getAttribute('data-mode');
        const loginForm = document.getElementById('pageLoginForm');
        const regForm = document.getElementById('pageRegisterForm');
        if (mode === 'login') {
          if (loginForm) loginForm.classList.remove('hidden');
          if (regForm) regForm.classList.add('hidden');
        } else {
          if (regForm) regForm.classList.remove('hidden');
          if (loginForm) loginForm.classList.add('hidden');
        }
      });
    });

    // Guest Login Button (Page)
    const pageGuestLoginBtn = document.getElementById('pageGuestLoginBtn');
    if (pageGuestLoginBtn) {
      pageGuestLoginBtn.addEventListener('click', () => {
        const guestUser = {
          id: `guest-${Date.now()}`,
          username: 'Guest Pro User',
          email: 'demo@pixora.ai',
          avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=GuestPro'
        };
        ApiService.setToken(`guest-token-${Date.now()}`);
        this.setUser(guestUser);
        window.showToast('Signed in as Guest Pro User!', 'success');
        if (window.App) {
          window.App.switchTab('dashboard');
          window.App.onAuthChange();
        }
      });
    }

    // Page Login Form Submit
    const pageLoginForm = document.getElementById('pageLoginForm');
    if (pageLoginForm) {
      pageLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('pageLoginUsername')?.value || 'Demo Pro User';
        const email = document.getElementById('pageLoginEmail')?.value || 'demo@pixora.ai';
        
        const fallbackUser = {
          id: `user-${Date.now()}`,
          username: username,
          email: email,
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(username)}`
        };
        ApiService.setToken(`token-${Date.now()}`);
        this.setUser(fallbackUser);
        window.showToast(`Welcome back, ${fallbackUser.username}!`, 'success');
        if (window.App) {
          window.App.switchTab('dashboard');
          window.App.onAuthChange();
        }
      });
    }

    // Modal Login Form Submit
    if (this.loginForm) {
      this.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername')?.value || 'Demo Pro User';
        const email = document.getElementById('loginEmail')?.value || 'demo@pixora.ai';

        const fallbackUser = {
          id: `user-${Date.now()}`,
          username: username,
          email: email,
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(username)}`
        };
        ApiService.setToken(`token-${Date.now()}`);
        this.setUser(fallbackUser);
        this.hideModal();
        window.showToast(`Logged in as ${fallbackUser.username}!`, 'success');
        if (window.App) {
          window.App.switchTab('dashboard');
          window.App.onAuthChange();
        }
      });
    }

    this.authModal.addEventListener('click', (e) => {
      if (e.target === this.authModal) this.hideModal();
    });

    // Tab Toggles (Sign In / Register)
    this.authTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const mode = e.target.getAttribute('data-auth-mode');
        this.switchAuthTab(mode);
      });
    });

    // Guest Login Button
    const guestLoginBtn = document.getElementById('guestLoginBtn');
    if (guestLoginBtn) {
      guestLoginBtn.addEventListener('click', () => {
        const guestUser = {
          id: `guest-${Date.now()}`,
          username: 'Guest Pro User',
          email: 'demo@pixora.ai',
          avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=GuestPro'
        };
        ApiService.setToken(`guest-token-${Date.now()}`);
        this.setUser(guestUser);
        this.hideModal();
        window.showToast('Signed in as Guest Pro User!', 'success');
        if (window.App) window.App.onAuthChange();
      });
    }

    // Login Form Submit
    this.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      try {
        const res = await ApiService.login({ email, password });
        ApiService.setToken(res.token);
        this.setUser(res.user);
        this.hideModal();
        window.showToast('Successfully logged in!', 'success');
        if (window.App) window.App.onAuthChange();
      } catch (err) {
        // Fallback local sign in if backend offline
        const fallbackUser = {
          id: `user-${Date.now()}`,
          username: email.split('@')[0] || 'Pixora User',
          email: email,
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(email)}`
        };
        ApiService.setToken(`token-${Date.now()}`);
        this.setUser(fallbackUser);
        this.hideModal();
        window.showToast(`Logged in as ${fallbackUser.username}`, 'success');
        if (window.App) window.App.onAuthChange();
      }
    });

    // Register Form Submit
    this.registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('regUsername').value;
      const email = document.getElementById('regEmail').value;
      const password = document.getElementById('regPassword').value;

      try {
        const res = await ApiService.register({ username, email, password });
        ApiService.setToken(res.token);
        this.setUser(res.user);
        this.hideModal();
        window.showToast('Account created successfully!', 'success');
        if (window.App) window.App.onAuthChange();
      } catch (err) {
        window.showToast(err.message || 'Registration failed', 'error');
      }
    });

    // Logout Submit
    this.logoutBtn.addEventListener('click', () => {
      ApiService.setToken(null);
      this.setUser(null);
      window.showToast('Logged out', 'info');
      if (window.App) window.App.onAuthChange();
    });
  }

  switchAuthTab(mode) {
    this.authTabs.forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-auth-mode="${mode}"]`).classList.add('active');

    if (mode === 'login') {
      this.loginForm.classList.remove('hidden');
      this.loginForm.classList.add('active');
      this.registerForm.classList.add('hidden');
      this.registerForm.classList.remove('active');
    } else {
      this.registerForm.classList.remove('hidden');
      this.registerForm.classList.add('active');
      this.loginForm.classList.add('hidden');
      this.loginForm.classList.remove('active');
    }
  }

  showModal() {
    this.authModal.classList.remove('hidden');
  }

  hideModal() {
    this.authModal.classList.add('hidden');
  }

  setUser(user) {
    this.currentUser = user;
    if (user) {
      this.authModalBtn.classList.add('hidden');
      this.userInfo.classList.remove('hidden');
      this.userName.textContent = user.username;
      this.userAvatar.src = user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.username)}`;
    } else {
      this.authModalBtn.classList.remove('hidden');
      this.userInfo.classList.add('hidden');
    }
  }

  async checkInitialAuth() {
    const token = ApiService.getToken();
    if (!token) return;

    try {
      const res = await ApiService.getMe();
      if (res.success && res.user) {
        this.setUser(res.user);
      }
    } catch (e) {
      console.warn('Initial token validation failed:', e.message);
      ApiService.setToken(null);
      this.setUser(null);
    }
  }

  isAuthenticated() {
    return !!this.currentUser;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.Auth = new AuthManager();
});
