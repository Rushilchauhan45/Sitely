/**
 * Auth Service — Firebase v9 modular SDK
 * Handles: Email/Password, Google Sign-In, Phone OTP, Forgot Password, Admin bypass
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithCredential,
  signInWithPopup,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type UserCredential,
  type ConfirmationResult,
} from 'firebase/auth';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { auth, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_USER } from './firebase';

// ─── Types ───────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  photoUri: string | null;
  isAdmin: boolean;
}

// ─── Secure Storage Keys ─────────────────────────────────────
const SECURE_KEY_USER = 'auth_user_session';

// ─── Session Persistence (SecureStore) ───────────────────────
export async function saveSession(user: AuthUser): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // SecureStore not available on web, use localStorage
      localStorage.setItem(SECURE_KEY_USER, JSON.stringify(user));
    } else {
      await SecureStore.setItemAsync(SECURE_KEY_USER, JSON.stringify(user));
    }
  } catch (e) {
    console.warn('Failed to save session:', e);
  }
}

export async function getSession(): Promise<AuthUser | null> {
  try {
    let data: string | null;
    if (Platform.OS === 'web') {
      data = localStorage.getItem(SECURE_KEY_USER);
    } else {
      data = await SecureStore.getItemAsync(SECURE_KEY_USER);
    }
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.warn('Failed to get session:', e);
    return null;
  }
}

export async function clearSession(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(SECURE_KEY_USER);
    } else {
      await SecureStore.deleteItemAsync(SECURE_KEY_USER);
    }
  } catch (e) {
    console.warn('Failed to clear session:', e);
  }
}

// ─── Helper: Firebase User → AuthUser ────────────────────────
function firebaseUserToAuthUser(credential: UserCredential): AuthUser {
  const u = credential.user;
  return {
    id: u.uid,
    name: u.displayName || u.email?.split('@')[0] || 'User',
    email: u.email || '',
    phone: u.phoneNumber || null,
    photoUri: u.photoURL || null,
    isAdmin: false,
  };
}

// ─── Admin Check ─────────────────────────────────────────────
export function isAdminCredentials(email: string, password: string): boolean {
  return (
    email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase() &&
    password === ADMIN_PASSWORD
  );
}

export function getAdminUser(): AuthUser {
  return { ...ADMIN_USER };
}

// ─── Email + Password Sign Up ────────────────────────────────
export async function emailSignUp(
  name: string,
  email: string,
  password: string
): Promise<AuthUser> {
  // Admin bypass
  if (isAdminCredentials(email, password)) {
    const admin = getAdminUser();
    admin.name = name || admin.name;
    await saveSession(admin);
    return admin;
  }

  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);

  // Set display name on Firebase profile
  if (name.trim()) {
    await updateProfile(credential.user, { displayName: name.trim() });
  }

  const user = firebaseUserToAuthUser(credential);
  user.name = name.trim() || user.name;
  await saveSession(user);
  return user;
}

// ─── Email + Password Sign In ────────────────────────────────
export async function emailSignIn(
  email: string,
  password: string
): Promise<AuthUser> {
  // Admin bypass
  if (isAdminCredentials(email, password)) {
    const admin = getAdminUser();
    await saveSession(admin);
    return admin;
  }

  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const user = firebaseUserToAuthUser(credential);
  await saveSession(user);
  return user;
}

// ─── Google Sign-In ──────────────────────────────────────────
/**
 * Web: Uses Firebase signInWithPopup — no OAuth Client ID needed.
 * Native: Uses idToken from expo-auth-session or @react-native-google-signin.
 */
export async function googleSignIn(idToken?: string): Promise<AuthUser> {
  let result: UserCredential;

  if (Platform.OS === 'web') {
    // Web: use Firebase's built-in popup flow (no separate OAuth client ID required)
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    result = await signInWithPopup(auth, provider);
  } else {
    // Native: requires idToken from expo-auth-session or Google Sign-In SDK
    if (!idToken) {
      throw new Error('Google Sign-In on native requires an ID token.');
    }
    const credential = GoogleAuthProvider.credential(idToken);
    result = await signInWithCredential(auth, credential);
  }

  const user = firebaseUserToAuthUser(result);
  await saveSession(user);
  return user;
}

// ─── Facebook Sign-In ────────────────────────────────────────
/**
 * Web: Uses Firebase signInWithPopup — no separate config needed beyond Firebase console.
 * Native: Uses accessToken from expo-auth-session Facebook provider.
 */
export async function facebookSignIn(accessToken?: string): Promise<AuthUser> {
  let result: UserCredential;

  if (Platform.OS === 'web') {
    // Web: use Firebase's built-in popup flow
    const provider = new FacebookAuthProvider();
    provider.addScope('email');
    provider.addScope('public_profile');
    result = await signInWithPopup(auth, provider);
  } else {
    // Native: requires accessToken from expo-auth-session
    if (!accessToken) {
      throw new Error('Facebook Sign-In on native requires an access token.');
    }
    const credential = FacebookAuthProvider.credential(accessToken);
    result = await signInWithCredential(auth, credential);
  }

  const user = firebaseUserToAuthUser(result);
  await saveSession(user);
  return user;
}

// ─── Phone OTP — Send Verification Code ──────────────────────
// Note: Full phone auth on native requires @react-native-firebase/auth + EAS Build.
// This implementation works on web. For native, consider using a custom backend
// that verifies phone numbers and issues custom Firebase tokens.
let confirmationResult: ConfirmationResult | null = null;

export async function sendPhoneOTP(phoneNumber: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    // Web: use RecaptchaVerifier
    const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    });
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return true;
  }

  // Native: Phone auth requires @react-native-firebase/auth native module
  // For now, throw a helpful error
  throw new Error(
    'Phone OTP on native requires additional setup. ' +
    'Please use Email or Google Sign-In, or set up EAS Build with @react-native-firebase/auth.'
  );
}

export async function verifyPhoneOTP(otp: string): Promise<AuthUser> {
  if (!confirmationResult) {
    throw new Error('No OTP request found. Please request OTP first.');
  }

  const credential = await confirmationResult.confirm(otp);
  const user = firebaseUserToAuthUser(credential);
  await saveSession(user);
  confirmationResult = null;
  return user;
}

// ─── Forgot Password ────────────────────────────────────────
export async function forgotPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

// ─── Update Profile ──────────────────────────────────────────
export async function updateUserProfile(updates: {
  name?: string;
  photoUri?: string | null;
  phone?: string | null;
}): Promise<AuthUser | null> {
  const currentUser = auth.currentUser;
  const session = await getSession();

  if (currentUser) {
    // Firebase user — update Firebase profile
    const profileUpdates: { displayName?: string; photoURL?: string | null } = {};
    if (updates.name !== undefined) profileUpdates.displayName = updates.name;
    if (updates.photoUri !== undefined) profileUpdates.photoURL = updates.photoUri;
    await updateProfile(currentUser, profileUpdates);
  }

  // Update local session
  if (session) {
    if (updates.name !== undefined) session.name = updates.name;
    if (updates.photoUri !== undefined) session.photoUri = updates.photoUri;
    if (updates.phone !== undefined) session.phone = updates.phone;
    await saveSession(session);
    return session;
  }

  return null;
}

// ─── Logout ──────────────────────────────────────────────────
export async function logout(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    // May fail if not signed in with Firebase (e.g., admin bypass)
  }
  await clearSession();
}
