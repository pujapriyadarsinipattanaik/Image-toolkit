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
    // Open Auth Modal when clicking Sign In / Register button in navbar
    if (this.authModalBtn) {
      this.authModalBtn.addEventListener('click', () => {
        this.showModal();
      });
    }

    if (this.closeAuthModalBtn) {
      this.closeAuthModalBtn.addEventListener('click', () => this.hideModal());
    }

    if (this.authModal) {
      this.authModal.addEventListener('click', (e) => {
        if (e.target === this.authModal) this.hideModal();
      });
    }

    // Modal Auth Tab Switching (Sign In / Create Account)
    this.authTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const mode = e.target.getAttribute('data-auth-mode');
        if (mode) this.switchAuthTab(mode);
      });
    });

    // Page Auth Tab Switching
    document.querySelectorAll('.page-tab-btn').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.page-tab-btn').forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const mode = e.currentTarget.getAttribute('data-mode');
        const loginForm = document.getElementById('pageLoginForm');
        const regForm = document.getElementById('pageRegisterForm');
        if (mode === 'login') {
          if (loginForm) { loginForm.classList.remove('hidden'); loginForm.classList.add('active'); }
          if (regForm) { regForm.classList.add('hidden'); regForm.classList.remove('active'); }
        } else {
          if (regForm) { regForm.classList.remove('hidden'); regForm.classList.add('active'); }
          if (loginForm) { loginForm.classList.add('hidden'); loginForm.classList.remove('active'); }
        }
      });
    });

    // Guest Login Function
    const handleGuestLogin = () => {
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
    };

    const guestLoginBtn = document.getElementById('guestLoginBtn');
    if (guestLoginBtn) guestLoginBtn.addEventListener('click', handleGuestLogin);

    const pageGuestLoginBtn = document.getElementById('pageGuestLoginBtn');
    if (pageGuestLoginBtn) pageGuestLoginBtn.addEventListener('click', handleGuestLogin);

    // Helper for Login Handler
    const processLogin = async (email, password, usernameHint = '') => {
      // 1. Try Firebase Auth if available
      if (window.firebaseService && email && password) {
        try {
          const fbRes = await window.firebaseService.signInWithEmailAndPassword(window.firebaseService.auth, email, password);
          const fbUser = fbRes.user;
          const user = {
            id: fbUser.uid,
            username: fbUser.displayName || usernameHint || email.split('@')[0],
            email: fbUser.email,
            avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(fbUser.email)}`
          };
          ApiService.setToken(`fb-token-${fbUser.uid}`);
          this.setUser(user);
          this.hideModal();
          window.showToast(`Welcome back, ${user.username}! (Firebase)`, 'success');
          if (window.App) window.App.onAuthChange();
          return;
        } catch (fbErr) {
          console.warn('Firebase Auth login skipped/failed:', fbErr.message);
        }
      }

      // 2. Try Local API Login
      try {
        const res = await ApiService.login({ email, password });
        if (res.success && res.token) {
          ApiService.setToken(res.token);
          this.setUser(res.user);
          this.hideModal();
          window.showToast(`Welcome back, ${res.user.username}!`, 'success');
          if (window.App) window.App.onAuthChange();
          return;
        }
      } catch (err) {
        console.warn('API Login failed, using local session:', err.message);
      }
      
      // 3. Fallback local sign in if backend API offline or guest/demo
      const user = {
        id: `user-${Date.now()}`,
        username: usernameHint || email.split('@')[0] || 'Pixora User',
        email: email || 'demo@pixora.ai',
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(usernameHint || email)}`
      };
      ApiService.setToken(`token-${Date.now()}`);
      this.setUser(user);
      this.hideModal();
      window.showToast(`Logged in as ${user.username}!`, 'success');
      if (window.App) window.App.onAuthChange();
    };

    // Helper for Register Handler
    const processRegister = async (username, email, password) => {
      // 1. Try Firebase Auth Registration if available
      if (window.firebaseService && email && password) {
        try {
          const fbRes = await window.firebaseService.createUserWithEmailAndPassword(window.firebaseService.auth, email, password);
          const fbUser = fbRes.user;
          if (username) {
            await window.firebaseService.updateProfile(fbUser, { displayName: username });
          }
          const user = {
            id: fbUser.uid,
            username: username || fbUser.email.split('@')[0],
            email: fbUser.email,
            avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(fbUser.email)}`
          };
          ApiService.setToken(`fb-token-${fbUser.uid}`);
          this.setUser(user);
          this.hideModal();
          window.showToast(`Account created via Firebase! Welcome ${user.username}!`, 'success');
          if (window.App) window.App.onAuthChange();
          return;
        } catch (fbErr) {
          console.warn('Firebase Auth registration failed:', fbErr.message);
        }
      }

      // 2. Try Local API Registration
      try {
        const res = await ApiService.register({ username, email, password });
        if (res.success && res.token) {
          ApiService.setToken(res.token);
          this.setUser(res.user);
          this.hideModal();
          window.showToast(`Account created! Welcome, ${res.user.username}!`, 'success');
          if (window.App) window.App.onAuthChange();
          return;
        }
      } catch (err) {
        console.warn('API Register failed, using local session:', err.message);
      }

      // 3. Fallback local registration
      const user = {
        id: `user-${Date.now()}`,
        username: username || 'Pixora User',
        email: email || 'user@example.com',
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(username || email)}`
      };
      ApiService.setToken(`token-${Date.now()}`);
      this.setUser(user);
      this.hideModal();
      window.showToast(`Account created! Welcome ${user.username}!`, 'success');
      if (window.App) window.App.onAuthChange();
    };

    // Modal Login Form Submit
    if (this.loginForm) {
      this.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername')?.value || '';
        const email = document.getElementById('loginEmail')?.value || 'demo@pixora.ai';
        const password = document.getElementById('loginPassword')?.value || '123456';
        await processLogin(email, password, username);
      });
    }

    // Modal Register Form Submit
    if (this.registerForm) {
      this.registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('regUsername')?.value || 'New User';
        const email = document.getElementById('regEmail')?.value || '';
        const password = document.getElementById('regPassword')?.value || '';
        await processRegister(username, email, password);
      });
    }

    // Page Login Form Submit
    const pageLoginForm = document.getElementById('pageLoginForm');
    if (pageLoginForm) {
      pageLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('pageLoginUsername')?.value || '';
        const email = document.getElementById('pageLoginEmail')?.value || 'demo@pixora.ai';
        const password = document.getElementById('pageLoginPassword')?.value || '123456';
        await processLogin(email, password, username);
      });
    }

    // Page Register Form Submit
    const pageRegisterForm = document.getElementById('pageRegisterForm');
    if (pageRegisterForm) {
      pageRegisterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('pageRegUsername')?.value || '';
        const email = document.getElementById('pageRegEmail')?.value || '';
        const password = document.getElementById('pageRegPassword')?.value || '';
        await processRegister(username, email, password);
      });
    }

    // Logout
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener('click', () => {
        ApiService.setToken(null);
        this.setUser(null);
        window.showToast('Signed out successfully', 'info');
        if (window.App) window.App.onAuthChange();
      });
    }
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
