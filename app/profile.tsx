// ============================================================
// 👤 PROFILE SCREEN — View/edit user profile + app settings
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, Alert,
  Image, ActivityIndicator, Switch, Platform, Linking,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown, FadeInUp,
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '@/lib/AppContext';
import Colors from '@/constants/colors';
import { Fonts, FontSizes } from '@/theme/typography';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { FloatingInput } from '@/components/ui/FloatingInput';
import * as store from '@/lib/storage';
import { Language } from '@/lib/i18n';

const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
];

export default function ProfileScreen() {
  const { t, user, setUser, language, setLanguage } = useApp();
  const insets = useSafeAreaInsets();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhoto, setEditPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [role, setRole] = useState<string>('contractor');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedRole = await AsyncStorage.getItem('@user_role');
      if (savedRole) setRole(savedRole);
      const notifPref = await AsyncStorage.getItem('@notifications_enabled');
      setNotificationsEnabled(notifPref !== 'false');
    } catch (e) {
      console.warn('Error loading settings:', e);
    }
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
    if (!trimmed) {
      Alert.alert(t('required'), t('namePlaceholder'));
      return;
    }
    setSaving(true);
    try {
      const updated = await store.updateUserProfile({ name: trimmed, photoUri: editPhoto });
      if (updated) setUser(updated);
      setEditing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert(t('authError'), String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = () => {
    setEditName(user?.name || '');
    setEditPhoto(user?.photoUri || null);
    setEditing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleLangChange = async (lang: Language) => {
    Haptics.selectionAsync();
    await setLanguage(lang);
    setShowLangPicker(false);
  };

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('@notifications_enabled', value.toString());
    Haptics.selectionAsync();
  };

  const handleLogout = () => {
    const doLogout = async () => {
      try {
        await store.logout();
      } catch (e) {
        console.warn('Logout error:', e);
      }
      try {
        await store.resetOnboardingDone();
      } catch (_) {}
      setUser(null);
      router.replace('/auth');
    };

    if (Platform.OS === 'web') {
      if (confirm(t('logoutConfirm'))) {
        doLogout();
      }
    } else {
      Alert.alert(t('logout'), t('logoutConfirm'), [
        { text: t('cancel'), style: 'cancel' },
        { text: t('logout'), style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  const photoUri = editing ? editPhoto : user?.photoUri;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header with avatar */}
      <LinearGradient
        colors={[...Colors.gradientHeader]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 12, paddingBottom: 32, paddingHorizontal: 20, alignItems: 'center' }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20 }}>
          <Pressable onPress={() => router.back()} style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: Colors.glass, justifyContent: 'center', alignItems: 'center',
          }}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </Pressable>
          <Text style={{
            fontFamily: Fonts.bold, fontSize: FontSizes.xl, color: Colors.white, flex: 1, textAlign: 'center',
          }}>
            {t('profile') || 'Profile'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Avatar */}
        <Pressable onPress={editing ? handlePickPhoto : undefined}>
          <View style={{
            width: 96, height: 96, borderRadius: 48,
            backgroundColor: Colors.glass, borderWidth: 3, borderColor: Colors.glassBorderLight,
            justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
          }}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={{ width: 96, height: 96, borderRadius: 48 }} />
            ) : (
              <Ionicons name="person" size={44} color={Colors.whiteSubtle} />
            )}
          </View>
          {editing && (
            <View style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
              borderWidth: 2, borderColor: Colors.background,
            }}>
              <Ionicons name="camera" size={16} color={Colors.white} />
            </View>
          )}
        </Pressable>

        <Text style={{
          fontFamily: Fonts.bold, fontSize: FontSizes['2xl'], color: Colors.white, marginTop: 12,
        }}>
          {user?.name || 'User'}
        </Text>
        <View style={{
          marginTop: 6, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12,
          backgroundColor: Colors.glass,
        }}>
          <Text style={{ fontFamily: Fonts.medium, fontSize: FontSizes.sm, color: Colors.skyBlueLight }}>
            {role === 'owner' ? (t('owner') || 'Owner') : (t('contractor') || 'Contractor')}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Edit Profile Section */}
        {editing ? (
          <Animated.View entering={FadeInDown.springify()}>
            <GlassCard gradient style={{ marginBottom: 20 }}>
              <Text style={{
                fontFamily: Fonts.semiBold, fontSize: FontSizes.lg, color: Colors.white, marginBottom: 16,
              }}>
                {t('editProfile') || 'Edit Profile'}
              </Text>
              <FloatingInput label={t('namePlaceholder') || 'Full Name'} value={editName} onChangeText={setEditName} />
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                <View style={{ flex: 1 }}>
                  <GradientButton title={t('save') || 'Save'} onPress={handleSaveProfile} loading={saving} />
                </View>
                <View style={{ flex: 1 }}>
                  <GradientButton title={t('cancel') || 'Cancel'} onPress={() => setEditing(false)} variant="outline" />
                </View>
              </View>
            </GlassCard>
          </Animated.View>
        ) : (
          <>
            {/* Personal Info */}
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <Text style={{
                fontFamily: Fonts.semiBold, fontSize: FontSizes.base, color: Colors.textSecondary,
                marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1,
              }}>
                {t('personalInfo') || 'Personal Information'}
              </Text>
              <GlassCard style={{ marginBottom: 20 }}>
                <InfoRow icon="person" label={t('namePlaceholder') || 'Name'} value={user?.name || '-'} />
                <InfoRow icon="mail" label={t('email') || 'Email'} value={user?.email || '-'} />
                <InfoRow icon="shield-checkmark" label={t('role') || 'Role'} value={
                  role === 'owner' ? (t('owner') || 'Owner') : (t('contractor') || 'Contractor')
                } />

                <Pressable onPress={handleStartEdit} style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 8, marginTop: 16, paddingVertical: 12, borderRadius: 12,
                  backgroundColor: Colors.primaryLight,
                }}>
                  <Ionicons name="create-outline" size={18} color={Colors.primary} />
                  <Text style={{
                    fontFamily: Fonts.semiBold, fontSize: FontSizes.sm, color: Colors.primary,
                  }}>
                    {t('editProfile') || 'Edit Profile'}
                  </Text>
                </Pressable>
              </GlassCard>
            </Animated.View>

            {/* App Settings */}
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Text style={{
                fontFamily: Fonts.semiBold, fontSize: FontSizes.base, color: Colors.textSecondary,
                marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1,
              }}>
                {t('settings') || 'App Settings'}
              </Text>
              <GlassCard style={{ marginBottom: 20 }}>
                {/* Language */}
                <Pressable onPress={() => setShowLangPicker(!showLangPicker)} style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{
                      width: 36, height: 36, borderRadius: 10,
                      backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center',
                    }}>
                      <Ionicons name="language" size={20} color={Colors.primary} />
                    </View>
                    <View>
                      <Text style={{ fontFamily: Fonts.medium, fontSize: FontSizes.base, color: Colors.white }}>
                        {t('language') || 'Language'}
                      </Text>
                      <Text style={{ fontFamily: Fonts.regular, fontSize: FontSizes.sm, color: Colors.textSecondary }}>
                        {LANGUAGES.find(l => l.code === language)?.native || language}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name={showLangPicker ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textTertiary} />
                </Pressable>

                {showLangPicker && (
                  <Animated.View entering={FadeInDown.duration(200)}>
                    <View style={{ paddingVertical: 8, gap: 4 }}>
                      {LANGUAGES.map(lang => (
                        <Pressable key={lang.code} onPress={() => handleLangChange(lang.code)} style={{
                          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                          paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
                          backgroundColor: language === lang.code ? Colors.primaryLight : 'transparent',
                        }}>
                          <Text style={{
                            fontFamily: language === lang.code ? Fonts.semiBold : Fonts.regular,
                            fontSize: FontSizes.base,
                            color: language === lang.code ? Colors.primary : Colors.white,
                          }}>
                            {lang.native} ({lang.label})
                          </Text>
                          {language === lang.code && (
                            <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                          )}
                        </Pressable>
                      ))}
                    </View>
                  </Animated.View>
                )}

                {/* Notifications Toggle */}
                <View style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingVertical: 14,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{
                      width: 36, height: 36, borderRadius: 10,
                      backgroundColor: Colors.warningLight, justifyContent: 'center', alignItems: 'center',
                    }}>
                      <Ionicons name="notifications" size={20} color={Colors.warning} />
                    </View>
                    <Text style={{ fontFamily: Fonts.medium, fontSize: FontSizes.base, color: Colors.white }}>
                      {t('notifications') || 'Notifications'}
                    </Text>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={handleToggleNotifications}
                    trackColor={{ false: Colors.textTertiary, true: Colors.primaryLight }}
                    thumbColor={notificationsEnabled ? Colors.primary : Colors.whiteSubtle}
                  />
                </View>
              </GlassCard>
            </Animated.View>

            {/* Developer Info */}
            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <Text style={{
                fontFamily: Fonts.semiBold, fontSize: FontSizes.base, color: Colors.textSecondary,
                marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1,
              }}>
                {t('about') || 'About'}
              </Text>
              <GlassCard style={{ marginBottom: 20 }}>
                <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{
                    fontFamily: Fonts.bold, fontSize: FontSizes.xl, color: Colors.skyBlue, marginBottom: 4,
                  }}>
                    Sitely
                  </Text>
                  <Text style={{
                    fontFamily: Fonts.regular, fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: 16,
                  }}>
                    v1.0.0 • Construction Site Management
                  </Text>

                  <View style={{
                    width: '100%', padding: 16, borderRadius: 14,
                    backgroundColor: Colors.glassMedium, borderWidth: 1, borderColor: Colors.border,
                  }}>
                    <Text style={{ fontFamily: Fonts.semiBold, fontSize: FontSizes.base, color: Colors.white, marginBottom: 8 }}>
                      Developed by
                    </Text>
                    <View style={{ gap: 6 }}>
                      <DevInfoRow icon="person" text="Rushil Chauhan" />
                      <DevInfoRow icon="mail" text="chauhanrushil45@gmail.com" onPress={() => Linking.openURL('mailto:chauhanrushil45@gmail.com')} />
                      <DevInfoRow icon="call" text="+91 9054364058" onPress={() => Linking.openURL('tel:+919054364058')} />
                    </View>
                  </View>

                  <Text style={{
                    fontFamily: Fonts.regular, fontSize: FontSizes.xs, color: Colors.textTertiary,
                    marginTop: 16,
                  }}>
                    © 2026 Sitely. All rights reserved.
                  </Text>
                </View>
              </GlassCard>
            </Animated.View>

            {/* Logout */}
            <Animated.View entering={FadeInUp.delay(400).springify()}>
              <Pressable onPress={handleLogout} style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 10, paddingVertical: 16, borderRadius: 16,
                backgroundColor: Colors.errorLight,
                borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
              }}>
                <Ionicons name="log-out-outline" size={22} color={Colors.error} />
                <Text style={{
                  fontFamily: Fonts.semiBold, fontSize: FontSizes.base, color: Colors.error,
                }}>
                  {t('logout') || 'Log Out'}
                </Text>
              </Pressable>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Helper Components ─────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
    }}>
      <View style={{
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: Colors.glassMedium, justifyContent: 'center', alignItems: 'center',
      }}>
        <Ionicons name={icon} size={18} color={Colors.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: Fonts.regular, fontSize: FontSizes.xs, color: Colors.textTertiary }}>
          {label}
        </Text>
        <Text style={{ fontFamily: Fonts.medium, fontSize: FontSizes.base, color: Colors.white }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function DevInfoRow({ icon, text, onPress }: { icon: keyof typeof Ionicons.glyphMap; text: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ionicons name={icon} size={16} color={Colors.textSecondary} />
      <Text style={{
        fontFamily: Fonts.regular, fontSize: FontSizes.sm,
        color: onPress ? Colors.primary : Colors.textSecondary,
      }}>
        {text}
      </Text>
    </Pressable>
  );
}
