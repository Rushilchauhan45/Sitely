import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, useColorScheme, Platform, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/lib/AppContext';
import { useThemeColors } from '@/constants/colors';
import { shadow } from '@/constants/shadows';

interface HelpStep {
  titleKey: string;
  descKey: string;
  icon: string;
  iconSet: 'ionicons' | 'material';
  color: string;
}

const helpSteps: HelpStep[] = [
  { titleKey: 'helpStep1Title', descKey: 'helpStep1Desc', icon: 'business', iconSet: 'ionicons', color: '#0EA5E9' },
  { titleKey: 'helpStep2Title', descKey: 'helpStep2Desc', icon: 'people', iconSet: 'ionicons', color: '#E8840C' },
  { titleKey: 'helpStep3Title', descKey: 'helpStep3Desc', icon: 'cube', iconSet: 'ionicons', color: '#F97316' },
  { titleKey: 'helpStep4Title', descKey: 'helpStep4Desc', icon: 'camera-outline', iconSet: 'ionicons', color: '#EC4899' },
  { titleKey: 'helpStep5Title', descKey: 'helpStep5Desc', icon: 'document-text-outline', iconSet: 'ionicons', color: '#6366F1' },
  { titleKey: 'helpStep6Title', descKey: 'helpStep6Desc', icon: 'notifications-outline', iconSet: 'ionicons', color: '#F59E0B' },
  { titleKey: 'helpStep7Title', descKey: 'helpStep7Desc', icon: 'person-circle-outline', iconSet: 'ionicons', color: '#10B981' },
];

export default function HelpScreen() {
  const { t } = useApp();
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  // Entry animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={['#0EA5E9', '#38BDF8', '#1A1A2E']}
        style={[styles.header, { paddingTop: insets.top + webTopInset + 12 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Pressable onPress={() => router.back()} hitSlop={16} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: 'Poppins_600SemiBold' }]}>
          {t('helpGuide')}
        </Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + webBottomInset + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Intro Card */}
          <View style={[styles.introCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <LinearGradient
              colors={['#0EA5E9', '#38BDF8']}
              style={styles.introIconCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="book-outline" size={32} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.introTitle, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>
              {t('helpGuide')}
            </Text>
            <Text style={[styles.introDesc, { color: colors.textSecondary, fontFamily: 'Poppins_400Regular' }]}>
              {t('helpIntro')}
            </Text>
          </View>

          {/* Steps */}
          {helpSteps.map((step, index) => (
            <View
              key={step.titleKey}
              style={[
                styles.stepCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                  ...shadow({ color: colors.cardShadow, offsetY: 3, opacity: 0.08, radius: 12, elevation: 2 }),
                },
              ]}
            >
              <View style={[styles.stepIconCircle, { backgroundColor: step.color + '15' }]}>
                {step.iconSet === 'ionicons' ? (
                  <Ionicons name={step.icon as any} size={24} color={step.color} />
                ) : (
                  <MaterialCommunityIcons name={step.icon as any} size={24} color={step.color} />
                )}
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
                  {t(step.titleKey)}
                </Text>
                <Text style={[styles.stepDesc, { color: colors.textSecondary, fontFamily: 'Poppins_400Regular' }]}>
                  {t(step.descKey)}
                </Text>
              </View>
            </View>
          ))}

          {/* Tip */}
          <View style={[styles.tipCard, { backgroundColor: '#FFF7ED', borderColor: '#FDBA7420' }]}>
            <Ionicons name="bulb-outline" size={22} color="#E8840C" />
            <Text style={[styles.tipText, { color: '#92400E', fontFamily: 'Poppins_500Medium' }]}>
              {t('helpTip')}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 18, borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerBackBtn: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, color: '#FFF', flex: 1, textAlign: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  introCard: {
    borderRadius: 20, padding: 28, marginBottom: 20, borderWidth: 1,
    alignItems: 'center', ...shadow({ offsetY: 4, opacity: 0.08, radius: 16, elevation: 3 }),
  },
  introIconCircle: {
    width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, ...shadow({ offsetY: 4, opacity: 0.15, radius: 12, elevation: 4 }),
  },
  introTitle: { fontSize: 22, marginBottom: 8, textAlign: 'center' },
  introDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  stepCard: {
    flexDirection: 'row', alignItems: 'flex-start', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1,
  },
  stepIconCircle: {
    width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 15, marginBottom: 4 },
  stepDesc: { fontSize: 13, lineHeight: 20 },
  tipCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 16,
    marginTop: 8, borderWidth: 1, gap: 12,
  },
  tipText: { fontSize: 13, flex: 1, lineHeight: 20 },
});
