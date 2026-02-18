import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Dimensions, useColorScheme,
  Platform, Animated, ImageBackground, ImageSourcePropType, NativeSyntheticEvent,
  NativeScrollEvent, ScrollView, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/lib/AppContext';
import { useThemeColors } from '@/constants/colors';
import { Language } from '@/lib/i18n';
import { AnimatedPressable } from '@/components/ui';
import { shadow } from '@/constants/shadows';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const PARALLAX_FACTOR = 0.3;

const bgImages: ImageSourcePropType[] = [
  require('@/assets/images/onboarding-bg-1.png'),
  require('@/assets/images/onboarding-bg-2.png'),
  require('@/assets/images/onboarding-bg-3.png'),
];

interface SlideData {
  icon: string;
  iconSet: 'ionicons' | 'material';
  titleKey: string;
  descKey: string;
  gradient: string[];
  overlayColors: [string, string, string];
}

const slides: SlideData[] = [
  {
    icon: 'business', iconSet: 'ionicons',
    titleKey: 'onboarding1Title', descKey: 'onboarding1Desc',
    gradient: ['#E8840C', '#F59E0B'],
    overlayColors: ['rgba(0,0,0,0.18)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.82)'],
  },
  {
    icon: 'people', iconSet: 'ionicons',
    titleKey: 'onboarding2Title', descKey: 'onboarding2Desc',
    gradient: ['#0E7C86', '#14B8A6'],
    overlayColors: ['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.42)', 'rgba(0,0,0,0.80)'],
  },
  {
    icon: 'chart-line', iconSet: 'material',
    titleKey: 'onboarding3Title', descKey: 'onboarding3Desc',
    gradient: ['#0EA5E9', '#38BDF8'],
    overlayColors: ['rgba(0,0,0,0.22)', 'rgba(0,0,0,0.48)', 'rgba(0,0,0,0.83)'],
  },
];

const languages: { code: Language; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
];

export default function OnboardingScreen() {
  const { t, setLanguage, language, completeOnboarding } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  // ─── Animated values ───────────────────────────────────────
  const scrollX = useRef(new Animated.Value(0)).current;

  const entranceFade = useRef(new Animated.Value(0)).current;
  const entranceScale = useRef(new Animated.Value(1.1)).current;

  const langFade = useRef(new Animated.Value(0)).current;
  const langSlide = useRef(new Animated.Value(60)).current;
  const langScale = useRef(new Animated.Value(0.9)).current;

  const langOptionAnims = useRef(
    languages.map(() => ({
      fade: new Animated.Value(0),
      slide: new Animated.Value(40),
    }))
  ).current;

  // ─── Entrance animation on mount ──────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceFade, {
        toValue: 1, duration: 800, useNativeDriver: true,
      }),
      Animated.spring(entranceScale, {
        toValue: 1, tension: 20, friction: 7, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ─── Language picker entrance ──────────────────────────────
  useEffect(() => {
    if (showLangPicker) {
      langFade.setValue(0);
      langSlide.setValue(60);
      langScale.setValue(0.9);
      langOptionAnims.forEach(a => { a.fade.setValue(0); a.slide.setValue(40); });

      Animated.parallel([
        Animated.timing(langFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(langSlide, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
        Animated.spring(langScale, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true }),
      ]).start(() => {
        Animated.stagger(120, langOptionAnims.map(a =>
          Animated.parallel([
            Animated.timing(a.fade, { toValue: 1, duration: 350, useNativeDriver: true }),
            Animated.spring(a.slide, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
          ])
        )).start();
      });
    }
  }, [showLangPicker]);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      setShowLangPicker(true);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      scrollViewRef.current?.scrollTo({ x: prevIndex * width, animated: true });
      setCurrentIndex(prevIndex);
    }
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < slides.length) {
      setCurrentIndex(newIndex);
    }
  };

  const handleLangSelect = async (lang: Language) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setLanguage(lang);
    await completeOnboarding();
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const role = await AsyncStorage.getItem('@user_role');
      if (role === 'owner') {
        router.replace('/owner-dashboard' as any);
      } else {
        router.replace('/dashboard');
      }
    } catch {
      router.replace('/dashboard');
    }
  };

  // ─── Language picker screen ────────────────────────────────
  if (showLangPicker) {
    return (
      <View style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + webTopInset,
          paddingBottom: insets.bottom + webBottomInset,
        },
      ]}>
        <StatusBar barStyle="dark-content" />
        <Animated.View style={[
          styles.langContainer,
          {
            opacity: langFade,
            transform: [{ translateY: langSlide }, { scale: langScale }],
          },
        ]}>
          <LinearGradient
            colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
            style={styles.langIconCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="language" size={44} color="#FFF" />
          </LinearGradient>
          <Text style={[styles.langTitle, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>
            {t('selectLanguage')}
          </Text>
          <Text style={[styles.langSubtitle, { color: colors.textSecondary, fontFamily: 'Poppins_400Regular' }]}>
            {t('selectLanguageDesc') || 'Choose your preferred language'}
          </Text>
          {languages.map((lang, idx) => (
            <Animated.View
              key={lang.code}
              style={{
                width: '100%',
                opacity: langOptionAnims[idx].fade,
                transform: [{ translateY: langOptionAnims[idx].slide }],
              }}
            >
              <AnimatedPressable
                scaleValue={0.96}
                haptic={Haptics.ImpactFeedbackStyle.Medium}
                style={[
                  styles.langOption,
                  {
                    backgroundColor: language === lang.code ? colors.primaryLight : colors.surface,
                    borderColor: language === lang.code ? colors.primary : colors.border,
                    ...shadow({
                      color: colors.cardShadow,
                      offsetY: 4,
                      opacity: language === lang.code ? 0.15 : 0.06,
                      radius: 12,
                      elevation: language === lang.code ? 4 : 2,
                    }),
                  },
                ]}
                onPress={() => handleLangSelect(lang.code)}
              >
                <View style={[
                  styles.langFlagCircle,
                  { backgroundColor: language === lang.code ? colors.primary + '20' : colors.inputBg },
                ]}>
                  <Text style={{ fontSize: 20 }}>
                    {lang.code === 'en' ? '🇬🇧' : '🇮🇳'}
                  </Text>
                </View>
                <View style={styles.langTextWrap}>
                  <Text style={[styles.langText, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
                    {lang.native}
                  </Text>
                  <Text style={[styles.langSubtext, { color: colors.textSecondary, fontFamily: 'Poppins_400Regular' }]}>
                    {lang.label}
                  </Text>
                </View>
                {language === lang.code && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </AnimatedPressable>
            </Animated.View>
          ))}
        </Animated.View>
      </View>
    );
  }

  // ─── Sliding onboarding with image backgrounds ─────────────
  return (
    <Animated.View style={[
      styles.container,
      { opacity: entranceFade, transform: [{ scale: entranceScale }] },
    ]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <Animated.ScrollView
        ref={scrollViewRef as any}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onScrollEnd}
        style={styles.scrollView}
        contentContainerStyle={{ flexGrow: 1 }} // ✅ FIX: ensures content expands properly
      >
        {slides.map((slide, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

          const bgTranslateX = scrollX.interpolate({
            inputRange,
            outputRange: [width * PARALLAX_FACTOR, 0, -width * PARALLAX_FACTOR],
            extrapolate: 'clamp',
          });

          const contentTranslateX = scrollX.interpolate({
            inputRange,
            outputRange: [80, 0, -80],
            extrapolate: 'clamp',
          });

          const contentOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0, 1, 0],
            extrapolate: 'clamp',
          });

          const iconScale = scrollX.interpolate({
            inputRange,
            outputRange: [0.6, 1, 0.6],
            extrapolate: 'clamp',
          });

          const titleTranslateY = scrollX.interpolate({
            inputRange,
            outputRange: [30, 0, -30],
            extrapolate: 'clamp',
          });

          const descOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0, 1, 0],
            extrapolate: 'clamp',
          });

          return (
            <View key={index} style={styles.slideContainer}>
              {/* ✅ FIX: Parallax background fills full screen height */}
              <Animated.View style={[
                styles.bgImageWrapper,
                { transform: [{ translateX: bgTranslateX }] },
              ]}>
                <ImageBackground
                  source={bgImages[index]}
                  style={styles.bgImage}
                  resizeMode="cover" // ✅ FIX: cover fills the screen properly
                />
              </Animated.View>

              {/* Dark gradient overlay */}
              <LinearGradient
                colors={slide.overlayColors as [string, string, string]}
                locations={[0, 0.45, 1]}
                style={styles.overlay}
              >
                {/* Top area: skip button */}
                <Animated.View style={[
                  styles.skipRow,
                  { paddingTop: insets.top + webTopInset + 12, opacity: contentOpacity },
                ]}>
                  <Pressable
                    onPress={() => setShowLangPicker(true)}
                    hitSlop={16}
                    style={styles.skipBtn}
                  >
                    <Text style={[styles.skipText, { fontFamily: 'Poppins_500Medium' }]}>
                      {t('skip')}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.8)" />
                  </Pressable>
                </Animated.View>

                <View style={styles.spacer} />

                {/* Animated slide content */}
                <Animated.View style={[
                  styles.contentArea,
                  {
                    opacity: contentOpacity,
                    transform: [{ translateX: contentTranslateX }],
                  },
                ]}>
                  <Animated.View style={{ transform: [{ scale: iconScale }] }}>
                    <LinearGradient
                      colors={slide.gradient as [string, string]}
                      style={styles.iconCircle}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {slide.iconSet === 'ionicons' ? (
                        <Ionicons name={slide.icon as any} size={36} color="#FFF" />
                      ) : (
                        <MaterialCommunityIcons name={slide.icon as any} size={36} color="#FFF" />
                      )}
                    </LinearGradient>
                  </Animated.View>

                  <Animated.Text
                    style={[
                      styles.slideTitle,
                      { fontFamily: 'Poppins_700Bold', transform: [{ translateY: titleTranslateY }] },
                    ]}
                  >
                    {t(slide.titleKey)}
                  </Animated.Text>

                  <Animated.Text
                    style={[
                      styles.slideDesc,
                      { fontFamily: 'Poppins_400Regular', opacity: descOpacity },
                    ]}
                  >
                    {t(slide.descKey)}
                  </Animated.Text>
                </Animated.View>

                {/* Bottom controls */}
                <View style={[styles.bottomRow, { paddingBottom: insets.bottom + webBottomInset + 28 }]}>
                  {index > 0 ? (
                    <AnimatedPressable
                      style={styles.backBtn}
                      haptic={Haptics.ImpactFeedbackStyle.Light}
                      scaleValue={0.9}
                      onPress={handleBack}
                    >
                      <Ionicons name="arrow-back" size={22} color="#FFF" />
                    </AnimatedPressable>
                  ) : (
                    <View style={styles.backBtnPlaceholder} />
                  )}

                  <View style={styles.dotsRow}>
                    {slides.map((_, i) => {
                      const dotWidth = scrollX.interpolate({
                        inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                        outputRange: [8, 32, 8],
                        extrapolate: 'clamp',
                      });
                      const dotOpacity = scrollX.interpolate({
                        inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                        outputRange: [0.35, 1, 0.35],
                        extrapolate: 'clamp',
                      });
                      return (
                        <Animated.View
                          key={i}
                          style={[
                            styles.dot,
                            { width: dotWidth, opacity: dotOpacity, backgroundColor: '#FFF' },
                          ]}
                        />
                      );
                    })}
                  </View>

                  <AnimatedPressable
                    style={styles.nextBtn}
                    haptic={Haptics.ImpactFeedbackStyle.Medium}
                    scaleValue={0.9}
                    onPress={handleNext}
                  >
                    <LinearGradient
                      colors={slide.gradient as [string, string]}
                      style={styles.nextBtnGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons
                        name={index < slides.length - 1 ? 'arrow-forward' : 'checkmark'}
                        size={24}
                        color="#FFF"
                      />
                    </LinearGradient>
                  </AnimatedPressable>
                </View>
              </LinearGradient>
            </View>
          );
        })}
      </Animated.ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // ✅ FIX 1: Added flex: 1 so the root container takes full screen height
  container: { flex: 1, backgroundColor: '#000' },
  scrollView: { flex: 1 },

  // ✅ FIX 2: slideContainer uses explicit width + height instead of '100%'
  slideContainer: { width, height, overflow: 'hidden' },

  // ✅ FIX 3: bgImageWrapper uses absoluteFillObject correctly, no inline overrides
  bgImageWrapper: {
    ...StyleSheet.absoluteFillObject,
    left: -width * PARALLAX_FACTOR,
    right: -width * PARALLAX_FACTOR,
    width: width * (1 + PARALLAX_FACTOR * 2),
  },

  // ✅ FIX 4: bgImage covers the full height — removed 300px fixed height & resizeMode conflict
  bgImage: {
    width: '100%',
    height: '100%',
  },

  overlay: { ...StyleSheet.absoluteFillObject, flex: 1 },

  skipRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  skipText: { fontSize: 15, color: 'rgba(255,255,255,0.85)' },

  spacer: { flex: 1 },

  contentArea: {
    paddingHorizontal: 32,
    paddingBottom: 36,
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...shadow({ offsetY: 8, opacity: 0.4, radius: 20, elevation: 10 }),
  },
  slideTitle: {
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 14,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  slideDesc: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 25,
    letterSpacing: 0.1,
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  dotsRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 5, borderRadius: 2.5 },

  backBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnPlaceholder: { width: 50 },

  nextBtn: { width: 58, height: 58, borderRadius: 29 },
  nextBtnGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow({ offsetY: 6, opacity: 0.4, radius: 16, elevation: 8 }),
  },

  langContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    gap: 14,
  },
  langIconCircle: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 6,
    ...shadow({ offsetY: 8, opacity: 0.2, radius: 20, elevation: 8 }),
  },
  langTitle: { fontSize: 28, marginBottom: 2 },
  langSubtitle: { fontSize: 14, marginBottom: 10, textAlign: 'center' },
  langOption: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  langFlagCircle: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  langTextWrap: { flex: 1 },
  langText: { fontSize: 18 },
  langSubtext: { fontSize: 13, marginTop: 2 },
});
