import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Dimensions, useColorScheme, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/lib/AppContext';
import { useThemeColors } from '@/constants/colors';
import { Language } from '@/lib/i18n';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface SlideData {
  icon: string;
  iconSet: 'ionicons' | 'material';
  titleKey: string;
  descKey: string;
  gradient: string[];
}

const slides: SlideData[] = [
  { icon: 'business', iconSet: 'ionicons', titleKey: 'onboarding1Title', descKey: 'onboarding1Desc', gradient: ['#E8840C', '#F59E0B'] },
  { icon: 'people', iconSet: 'ionicons', titleKey: 'onboarding2Title', descKey: 'onboarding2Desc', gradient: ['#0E7C86', '#14B8A6'] },
  { icon: 'chart-line', iconSet: 'material', titleKey: 'onboarding3Title', descKey: 'onboarding3Desc', gradient: ['#2196F3', '#60A5FA'] },
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
  const flatListRef = useRef<FlatList>(null);
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowLangPicker(true);
    }
  };

  const handleLangSelect = async (lang: Language) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setLanguage(lang);
    await completeOnboarding();
    router.replace('/dashboard');
  };

  const renderSlide = ({ item }: { item: SlideData }) => (
    <View style={[styles.slide, { width }]}>
      <LinearGradient
        colors={item.gradient as [string, string]}
        style={styles.iconCircle}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {item.iconSet === 'ionicons' ? (
          <Ionicons name={item.icon as any} size={64} color="#FFF" />
        ) : (
          <MaterialCommunityIcons name={item.icon as any} size={64} color="#FFF" />
        )}
      </LinearGradient>
      <Text style={[styles.slideTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
        {t(item.titleKey)}
      </Text>
      <Text style={[styles.slideDesc, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
        {t(item.descKey)}
      </Text>
    </View>
  );

  if (showLangPicker) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + webTopInset, paddingBottom: insets.bottom + webBottomInset }]}>
        <View style={styles.langContainer}>
          <View style={[styles.langIconCircle, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="language" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.langTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
            {t('selectLanguage')}
          </Text>
          {languages.map((lang) => (
            <Pressable
              key={lang.code}
              style={({ pressed }) => [
                styles.langOption,
                {
                  backgroundColor: language === lang.code ? colors.primaryLight : colors.surface,
                  borderColor: language === lang.code ? colors.primary : colors.border,
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
              onPress={() => handleLangSelect(lang.code)}
            >
              <Text style={[styles.langText, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                {lang.native}
              </Text>
              <Text style={[styles.langSubtext, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                {lang.label}
              </Text>
              {language === lang.code && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} style={styles.langCheck} />
              )}
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + webTopInset, paddingBottom: insets.bottom + webBottomInset }]}>
      <View style={styles.skipRow}>
        <Pressable onPress={() => setShowLangPicker(true)} hitSlop={16}>
          <Text style={[styles.skipText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
            {t('skip')}
          </Text>
        </Pressable>
      </View>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(_, i) => i.toString()}
      />
      <View style={styles.bottomRow}>
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === currentIndex ? colors.primary : colors.border },
                i === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.nextBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleNext}
        >
          <Ionicons name={currentIndex < slides.length - 1 ? "arrow-forward" : "checkmark"} size={24} color="#FFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 24, paddingTop: 12 },
  skipText: { fontSize: 16 },
  slide: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  iconCircle: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  slideTitle: { fontSize: 28, textAlign: 'center', marginBottom: 16 },
  slideDesc: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 32, paddingBottom: 24 },
  dotsRow: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 24, borderRadius: 12 },
  nextBtn: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  langContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 16 },
  langIconCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  langTitle: { fontSize: 24, marginBottom: 12 },
  langOption: { width: '100%', flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20, borderRadius: 16, borderWidth: 2 },
  langText: { fontSize: 18, flex: 1 },
  langSubtext: { fontSize: 14 },
  langCheck: { marginLeft: 12 },
});
