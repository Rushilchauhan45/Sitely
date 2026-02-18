import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, browserLocalPersistence } from 'firebase/auth';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================
// 🔥 FIREBASE CONFIG
// Replace with your Firebase project values:
// https://console.firebase.google.com → Project Settings → General → Web app
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyDU7VcxcCXvIRY6E5yi4lJqTC0qfrBSMTE",
  authDomain: "site-expense-tracker-81be5.firebaseapp.com",
  projectId: "site-expense-tracker-81be5",
  storageBucket: "site-expense-tracker-81be5.firebasestorage.app",
  messagingSenderId: "702244867304",
  appId: "1:702244867304:web:251eb7f906107f78b0cd5d",
  measurementId: "G-ZH8EPFGK6X"
};

// ============================================================
// 🔑 GOOGLE SIGN-IN CONFIG
// Google Cloud Console → APIs & Services → Credentials
// Create OAuth 2.0 Client ID (Web application type)
// Also add your Expo redirect URI to authorized redirect URIs
// ============================================================
export const GOOGLE_WEB_CLIENT_ID = '938490246877-m88a65fhba9clalnaupae1s7qdgd59tv.apps.googleusercontent.com';

// ============================================================
// 📘 FACEBOOK APP CONFIG
// Facebook Developers → https://developers.facebook.com/apps
// Create an app → Settings → Basic → App ID
// Also enable Facebook Login product in your Facebook app
// ============================================================
export const FACEBOOK_APP_ID = '1327625622462041';  // TODO: Replace with your Facebook App ID

// ============================================================
// 🛡️ ADMIN CREDENTIALS (hardcoded bypass — skips Firebase entirely)
// ============================================================
export const ADMIN_EMAIL = 'rushil@gmail.com';
export const ADMIN_PASSWORD = 'rushil@#45';
export const ADMIN_USER = {
  id: 'admin-001',
  name: 'Admin',
  email: 'rushil@gmail.com',
  phone: null as string | null,
  photoUri: null as string | null,
  isAdmin: true,
};

// Initialize Firebase (singleton — safe for hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with proper persistence per platform
// Fixes: "Unable to process request due to missing initial state"
let auth: ReturnType<typeof getAuth>;
try {
  if (Platform.OS === 'web') {
    auth = initializeAuth(app, {
      persistence: browserLocalPersistence,
    });
  } else {
    // getReactNativePersistence is exported via react-native conditional export
    // Use require() to avoid TypeScript resolution issues with conditional exports
    const { getReactNativePersistence } = require('firebase/auth') as {
      getReactNativePersistence: (storage: typeof AsyncStorage) => any;
    };
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
} catch {
  // Already initialized (hot reload) — just get existing instance
  auth = getAuth(app);
}

export { app, auth };
