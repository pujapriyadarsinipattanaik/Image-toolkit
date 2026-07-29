// Firebase Web SDK Configuration & Module Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// Firebase App Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAh3Dw89WBnXgdhai8ihqjlxq1l5M5hnZE",
  authDomain: "ai-image-tool-kit.firebaseapp.com",
  projectId: "image-toolkit-40d9e",
  storageBucket: "image-toolkit-40d9e.firebasestorage.app",
  messagingSenderId: "274743730757",
  appId: "1:274743730757:web:4b0229f4f789653a5b792c"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);
const firebaseStorage = getStorage(firebaseApp);
const googleProvider = new GoogleAuthProvider();

// Expose globally on window for non-module integration
window.firebaseService = {
  app: firebaseApp,
  auth: firebaseAuth,
  storage: firebaseStorage,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
};

console.log("🔥 Firebase Initialized: Connected to project image-toolkit-40d9e");

export {
  firebaseApp,
  firebaseAuth,
  firebaseStorage,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
};
