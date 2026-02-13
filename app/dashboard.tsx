import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, useColorScheme, Platform, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/lib/AppContext';
import { useThemeColors } from '@/constants/colors';
import { Site } from '@/lib/types';
import * as store from '@/lib/storage';
import * as Haptics from 'expo-haptics';

export default function DashboardScreen() {
  const { t } = useApp();
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  useFocusEffect(
    useCallback(() => {
      loadSites();
    }, [])
  );

  const loadSites = async () => {
    setLoading(true);
    const data = await store.getSites();
    setSites(data.reverse());
    setLoading(false);
  };

  const handleDeleteSite = (site: Site) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      t('delete'),
      `${site.name}?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            await store.deleteSite(site.id);
            loadSites();
          },
        },
      ]
    );
  };

  const siteTypeIcons: Record<string, string> = {
    residential: 'home',
    commercial: 'business',
    rowHouse: 'home',
    tenament: 'apartment',
    shop: 'storefront',
    other: 'construct',
  };

  const renderSite = ({ item }: { item: Site }) => (
    <Pressable
      style={({ pressed }) => [
        styles.siteCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderLight,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: '/site/[id]', params: { id: item.id } });
      }}
      onLongPress={() => handleDeleteSite(item)}
    >
      <View style={styles.siteCardHeader}>
        <LinearGradient
          colors={['#E8840C', '#F59E0B']}
          style={styles.siteIconBg}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={(siteTypeIcons[item.type] || 'construct') as any} size={20} color="#FFF" />
        </LinearGradient>
        <View style={styles.siteCardInfo}>
          <Text style={[styles.siteCardName, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.siteCardLocation, { color: colors.textSecondary, fontFamily: 'Poppins_400Regular' }]} numberOfLines={1}>
            {item.location}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.isRunning ? colors.success + '20' : colors.textTertiary + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: item.isRunning ? colors.success : colors.textTertiary }]} />
          <Text style={[styles.statusText, { color: item.isRunning ? colors.success : colors.textTertiary, fontFamily: 'Poppins_500Medium' }]}>
            {item.isRunning ? t('running') : t('done')}
          </Text>
        </View>
      </View>
      <View style={styles.siteCardDetails}>
        <View style={styles.siteDetailItem}>
          <Ionicons name="person" size={14} color={colors.textTertiary} />
          <Text style={[styles.siteDetailText, { color: colors.textSecondary, fontFamily: 'Poppins_400Regular' }]}>
            {item.ownerName}
          </Text>
        </View>
        <View style={styles.siteDetailItem}>
          <Ionicons name="calendar" size={14} color={colors.textTertiary} />
          <Text style={[styles.siteDetailText, { color: colors.textSecondary, fontFamily: 'Poppins_400Regular' }]}>
            {new Date(item.startDate).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colorScheme === 'dark' ? ['#1A1F2E', '#0F1219'] : ['#FFF3E0', '#F5F6FA']}
        style={[styles.header, { paddingTop: insets.top + webTopInset + 16 }]}
      >
        <Text style={[styles.greeting, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>
          {t('welcome')}
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.createBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/create-site');
          }}
        >
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={[styles.createBtnText, { fontFamily: 'Poppins_600SemiBold' }]}>
            {t('createNewSite')}
          </Text>
        </Pressable>
      </LinearGradient>

      <View style={styles.listHeader}>
        <Text style={[styles.listTitle, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
          {t('viewExistingSites')}
        </Text>
        <Text style={[styles.listCount, { color: colors.textTertiary, fontFamily: 'Poppins_400Regular' }]}>
          {sites.length}
        </Text>
      </View>

      <FlatList
        data={sites}
        renderItem={renderSite}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + webBottomInset + 20 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="office-building-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: 'Poppins_500Medium' }]}>
              {t('noSitesYet')}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  greeting: { fontSize: 22, marginBottom: 20, lineHeight: 30 },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, gap: 8 },
  createBtnText: { color: '#FFF', fontSize: 16 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 12 },
  listTitle: { fontSize: 18 },
  listCount: { fontSize: 14, backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  listContent: { paddingHorizontal: 16 },
  siteCard: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  siteCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  siteIconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  siteCardInfo: { flex: 1, marginLeft: 12 },
  siteCardName: { fontSize: 16 },
  siteCardLocation: { fontSize: 13, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11 },
  siteCardDetails: { flexDirection: 'row', gap: 16 },
  siteDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  siteDetailText: { fontSize: 12 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16 },
});
