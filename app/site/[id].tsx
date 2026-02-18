import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, useColorScheme, Platform, Animated, Alert, ActivityIndicator, LayoutAnimation, UIManager } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/lib/AppContext';
import { useThemeColors } from '@/constants/colors';
import { Site } from '@/lib/types';
import { AnimatedPressable } from '@/components/ui';
import { shadow } from '@/constants/shadows';
import * as store from '@/lib/storage';
import * as Haptics from 'expo-haptics';
import { File as ExpoFile, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SubOption {
  icon: string;
  iconSet: 'ionicons' | 'material';
  label: string;
  route: string;
  color: string;
}

interface MenuCategory {
  id: string;
  icon: string;
  iconSet: 'ionicons' | 'material';
  label: string;
  gradient: [string, string];
  route?: string; // direct route for non-expandable categories
  subOptions?: SubOption[];
}

export default function SiteHomeScreen() {
  const { id, readOnly: readOnlyParam } = useLocalSearchParams<{ id: string; readOnly?: string }>();
  const isReadOnly = readOnlyParam === '1';
  const { t } = useApp();
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const [site, setSite] = useState<Site | null>(null);
  const [workerCount, setWorkerCount] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const sites = await store.getSites();
        const found = sites.find(s => s.id === id);
        setSite(found || null);
        if (found) {
          const workers = await store.getWorkers(found.id);
          setWorkerCount(workers.length);
        }
      })();
    }, [id])
  );

  if (!site) return null;

  const menuCategories: MenuCategory[] = [
    {
      id: 'workers',
      icon: 'people',
      iconSet: 'ionicons',
      label: 'workerManagement',
      gradient: ['#0EA5E9', '#0284C7'],
      subOptions: isReadOnly ? [
        { icon: 'people', iconSet: 'ionicons', label: 'allWorkers', route: '/site/workers', color: '#0E7C86' },
        { icon: 'time', iconSet: 'ionicons', label: 'paymentHistory', route: '/site/payment-history', color: '#2196F3' },
      ] : [
        { icon: 'person-add', iconSet: 'ionicons', label: 'addWorkers', route: '/site/add-worker', color: '#E8840C' },
        { icon: 'people', iconSet: 'ionicons', label: 'allWorkers', route: '/site/workers', color: '#0E7C86' },
        { icon: 'clipboard-text-clock', iconSet: 'material', label: 'dailyHajari', route: '/site/hajari', color: '#7C3AED' },
        { icon: 'receipt', iconSet: 'ionicons', label: 'addExpense', route: '/site/expense', color: '#EF4444' },
        { icon: 'cash', iconSet: 'ionicons', label: 'payToWorker', route: '/site/payment', color: '#10B981' },
        { icon: 'time', iconSet: 'ionicons', label: 'paymentHistory', route: '/site/payment-history', color: '#2196F3' },
      ],
    },
    {
      id: 'materials',
      icon: 'cube',
      iconSet: 'ionicons',
      label: 'materials',
      gradient: ['#F97316', '#FB923C'],
      route: '/site/materials',
    },
    {
      id: 'photos',
      icon: 'camera',
      iconSet: 'ionicons',
      label: 'sitePhotos',
      gradient: ['#EC4899', '#F472B6'],
      route: '/site/photos',
    },
    {
      id: 'reports',
      icon: 'document-text',
      iconSet: 'ionicons',
      label: 'reports',
      gradient: ['#6366F1', '#818CF8'],
      route: '/site/reports',
    },
  ];

  const toggleExpand = (catId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedId(prev => prev === catId ? null : catId);
  };

  const navigateTo = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const params: Record<string, string> = { id: site.id, siteId: site.id };
    if (route === '/site/reports') params.siteName = site.name;
    router.push({ pathname: route as any, params });
  };

  const handleCategoryPress = (cat: MenuCategory) => {
    if (cat.route) {
      navigateTo(cat.route);
    } else if (cat.subOptions) {
      toggleExpand(cat.id);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#0EA5E9', '#0284C7', '#1A1A2E']}
        style={[styles.header, { paddingTop: insets.top + webTopInset + 8 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={16} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </Pressable>
          <Text style={[styles.headerTitle, { color: '#FFF', fontFamily: 'Poppins_600SemiBold' }]} numberOfLines={1}>
            {t('siteHome')}
          </Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={[styles.siteInfoCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <Text style={[styles.siteName, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>
            {site.name}
          </Text>
          {site.siteCode ? (
            <Text style={[styles.metaText, { color: colors.primary, fontFamily: 'Poppins_600SemiBold', fontSize: 13, marginBottom: 4 }]}>
              Code: {site.siteCode}
            </Text>
          ) : null}
          {isReadOnly && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
              <Ionicons name="eye" size={14} color="#F59E0B" />
              <Text style={{ color: '#F59E0B', fontSize: 12, fontFamily: 'Poppins_600SemiBold' }}>
                {t('viewOnly') || 'View Only'}
              </Text>
            </View>
          )}
          <View style={styles.siteMetaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location" size={14} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.textSecondary, fontFamily: 'Poppins_400Regular' }]}>
                {site.location || '-'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people" size={14} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.textSecondary, fontFamily: 'Poppins_400Regular' }]}>
                {workerCount}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: site.isRunning ? colors.success + '20' : colors.textTertiary + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: site.isRunning ? colors.success : colors.textTertiary }]} />
              <Text style={[styles.statusText, { color: site.isRunning ? colors.success : colors.textTertiary, fontFamily: 'Poppins_500Medium' }]}>
                {site.isRunning ? t('running') : t('done')}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.menuGrid, { paddingBottom: insets.bottom + webBottomInset + 20 }]} showsVerticalScrollIndicator={false}>
        {menuCategories.map((cat) => (
          <View key={cat.id}>
            {/* Category Card */}
            <AnimatedPressable
              scaleValue={0.97}
              style={[
                styles.menuCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: expandedId === cat.id ? colors.primary + '40' : colors.borderLight,
                  ...shadow({ color: colors.cardShadow, offsetY: 4, opacity: 0.12, radius: 12, elevation: 3 }),
                },
              ]}
              onPress={() => handleCategoryPress(cat)}
            >
              <LinearGradient
                colors={cat.gradient}
                style={styles.menuIconBg}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {cat.iconSet === 'ionicons' ? (
                  <Ionicons name={cat.icon as any} size={24} color="#FFF" />
                ) : (
                  <MaterialCommunityIcons name={cat.icon as any} size={24} color="#FFF" />
                )}
              </LinearGradient>
              <Text style={[styles.menuLabel, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
                {t(cat.label)}
              </Text>
              <View style={[styles.menuArrow, { backgroundColor: colors.inputBg }]}>
                <Ionicons
                  name={cat.subOptions ? (expandedId === cat.id ? 'chevron-up' : 'chevron-down') : 'chevron-forward'}
                  size={16}
                  color={colors.textTertiary}
                />
              </View>
            </AnimatedPressable>

            {/* Sub-options (expandable) */}
            {cat.subOptions && expandedId === cat.id && (
              <View style={styles.subOptionsContainer}>
                {cat.subOptions.map((sub) => (
                  <Pressable
                    key={sub.label}
                    style={[
                      styles.subOptionCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.borderLight,
                      },
                    ]}
                    onPress={() => navigateTo(sub.route)}
                  >
                    <View style={[styles.subOptionIcon, { backgroundColor: sub.color + '15' }]}>
                      {sub.iconSet === 'ionicons' ? (
                        <Ionicons name={sub.icon as any} size={18} color={sub.color} />
                      ) : (
                        <MaterialCommunityIcons name={sub.icon as any} size={18} color={sub.color} />
                      )}
                    </View>
                    <Text style={[styles.subOptionLabel, { color: colors.text, fontFamily: 'Poppins_500Medium' }]}>
                      {t(sub.label)}
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerBackBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, flex: 1, textAlign: 'center' },
  siteInfoCard: { borderRadius: 18, padding: 16, borderWidth: 1, ...shadow({ offsetY: 4, opacity: 0.08, radius: 12, elevation: 4 }) },
  siteName: { fontSize: 20, marginBottom: 10 },
  siteMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 5, marginLeft: 'auto' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11 },
  menuGrid: { padding: 16, gap: 10 },
  menuCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, borderWidth: 1, gap: 14 },
  menuIconBg: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', ...shadow({ radius: 6 }) },
  menuLabel: { fontSize: 15, flex: 1 },
  menuArrow: { width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  subOptionsContainer: { marginLeft: 24, marginTop: 4, marginBottom: 6, gap: 4 },
  subOptionCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1, gap: 12 },
  subOptionIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  subOptionLabel: { fontSize: 13, flex: 1 },
});
