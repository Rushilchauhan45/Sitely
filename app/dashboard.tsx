import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, useColorScheme, Platform, Alert, Modal, Animated, Dimensions, BackHandler, TextInput, Image } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/lib/AppContext';
import { useThemeColors } from '@/constants/colors';
import { Site } from '@/lib/types';
import { Language } from '@/lib/i18n';
import * as store from '@/lib/storage';
import { AnimatedPressable, EmptyState } from '@/components/ui';
import { shadow } from '@/constants/shadows';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { getUnreadCount } from './notifications';
import ProfilePrompt from '@/components/ProfilePrompt';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhoto, setEditPhoto] = useState<string | null>(null);
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const sheetAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Block hardware back from dashboard — this is the home screen
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSites();
      getUnreadCount().then(setUnreadCount);
      // Check if should show profile prompt (first 3 logins without profile photo)
      AsyncStorage.getItem('@profile_prompt_count').then(val => {
        const count = parseInt(val || '0', 10);
        if (count < 3 && !user?.photoUri) {
          setShowProfilePrompt(true);
        }
      });
    }, [])
  );

  const loadSites = async () => {
    setLoading(true);
    const data = await store.getSites(user?.id);
    setSites(data);
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
      setShowEditProfile(false);
    });
  };

  const handleLogout = () => {
    closeSheet();

    const doLogout = async () => {
      try {
        await store.logout();
      } catch (e) {
        console.warn('Logout error:', e);
      }
      // Reset onboarding so sliders show again on next login
      try {
        await store.resetOnboardingDone();
      } catch (_) {}
      setUser(null);
      router.replace('/auth');
    };

    if (Platform.OS === 'web') {
      setTimeout(() => {
        if (confirm(t('logoutConfirm'))) {
          doLogout();
        }
      }, 300);
    } else {
      setTimeout(() => {
        Alert.alert(t('logout'), t('logoutConfirm'), [
          { text: t('cancel'), style: 'cancel' },
          { text: t('logout'), style: 'destructive', onPress: doLogout },
        ]);
      }, 300);
    }
  };

  const handleLangChange = async (lang: Language) => {
    Haptics.selectionAsync();
    await setLanguage(lang);
    setShowLangPicker(false);
  };

  const handleEditProfile = () => {
    setEditName(user?.name || '');
    setEditPhoto(user?.photoUri || null);
    setEditPhone(user?.phone || '');
    setShowEditProfile(true);
  };

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('', 'Permission to access gallery is required');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setEditPhoto(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Image picker error:', e);
    }
  };

  const handleSaveProfile = async () => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const updated = await store.updateUserProfile({ name: trimmed, photoUri: editPhoto, phone: editPhone.trim() || null });
      if (updated) setUser(updated);
      setShowEditProfile(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert(t('authError'), String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSite = (site: Site) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const doDelete = async () => {
      await store.deleteSite(site.id);
      loadSites();
    };

    if (Platform.OS === 'web') {
      if (confirm(`${t('delete')} ${site.name}?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        t('delete'),
        `${site.name}?`,
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('delete'), style: 'destructive', onPress: doDelete },
        ]
      );
    }
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
    <AnimatedPressable
      scaleValue={0.97}
      style={[
        styles.siteCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderLight,
          ...shadow({ color: colors.cardShadow, offsetY: 4, opacity: 0.1, radius: 14, elevation: 3 }),
        },
      ]}
      onPress={() => {
        router.push({ pathname: '/site/[id]', params: { id: item.id } });
      }}
      onLongPress={() => handleDeleteSite(item)}
    >
      <View style={styles.siteCardHeader}>
        <LinearGradient
          colors={['#0EA5E9', '#38BDF8']}
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
          {item.siteCode ? (
            <Text style={{ color: colors.primary, fontSize: 11, fontFamily: 'Poppins_600SemiBold', marginTop: 2 }}>
              {item.siteCode}
            </Text>
          ) : null}
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
    </AnimatedPressable>
  );

  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#0EA5E9', '#0284C7', '#1A1A2E']}
        style={[styles.header, { paddingTop: insets.top + webTopInset + 16 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.profileRow}>
          <Pressable onPress={openSheet} style={({ pressed }) => [styles.profileBtn, { opacity: pressed ? 0.8 : 1 }]}>
            {user?.photoUri ? (
              <Image source={{ uri: user.photoUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={[styles.avatarText, { fontFamily: 'Poppins_700Bold' }]}>
                  {getInitials(user?.name || '')}
                </Text>
              </View>
            )}
            <View>
              <Text style={[styles.greetingSmall, { fontFamily: 'Poppins_400Regular' }]}>
                {t('hello')},
              </Text>
              <Text style={[styles.userName, { fontFamily: 'Poppins_600SemiBold' }]} numberOfLines={1}>
                {user?.name || ''}
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/notifications' as any); }}
            style={styles.headerBadge}
          >
            <Ionicons name="notifications" size={20} color="rgba(255,255,255,0.8)" />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        <AnimatedPressable
          scaleValue={0.97}
          haptic={Haptics.ImpactFeedbackStyle.Medium}
          style={styles.createBtn}
          onPress={() => router.push('/create-site')}
        >
          <Ionicons name="add-circle" size={22} color="#0EA5E9" />
          <Text style={[styles.createBtnText, { fontFamily: 'Poppins_600SemiBold' }]}>
            {t('createNewSite')}
          </Text>
        </AnimatedPressable>
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
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + webBottomInset + 80 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="office-building-outline" iconSet="material" title={t('noSitesYet')} />
        }
      />

      {/* Floating Todo Button */}
      <Pressable
        style={({ pressed }) => [
          styles.helpFab,
          {
            bottom: insets.bottom + webBottomInset + 90,
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.92 : 1 }],
            ...shadow({ offsetY: 6, opacity: 0.25, radius: 16, elevation: 8 }),
          },
        ]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/todo' as any); }}
      >
        <LinearGradient
          colors={['#0EA5E9', '#38BDF8']}
          style={styles.helpFabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="checkbox-outline" size={26} color="#FFF" />
        </LinearGradient>
      </Pressable>

      {/* Floating Help Button */}
      <Pressable
        style={({ pressed }) => [
          styles.helpFab,
          {
            bottom: insets.bottom + webBottomInset + 20,
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.92 : 1 }],
            ...shadow({ offsetY: 6, opacity: 0.25, radius: 16, elevation: 8 }),
          },
        ]}
        onPress={() => router.push('/help')}
      >
        <LinearGradient
          colors={['#0EA5E9', '#38BDF8']}
          style={styles.helpFabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="help-circle" size={28} color="#FFF" />
        </LinearGradient>
      </Pressable>

      <Modal visible={showProfile} transparent animationType="none" onRequestClose={closeSheet}>
        <View style={styles.modalContainer}>
          <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
          </Animated.View>
          <Animated.View style={[styles.bottomSheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + webBottomInset + 20, transform: [{ translateY: sheetTranslateY }] }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            {!showLangPicker && !showEditProfile ? (
              <>
                <View style={styles.sheetProfile}>
                  {user?.photoUri ? (
                    <Image source={{ uri: user.photoUri }} style={styles.sheetAvatarImage} />
                  ) : (
                    <View style={[styles.sheetAvatar, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.sheetAvatarText, { fontFamily: 'Poppins_700Bold' }]}>
                        {getInitials(user?.name || '')}
                      </Text>
                    </View>
                  )}
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
                  onPress={handleEditProfile}
                >
                  <View style={[styles.sheetOptionIcon, { backgroundColor: '#2196F320' }]}>
                    <Ionicons name="person-outline" size={20} color="#2196F3" />
                  </View>
                  <Text style={[styles.sheetOptionText, { color: colors.text, fontFamily: 'Poppins_500Medium' }]}>
                    {t('editProfile')}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.sheetOption, { backgroundColor: pressed ? colors.inputBg : 'transparent' }]}
                  onPress={() => { closeSheet(); router.push('/profile' as any); }}
                >
                  <View style={[styles.sheetOptionIcon, { backgroundColor: '#0EA5E920' }]}>
                    <Ionicons name="settings-outline" size={20} color="#0EA5E9" />
                  </View>
                  <Text style={[styles.sheetOptionText, { color: colors.text, fontFamily: 'Poppins_500Medium' }]}>
                    {t('settings')}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </Pressable>

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
            ) : showEditProfile ? (
              <>
                <View style={styles.langHeader}>
                  <Pressable onPress={() => setShowEditProfile(false)} hitSlop={12}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                  </Pressable>
                  <Text style={[styles.langTitle, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
                    {t('editProfile')}
                  </Text>
                  <View style={{ width: 22 }} />
                </View>

                <View style={styles.editProfileForm}>
                  {/* Profile Photo Picker */}
                  <View style={styles.editPhotoSection}>
                    <Pressable onPress={handlePickPhoto} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
                      {editPhoto ? (
                        <Image source={{ uri: editPhoto }} style={styles.editPhotoImage} />
                      ) : (
                        <View style={[styles.editPhotoPlaceholder, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                          <Ionicons name="camera-outline" size={28} color={colors.textTertiary} />
                        </View>
                      )}
                      <View style={[styles.editPhotoBadge, { backgroundColor: colors.primary }]}>
                        <Ionicons name="pencil" size={12} color="#FFF" />
                      </View>
                    </Pressable>
                    <Text style={[styles.editPhotoLabel, { color: colors.primary, fontFamily: 'Poppins_500Medium' }]}>
                      {t('changePhoto')}
                    </Text>
                  </View>

                  <Text style={[styles.editLabel, { color: colors.textSecondary, fontFamily: 'Poppins_500Medium' }]}>
                    {t('fullName')}
                  </Text>
                  <TextInput
                    style={[styles.editInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border, fontFamily: 'Poppins_400Regular' }]}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder={t('fullName')}
                    placeholderTextColor={colors.textTertiary}
                    autoFocus
                  />

                  <Text style={[styles.editLabel, { color: colors.textSecondary, fontFamily: 'Poppins_500Medium', marginTop: 12 }]}>
                    {t('email')}
                  </Text>
                  <View style={[styles.editInput, { backgroundColor: colors.inputBg, borderColor: colors.border, opacity: 0.6 }]}>
                    <Text style={[styles.editInputDisabled, { color: colors.textTertiary, fontFamily: 'Poppins_400Regular' }]}>
                      {user?.email}
                    </Text>
                  </View>

                  <Text style={[styles.editLabel, { color: colors.textSecondary, fontFamily: 'Poppins_500Medium', marginTop: 12 }]}>
                    {t('phoneNumber') || 'Phone Number'}
                  </Text>
                  <TextInput
                    style={[styles.editInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border, fontFamily: 'Poppins_400Regular' }]}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder={t('phoneNumber') || 'Phone Number'}
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="phone-pad"
                  />

                  <Pressable
                    style={({ pressed }) => [styles.editSaveBtn, { backgroundColor: colors.primary, opacity: pressed || saving ? 0.7 : 1 }]}
                    onPress={handleSaveProfile}
                    disabled={saving}
                  >
                    <Text style={[styles.editSaveBtnText, { fontFamily: 'Poppins_600SemiBold' }]}>
                      {saving ? '...' : t('save')}
                    </Text>
                  </Pressable>
                </View>
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

      {/* Profile Prompt for first-time users */}
      <ProfilePrompt
        visible={showProfilePrompt}
        onDismiss={async () => {
          setShowProfilePrompt(false);
          const count = parseInt((await AsyncStorage.getItem('@profile_prompt_count')) || '0', 10);
          await AsyncStorage.setItem('@profile_prompt_count', String(count + 1));
        }}
        onSave={async (data) => {
          if (store) {
            await store.updateUserProfile({ name: data.username });
          }
          // Store gender/age locally
          await AsyncStorage.setItem('@user_gender', data.gender);
          await AsyncStorage.setItem('@user_age', data.age);
          setShowProfilePrompt(false);
          await AsyncStorage.setItem('@profile_prompt_count', '3');
        }}
      />
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
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, gap: 8, backgroundColor: '#FFF', ...shadow({ offsetY: 4, opacity: 0.1, radius: 12, elevation: 4 }) },
  createBtnText: { color: '#0EA5E9', fontSize: 15 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 12 },
  listTitle: { fontSize: 17 },
  listCount: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, overflow: 'hidden' as const },
  listCountText: { fontSize: 13 },
  listContent: { paddingHorizontal: 16 },
  siteCard: { borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, ...shadow({ offsetY: 4, opacity: 0.06, radius: 14, elevation: 3 }) },
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
  editProfileForm: { paddingHorizontal: 4 },
  editLabel: { fontSize: 13, marginBottom: 6 },
  editInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, justifyContent: 'center' },
  editInputDisabled: { fontSize: 15 },
  editSaveBtn: { marginTop: 20, paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  editSaveBtnText: { color: '#FFF', fontSize: 15 },
  helpFab: { position: 'absolute', right: 20, zIndex: 100 },
  helpFabGradient: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  sheetAvatarImage: { width: 64, height: 64, borderRadius: 32, marginBottom: 10 },
  editPhotoSection: { alignItems: 'center', marginBottom: 20 },
  editPhotoImage: { width: 80, height: 80, borderRadius: 40 },
  editPhotoPlaceholder: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderStyle: 'dashed' as const },
  editPhotoBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  editPhotoLabel: { fontSize: 13, marginTop: 8 },
  notifBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: '#0284C7' },
  notifBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
});
