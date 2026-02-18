import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView,
  Platform, ScrollView, Alert, Animated, Dimensions, useColorScheme,
  BackHandler, ActivityIndicator, Modal, Image,
} from 'react-native';

const showAlert = (title: string, message?: string) => {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
};

import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/lib/AppContext';
import { useThemeColors } from '@/constants/colors';
import * as authService from '@/lib/auth';
import * as Haptics from 'expo-haptics';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as WebBrowser from 'expo-web-browser';
import { GOOGLE_WEB_CLIENT_ID, FACEBOOK_APP_ID } from '@/lib/firebase';
import { shadow } from '../constants/shadows';

if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

const { width } = Dimensions.get('window');

export default function AuthScreen() {
  const { t, setUser } = useApp();
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  // State
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const formSlide = useRef(new Animated.Value(50)).current;
  const formFade = useRef(new Animated.Value(0)).current;

  // Google Auth
  const [_googleRequest, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: '702244867304-ftv15nir69gjb99ccg1i1ktafeil673o.apps.googleusercontent.com',
  });

  // Facebook Auth
  const [_fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
    clientId: FACEBOOK_APP_ID,
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      if (id_token) {
        (async () => {
          setLoading(true);
          try {
            const user = await authService.googleSignIn(id_token);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await navigateAfterAuth(user);
          } catch (e: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showAlert(t('authError'), e?.message || t('authError'));
          } finally {
            setLoading(false);
          }
        })();
      }
    }
  }, [googleResponse]);

  // Block hardware back
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

  // Facebook auth response handler
  useEffect(() => {
    if (fbResponse?.type === 'success') {
      const { access_token } = fbResponse.params;
      if (access_token) {
        (async () => {
          setLoading(true);
          try {
            const user = await authService.facebookSignIn(access_token);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await navigateAfterAuth(user);
          } catch (e: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showAlert(t('authError'), e?.message || t('authError'));
          } finally {
            setLoading(false);
          }
        })();
      }
    }
  }, [fbResponse]);

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
      Animated.timing(formSlide, { toValue: 0, duration: 500, delay: 200, useNativeDriver: true }),
      Animated.timing(formFade, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  // ─── Navigation ─────────────────────────────────────────
  const navigateAfterAuth = async (user: authService.AuthUser) => {
    setUser(user);
    router.replace('/onboarding');
  };

  // ─── Toggle signup/signin ──────────────────────────────
  const animateSwitch = () => {
    Animated.sequence([
      Animated.timing(formFade, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(formFade, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
    setIsSignUp(!isSignUp);
    setName(''); setEmail(''); setPassword(''); setConfirmPassword(''); setPhoneNumber('');
  };

  // ─── Password Strength ─────────────────────────────────
  const getPasswordStrength = (pwd: string): { level: number; label: string; color: string } => {
    if (!pwd) return { level: 0, label: '', color: 'transparent' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { level: 1, label: 'Weak', color: '#EF4444' };
    if (score <= 2) return { level: 2, label: 'Fair', color: '#F59E0B' };
    if (score <= 3) return { level: 3, label: 'Good', color: '#22C55E' };
    return { level: 4, label: 'Strong', color: '#10B981' };
  };
  const pwdStrength = getPasswordStrength(password);

  // ─── Email Submit ──────────────────────────────────────
  const handleEmailSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert(t('authError'), t('required'));
      return;
    }
    if (isSignUp && !name.trim()) {
      showAlert(t('authError'), t('required'));
      return;
    }
    if (password.length < 6) {
      showAlert(t('authError'), t('passwordTooShort'));
      return;
    }
    if (isSignUp && password !== confirmPassword) {
      showAlert(t('authError'), t('passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      let user: authService.AuthUser;
      if (isSignUp) {
        user = await authService.emailSignUp(name.trim(), email.trim(), password);
      } else {
        user = await authService.emailSignIn(email.trim(), password);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await navigateAfterAuth(user);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e?.code === 'auth/email-already-in-use' ? t('emailAlreadyInUse')
        : e?.code === 'auth/invalid-email' ? t('invalidEmail')
        : e?.code === 'auth/user-not-found' ? t('userNotFound')
        : e?.code === 'auth/wrong-password' ? t('wrongPassword')
        : e?.code === 'auth/invalid-credential' ? t('invalidCredential')
        : e?.code === 'auth/too-many-requests' ? t('tooManyRequests')
        : e?.message || t('authError');
      showAlert(t('authError'), msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Google Sign-In ────────────────────────────────────
  const handleGoogleSignIn = async () => {
    if (Platform.OS === 'web') {
      setLoading(true);
      try {
        const user = await authService.googleSignIn();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await navigateAfterAuth(user);
      } catch (e: any) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        if (e?.code !== 'auth/popup-closed-by-user') {
          showAlert(t('authError'), e?.message || t('authError'));
        }
      } finally {
        setLoading(false);
      }
    } else {
      try {
        await googlePromptAsync();
      } catch (e: any) {
        showAlert(t('authError'), e?.message || t('authError'));
      }
    }
  };

  // ─── Facebook Sign-In ───────────────────────────────
  const handleFacebookSignIn = async () => {
    if (Platform.OS === 'web') {
      setLoading(true);
      try {
        const user = await authService.facebookSignIn();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await navigateAfterAuth(user);
      } catch (e: any) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        if (e?.code !== 'auth/popup-closed-by-user') {
          showAlert(t('authError'), e?.message || t('authError'));
        }
      } finally {
        setLoading(false);
      }
    } else {
      try {
        await fbPromptAsync();
      } catch (e: any) {
        showAlert(t('authError'), e?.message || t('authError'));
      }
    }
  };

  // ─── Forgot Password ──────────────────────────────────
  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      showAlert(t('authError'), t('required'));
      return;
    }
    setResetLoading(true);
    try {
      await authService.forgotPassword(resetEmail.trim());
      showAlert(t('resetPassword'), t('resetEmailSent'));
      setShowForgotModal(false);
      setResetEmail('');
    } catch (e: any) {
      const msg = e?.code === 'auth/user-not-found' ? t('userNotFound')
        : e?.code === 'auth/invalid-email' ? t('invalidEmail')
        : e?.message || t('authError');
      showAlert(t('authError'), msg);
    } finally {
      setResetLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header gradient */}
      <LinearGradient
        colors={['#0EA5E9', '#0284C7', '#1A1A2E']}
        style={[styles.topGradient, { paddingTop: insets.top + webTopInset + 24 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View style={[styles.logoSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: logoScale }] }]}>
          <View style={styles.logoCircle}>
            <Image
              source={require('@/assets/images/android-icon-foreground.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.appName, { fontFamily: 'Poppins_700Bold' }]}>{t('appTagline')}</Text>
          <Text style={[styles.subtitle, { fontFamily: 'Poppins_400Regular' }]}>
            {isSignUp ? t('signUpSubtitle') : t('loginSubtitle')}
          </Text>
        </Animated.View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.formContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[styles.formScroll, { paddingBottom: insets.bottom + webBottomInset + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.borderLight, opacity: formFade, transform: [{ translateY: formSlide }] }]}>

            {/* Form Title */}
            <Text style={[styles.formTitle, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
              {isSignUp ? t('signUp') : t('signIn')}
            </Text>

            {/* Full Name (signup only) */}
            {isSignUp && (
              <View style={styles.inputGroup}>
                <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Ionicons name="person-outline" size={20} color={colors.textTertiary} />
                  <TextInput
                    style={[styles.input, { color: colors.text, fontFamily: 'Poppins_400Regular' }]}
                    value={name}
                    onChangeText={setName}
                    placeholder={t('fullName')}
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            {/* Email */}
            <View style={styles.inputGroup}>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Ionicons name="mail-outline" size={20} color={colors.textTertiary} />
                <TextInput
                  style={[styles.input, { color: colors.text, fontFamily: 'Poppins_400Regular' }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('email')}
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} />
                <TextInput
                  style={[styles.input, { color: colors.text, fontFamily: 'Poppins_400Regular' }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('password')}
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={12}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textTertiary} />
                </Pressable>
              </View>
            </View>

            {/* Password Strength (signup only) */}
            {isSignUp && password.length > 0 && (
              <View style={styles.strengthRow}>
                <View style={styles.strengthBarBg}>
                  {[1, 2, 3, 4].map(i => (
                    <View
                      key={i}
                      style={[
                        styles.strengthSegment,
                        { backgroundColor: i <= pwdStrength.level ? pwdStrength.color : colors.border },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: pwdStrength.color, fontFamily: 'Poppins_500Medium' }]}>
                  {pwdStrength.label}
                </Text>
              </View>
            )}

            {/* Confirm Password (signup only) */}
            {isSignUp && (
              <View style={styles.inputGroup}>
                <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} />
                  <TextInput
                    style={[styles.input, { color: colors.text, fontFamily: 'Poppins_400Regular' }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder={t('confirmPassword')}
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} hitSlop={12}>
                    <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textTertiary} />
                  </Pressable>
                </View>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <Text style={styles.mismatchText}>{t('passwordMismatch')}</Text>
                )}
              </View>
            )}

            {/* Phone Number (signup only) */}
            {isSignUp && (
              <View style={styles.inputGroup}>
                <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Text style={[styles.phonePrefix, { color: colors.textSecondary, fontFamily: 'Poppins_500Medium' }]}>+91</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, fontFamily: 'Poppins_400Regular' }]}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder={t('phoneNumber')}
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              </View>
            )}

            {/* Forgot password (sign-in only) */}
            {!isSignUp && (
              <Pressable
                onPress={() => { setResetEmail(email); setShowForgotModal(true); }}
                style={styles.forgotRow}
              >
                <Text style={[styles.forgotText, { color: colors.primary, fontFamily: 'Poppins_500Medium' }]}>
                  {t('forgotPassword')}
                </Text>
              </Pressable>
            )}

            {/* Submit Button */}
            <Pressable
              onPress={handleEmailSubmit}
              disabled={loading}
              style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
            >
              <LinearGradient
                colors={['#0EA5E9', '#38BDF8']}
                style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Text style={[styles.submitText, { fontFamily: 'Poppins_600SemiBold' }]}>
                      {isSignUp ? t('signUp') : t('signIn')}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                  </>
                )}
              </LinearGradient>
            </Pressable>

            {/* Toggle signup/signin */}
            <View style={styles.switchRow}>
              <Text style={[styles.switchText, { color: colors.textSecondary, fontFamily: 'Poppins_400Regular' }]}>
                {isSignUp ? t('haveAccount') : t('noAccount')}
              </Text>
              <Pressable onPress={animateSwitch} hitSlop={12}>
                <Text style={[styles.switchLink, { color: colors.primary, fontFamily: 'Poppins_600SemiBold' }]}>
                  {isSignUp ? t('signIn') : t('signUp')}
                </Text>
              </Pressable>
            </View>

            {/* ─── Divider ─── */}
            {/*<View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textTertiary, fontFamily: 'Poppins_400Regular' }]}>
                {t('orContinueWith')}
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>*/}

            {/* ─── Social Sign-In Buttons ─── */}
            
            {/*<View style={styles.socialRow}>
              
              <Pressable
                onPress={handleGoogleSignIn}
                disabled={loading}
                style={({ pressed }) => [
                  styles.socialBtn,
                  { backgroundColor: colors.inputBg, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <View style={styles.googleIconBg}>
                  <Text style={styles.googleG}>G</Text>
                </View>
                <Text style={[styles.socialText, { color: colors.text, fontFamily: 'Poppins_500Medium' }]}>
                  Google
                </Text>
              </Pressable>

              {/* Facebook */}
              {/*<Pressable
                onPress={handleFacebookSignIn}
                disabled={loading}
                style={({ pressed }) => [
                  styles.socialBtn,
                  { backgroundColor: colors.inputBg, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <View style={styles.fbIconBg}>
                  <Text style={styles.fbF}>f</Text>
                </View>
                <Text style={[styles.socialText, { color: colors.text, fontFamily: 'Poppins_500Medium' }]}>
                  Facebook
                </Text>
              </Pressable>
            </View> */}

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── Forgot Password Modal ─── */}
      <Modal
        visible={showForgotModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForgotModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
              {t('resetPassword')}
            </Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary, fontFamily: 'Poppins_400Regular' }]}>
              {t('resetPasswordDesc')}
            </Text>

            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border, marginBottom: 20 }]}>
              <Ionicons name="mail-outline" size={20} color={colors.textTertiary} />
              <TextInput
                style={[styles.input, { color: colors.text, fontFamily: 'Poppins_400Regular' }]}
                value={resetEmail}
                onChangeText={setResetEmail}
                placeholder={t('email')}
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Pressable onPress={handleForgotPassword} disabled={resetLoading}>
              <LinearGradient
                colors={['#0EA5E9', '#38BDF8']}
                style={[styles.submitBtn, resetLoading && { opacity: 0.7 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {resetLoading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={[styles.submitText, { fontFamily: 'Poppins_600SemiBold' }]}>
                    {t('sendResetLink')}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable onPress={() => setShowForgotModal(false)} style={{ marginTop: 16, alignSelf: 'center' }}>
              <Text style={[styles.switchLink, { color: colors.primary, fontFamily: 'Poppins_600SemiBold' }]}>
                {t('backToLogin')}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topGradient: { paddingHorizontal: 32, paddingBottom: 40 },
  logoSection: { alignItems: 'center' },
  logoCircle: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12, overflow: 'hidden',
  },
  logoImage: { width: 76, height: 76 , borderRadius:10 },
  appName: { fontSize: 22, color: '#FFF', marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  formContainer: { flex: 1, marginTop: -24 },
  formScroll: { paddingHorizontal: 20 },
  formCard: { borderRadius: 24, padding: 24, borderWidth: 1, ...shadow({ offsetY: 4, opacity: 0.08, radius: 16, elevation: 4 }) },
  formTitle: { fontSize: 22, marginBottom: 20, textAlign: 'center' },
  inputGroup: { marginBottom: 14 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, gap: 12, height: 56 },
  input: { flex: 1, fontSize: 15, height: '100%' },
  phonePrefix: { fontSize: 15 },
  mismatchText: { color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 4 },
  forgotRow: { alignSelf: 'flex-end', marginBottom: 8, marginTop: -6 },
  forgotText: { fontSize: 13 },
  submitBtn: { height: 56, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  submitText: { color: '#FFF', fontSize: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 18, gap: 6 },
  switchText: { fontSize: 14 },
  switchLink: { fontSize: 14 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12 },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 52, borderRadius: 14, borderWidth: 1, gap: 10,
  },
  googleIconBg: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center',
  },
  googleG: {
    fontSize: 16, fontWeight: '700',
    color: '#4285F4',
  },
  fbIconBg: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#1877F2',
    justifyContent: 'center', alignItems: 'center',
  },
  fbF: {
    fontSize: 16, fontWeight: '700',
    color: '#FFF', marginTop: -1,
  },
  socialText: { fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 400, borderRadius: 24, padding: 28 },
  modalTitle: { fontSize: 20, marginBottom: 8, textAlign: 'center' },
  modalDesc: { fontSize: 14, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: -6, marginBottom: 14, paddingHorizontal: 4 },
  strengthBarBg: { flex: 1, flexDirection: 'row', gap: 4 },
  strengthSegment: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, minWidth: 44 },
});
