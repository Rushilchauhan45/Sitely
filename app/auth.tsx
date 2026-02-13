import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/lib/AppContext';
import { useThemeColors } from '@/constants/colors';
import * as store from '@/lib/storage';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function AuthScreen() {
  const { t, setUser } = useApp();
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const formSlide = useRef(new Animated.Value(50)).current;
  const formFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
      Animated.timing(formSlide, { toValue: 0, duration: 500, delay: 200, useNativeDriver: true }),
      Animated.timing(formFade, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const animateSwitch = () => {
    Animated.sequence([
      Animated.timing(formFade, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(formFade, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    setIsSignUp(!isSignUp);
    setName('');
    setEmail('');
    setPassword('');
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('', t('required'));
      return;
    }
    if (isSignUp && !name.trim()) {
      Alert.alert('', t('required'));
      return;
    }
    setLoading(true);
    try {
      let authUser;
      if (isSignUp) {
        authUser = await store.signUp(name.trim(), email.trim(), password);
      } else {
        authUser = await store.signIn(email.trim(), password);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setUser(authUser);
      const onboardingDone = await store.isOnboardingDone();
      if (onboardingDone) {
        router.replace('/dashboard');
      } else {
        router.replace('/onboarding');
      }
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('authError'), e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colorScheme === 'dark' ? ['#0D2818', '#0D1117'] : ['#1B4332', '#2D6A4F']}
        style={[styles.topGradient, { paddingTop: insets.top + webTopInset + 32 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View style={[styles.logoSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: logoScale }] }]}>
          <View style={styles.logoCircle}>
            <Ionicons name="construct" size={36} color="#FFF" />
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
            <Text style={[styles.formTitle, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
              {isSignUp ? t('signUp') : t('signIn')}
            </Text>

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

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
            >
              <LinearGradient
                colors={['#1B4332', '#2D6A4F']}
                style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <Text style={[styles.submitText, { fontFamily: 'Poppins_600SemiBold' }]}>...</Text>
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
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

import { useColorScheme } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1 },
  topGradient: { paddingHorizontal: 32, paddingBottom: 48 },
  logoSection: { alignItems: 'center' },
  logoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  appName: { fontSize: 22, color: '#FFF', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  formContainer: { flex: 1, marginTop: -24 },
  formScroll: { paddingHorizontal: 20 },
  formCard: { borderRadius: 24, padding: 28, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  formTitle: { fontSize: 24, marginBottom: 24, textAlign: 'center' },
  inputGroup: { marginBottom: 16 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, gap: 12, height: 56 },
  input: { flex: 1, fontSize: 15, height: '100%' },
  submitBtn: { height: 56, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  submitText: { color: '#FFF', fontSize: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, gap: 6 },
  switchText: { fontSize: 14 },
  switchLink: { fontSize: 14 },
});
