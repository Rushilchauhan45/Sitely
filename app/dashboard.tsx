import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, useColorScheme, Platform, Alert, Modal, Animated, Dimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/lib/AppContext';
import { useThemeColors } from '@/constants/colors';
import { Site } from '@/lib/types';
import { Language } from '@/lib/i18n';
import * as store from '@/lib/storage';
import * as Haptics from 'expo-haptics';

const { height: screenHeight } = Dimensions.get('window');

const languages: { code: Language; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
];

export default function DashboardScreen() {
  const { t, user, setUser, language, setLanguage } = useApp();
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const sheetAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

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

  const openSheet = () => {
    setShowProfile(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.spring(sheetAnim, { toValue: 1, tension: 65, friction: 10, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(sheetAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setShowProfile(false);
      setShowLangPicker(false);
    });
  };

  const handleLogout = () => {
    closeSheet();
    setTimeout(() => {
      Alert.alert(t('logout'), t('logoutConfirm'), [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            await store.logoutUser();
            setUser(null);
            router.replace('/auth');
          },
        },
      ]);
    }, 300);
  };

  const handleLangChange = async (lang: Language) => {
    Haptics.selectionAsync();
    await setLanguage(lang);
    setShowLangPicker(false);
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

  const getInitials = (name: string) => name?.trim().split(' ').map(p => p[0]?.toUpperCase() || '').slice(0, 2).join('') || '?';

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
          colors={['#1B4332', '#2D6A4F']}
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

  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colorScheme === 'dark' ? ['#0D2818', '#0D1117'] : ['#1B4332', '#2D6A4F']}
        style={[styles.header, { paddingTop: insets.top + webTopInset + 16 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.profileRow}>
          <Pressable onPress={openSheet} style={({ pressed }) => [styles.profileBtn, { opacity: pressed ? 0.8 : 1 }]}>
            <View style={styles.avatarCircle}>
              <Text style={[styles.avatarText, { fontFamily: 'Poppins_700Bold' }]}>
                {getInitials(user?.name || '')}
              </Text>
            </View>
            <View>
              <Text style={[styles.greetingSmall, { fontFamily: 'Poppins_400Regular' }]}>
                {t('hello')},
              </Text>
              <Text style={[styles.userName, { fontFamily: 'Poppins_600SemiBold' }]} numberOfLines={1}>
                {user?.name || ''}
              </Text>
            </View>
          </Pressable>
          <View style={styles.headerBadge}>
            <Ionicons name="construct" size={20} color="rgba(255,255,255,0.6)" />
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.createBtn,
            { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/create-site');
          }}
        >
          <Ionicons name="add-circle" size={22} color="#1B4332" />
          <Text style={[styles.createBtnText, { fontFamily: 'Poppins_600SemiBold' }]}>
            {t('createNewSite')}
          </Text>
        </Pressable>
      </LinearGradient>

      <View style={styles.listHeader}>
        <Text style={[styles.listTitle, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
          {t('viewExistingSites')}
        </Text>
        <View style={[styles.listCount, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.listCountText, { color: colors.primary, fontFamily: 'Poppins_600SemiBold' }]}>
            {sites.length}
          </Text>
        </View>
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

      <Modal visible={showProfile} transparent animationType="none" onRequestClose={closeSheet}>
        <View style={styles.modalContainer}>
          <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
          </Animated.View>
          <Animated.View style={[styles.bottomSheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + webBottomInset + 20, transform: [{ translateY: sheetTranslateY }] }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            {!showLangPicker ? (
              <>
                <View style={styles.sheetProfile}>
                  <View style={[styles.sheetAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.sheetAvatarText, { fontFamily: 'Poppins_700Bold' }]}>
                      {getInitials(user?.name || '')}
                    </Text>
                  </View>
                  <Text style={[styles.sheetName, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
                    {user?.name}
                  </Text>
                  <Text style={[styles.sheetEmail, { color: colors.textSecondary, fontFamily: 'Poppins_400Regular' }]}>
                    {user?.email}
                  </Text>
                </View>

                <View style={[styles.sheetDivider, { backgroundColor: colors.borderLight }]} />

                <Pressable
                  style={({ pressed }) => [styles.sheetOption, { backgroundColor: pressed ? colors.inputBg : 'transparent' }]}
                  onPress={() => setShowLangPicker(true)}
                >
                  <View style={[styles.sheetOptionIcon, { backgroundColor: '#7C3AED20' }]}>
                    <Ionicons name="language" size={20} color="#7C3AED" />
                  </View>
                  <Text style={[styles.sheetOptionText, { color: colors.text, fontFamily: 'Poppins_500Medium' }]}>
                    {t('changeLanguage')}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.sheetOption, { backgroundColor: pressed ? colors.errorLight : 'transparent' }]}
                  onPress={handleLogout}
                >
                  <View style={[styles.sheetOptionIcon, { backgroundColor: colors.errorLight }]}>
                    <Ionicons name="log-out-outline" size={20} color={colors.error} />
                  </View>
                  <Text style={[styles.sheetOptionText, { color: colors.error, fontFamily: 'Poppins_500Medium' }]}>
                    {t('logout')}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.langHeader}>
                  <Pressable onPress={() => setShowLangPicker(false)} hitSlop={12}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                  </Pressable>
                  <Text style={[styles.langTitle, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
                    {t('changeLanguage')}
                  </Text>
                  <View style={{ width: 22 }} />
                </View>

                {languages.map((lang) => (
                  <Pressable
                    key={lang.code}
                    style={({ pressed }) => [
                      styles.langOption,
                      {
                        backgroundColor: language === lang.code ? colors.primaryLight : pressed ? colors.inputBg : 'transparent',
                        borderColor: language === lang.code ? colors.primary : colors.borderLight,
                      },
                    ]}
                    onPress={() => handleLangChange(lang.code)}
                  >
                    <View>
                      <Text style={[styles.langNative, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
                        {lang.native}
                      </Text>
                      <Text style={[styles.langLabel, { color: colors.textSecondary, fontFamily: 'Poppins_400Regular' }]}>
                        {lang.label}
                      </Text>
                    </View>
                    {language === lang.code && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </Pressable>
                ))}
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  profileRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  profileBtn: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  avatarText: { fontSize: 16, color: '#FFF' },
  greetingSmall: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  userName: { fontSize: 16, color: '#FFF', maxWidth: 180 },
  headerBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, gap: 8, backgroundColor: '#FFF' },
  createBtnText: { color: '#1B4332', fontSize: 15 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 12 },
  listTitle: { fontSize: 17 },
  listCount: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, overflow: 'hidden' as const },
  listCountText: { fontSize: 13 },
  listContent: { paddingHorizontal: 16 },
  siteCard: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  siteCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  siteIconBg: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  siteCardInfo: { flex: 1, marginLeft: 12 },
  siteCardName: { fontSize: 15 },
  siteCardLocation: { fontSize: 12, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11 },
  siteCardDetails: { flexDirection: 'row', gap: 16 },
  siteDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  siteDetailText: { fontSize: 12 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16 },
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  bottomSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, maxHeight: screenHeight * 0.55 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetProfile: { alignItems: 'center', paddingVertical: 8 },
  sheetAvatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  sheetAvatarText: { fontSize: 22, color: '#FFF' },
  sheetName: { fontSize: 18, marginBottom: 2 },
  sheetEmail: { fontSize: 13 },
  sheetDivider: { height: 1, marginVertical: 16 },
  sheetOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 14, gap: 14, marginBottom: 4 },
  sheetOptionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  sheetOptionText: { fontSize: 15, flex: 1 },
  langHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 },
  langTitle: { fontSize: 17 },
  langOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1.5, marginBottom: 10 },
  langNative: { fontSize: 16 },
  langLabel: { fontSize: 12, marginTop: 2 },
});
