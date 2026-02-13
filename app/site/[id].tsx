import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, useColorScheme, Platform } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/lib/AppContext';
import { useThemeColors } from '@/constants/colors';
import { Site } from '@/lib/types';
import * as store from '@/lib/storage';
import * as Haptics from 'expo-haptics';

interface MenuOption {
  icon: string;
  iconSet: 'ionicons' | 'material';
  label: string;
  route: string;
  gradient: [string, string];
}

export default function SiteHomeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useApp();
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const [site, setSite] = useState<Site | null>(null);
  const [workerCount, setWorkerCount] = useState(0);
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

  const menuOptions: MenuOption[] = [
    { icon: 'person-add', iconSet: 'ionicons', label: 'addWorkers', route: '/site/add-worker', gradient: ['#E8840C', '#F59E0B'] },
    { icon: 'people', iconSet: 'ionicons', label: 'allWorkers', route: '/site/workers', gradient: ['#0E7C86', '#14B8A6'] },
    { icon: 'clipboard-text-clock', iconSet: 'material', label: 'dailyHajari', route: '/site/hajari', gradient: ['#7C3AED', '#A78BFA'] },
    { icon: 'receipt', iconSet: 'ionicons', label: 'addExpense', route: '/site/expense', gradient: ['#EF4444', '#F87171'] },
    { icon: 'cash', iconSet: 'ionicons', label: 'payToWorker', route: '/site/payment', gradient: ['#10B981', '#34D399'] },
    { icon: 'time', iconSet: 'ionicons', label: 'paymentHistory', route: '/site/payment-history', gradient: ['#2196F3', '#60A5FA'] },
    { icon: 'camera', iconSet: 'ionicons', label: 'sitePhotos', route: '/site/photos', gradient: ['#EC4899', '#F472B6'] },
  ];

  const navigateTo = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: route as any, params: { siteId: site.id } });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colorScheme === 'dark' ? ['#1A1F2E', '#0F1219'] : ['#FFF3E0', '#F5F6FA']}
        style={[styles.header, { paddingTop: insets.top + webTopInset + 8 }]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={16}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>
            {t('siteHome')}
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={[styles.siteInfoCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <Text style={[styles.siteName, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
            {site.name}
          </Text>
          <View style={styles.siteMetaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location" size={14} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                {site.location || '-'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people" size={14} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                {workerCount}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: site.isRunning ? colors.success + '20' : colors.textTertiary + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: site.isRunning ? colors.success : colors.textTertiary }]} />
              <Text style={[styles.statusText, { color: site.isRunning ? colors.success : colors.textTertiary, fontFamily: 'Inter_500Medium' }]}>
                {site.isRunning ? t('running') : t('done')}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.menuGrid, { paddingBottom: insets.bottom + webBottomInset + 20 }]} showsVerticalScrollIndicator={false}>
        {menuOptions.map((option) => (
          <Pressable
            key={option.label}
            style={({ pressed }) => [
              styles.menuCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              },
            ]}
            onPress={() => navigateTo(option.route)}
          >
            <LinearGradient
              colors={option.gradient}
              style={styles.menuIconBg}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {option.iconSet === 'ionicons' ? (
                <Ionicons name={option.icon as any} size={24} color="#FFF" />
              ) : (
                <MaterialCommunityIcons name={option.icon as any} size={24} color="#FFF" />
              )}
            </LinearGradient>
            <Text style={[styles.menuLabel, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
              {t(option.label)}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { fontSize: 18, flex: 1, textAlign: 'center' },
  siteInfoCard: { borderRadius: 16, padding: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  siteName: { fontSize: 20, marginBottom: 10 },
  siteMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 5, marginLeft: 'auto' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11 },
  menuGrid: { padding: 16, gap: 10 },
  menuCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  menuIconBg: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { fontSize: 15, flex: 1 },
});
