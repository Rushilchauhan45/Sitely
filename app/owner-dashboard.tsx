// ============================================================
// 👁️ OWNER DASHBOARD — Monitor sites via site code
// Read-only access to contractor sites
// ============================================================

import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, Alert,
  ActivityIndicator, Linking, BackHandler,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '@/lib/AppContext';
import Colors from '@/constants/colors';
import { Fonts, FontSizes } from '@/theme/typography';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { FloatingInput } from '@/components/ui/FloatingInput';
import { HelpFAB } from '@/components/ui/HelpFAB';
import type { Site } from '@/lib/types';
import * as store from '@/lib/storage';

const SAVED_SITES_KEY = 'sitely_owner_saved_sites';

interface SavedSiteEntry {
  siteCode: string;
  site: Site;
  savedAt: string;
}

export default function OwnerDashboard() {
  const { t, user } = useApp();
  const insets = useSafeAreaInsets();

  const [siteCode, setSiteCode] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<Site | null>(null);
  const [savedSites, setSavedSites] = useState<SavedSiteEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Block back button on owner dashboard
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSavedSites();
    }, []),
  );

  const loadSavedSites = async () => {
    setLoading(true);
    try {
      const json = await AsyncStorage.getItem(SAVED_SITES_KEY);
      if (json) {
        setSavedSites(JSON.parse(json));
      }
    } catch (e) {
      console.warn('Error loading saved sites:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveSitesToStorage = async (sites: SavedSiteEntry[]) => {
    await AsyncStorage.setItem(SAVED_SITES_KEY, JSON.stringify(sites));
    setSavedSites(sites);
  };

  const handleLookup = async () => {
    const code = siteCode.trim().toUpperCase();
    if (code.length < 3) {
      Alert.alert(t('required'), t('siteCodeDesc'));
      return;
    }

    setLookupLoading(true);
    setLookupResult(null);
    try {
      // For now, search in local sites by matching any site
      // In production, this would query Firestore by siteCode
      const allSites = await store.getSites();
      const found = allSites.find(
        (s) => s.id.toUpperCase().includes(code) || s.name.toUpperCase().includes(code),
      );

      if (found) {
        setLookupResult(found);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(t('siteNotFound'));
      }
    } catch (e) {
      console.warn('Lookup error:', e);
      Alert.alert('Error', String(e));
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSaveSite = async () => {
    if (!lookupResult) return;

    const exists = savedSites.find((s) => s.site.id === lookupResult.id);
    if (exists) {
      Alert.alert('Already Saved', 'This site is already in your saved list.');
      return;
    }

    const newEntry: SavedSiteEntry = {
      siteCode: siteCode.trim().toUpperCase(),
      site: lookupResult,
      savedAt: new Date().toISOString(),
    };

    const updated = [newEntry, ...savedSites];
    await saveSitesToStorage(updated);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLookupResult(null);
    setSiteCode('');
  };

  const handleRemoveSite = (siteId: string) => {
    Alert.alert(
      t('delete'),
      'Remove this site from your saved list?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            const updated = savedSites.filter((s) => s.site.id !== siteId);
            await saveSitesToStorage(updated);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          },
        },
      ],
    );
  };

  const navigateToSite = (siteId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/site/[id]', params: { id: siteId, readOnly: '1' } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <LinearGradient
        colors={[...Colors.gradientHeader]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 24,
          paddingHorizontal: 20,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: Colors.glass,
              justifyContent: 'center', alignItems: 'center',
              borderWidth: 2,
              borderColor: Colors.glassBorderLight,
            }}>
              <Ionicons name="person" size={22} color={Colors.white} />
            </View>
            <View>
              <Text style={{
                fontFamily: Fonts.regular,
                fontSize: FontSizes.sm,
                color: Colors.whiteSubtle,
              }}>
                {t('hello')},
              </Text>
              <Text style={{
                fontFamily: Fonts.bold,
                fontSize: FontSizes.lg,
                color: Colors.white,
              }}>
                {user?.name || 'Owner'}
              </Text>
            </View>
          </View>
          <View style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
            backgroundColor: Colors.glass,
            borderWidth: 1,
            borderColor: Colors.glassBorderLight,
          }}>
            <Text style={{
              fontFamily: Fonts.semiBold,
              fontSize: FontSizes.xs,
              color: Colors.skyBlue,
            }}>
              {t('owner')} {t('viewOnly')}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Site Code Entry */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <GlassCard gradient style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Ionicons name="key-outline" size={22} color={Colors.skyBlue} />
              <Text style={{
                fontFamily: Fonts.semiBold,
                fontSize: FontSizes.lg,
                color: Colors.white,
              }}>
                {t('enterSiteCode')}
              </Text>
            </View>
            <Text style={{
              fontFamily: Fonts.regular,
              fontSize: FontSizes.sm,
              color: Colors.textSecondary,
              marginBottom: 16,
            }}>
              {t('siteCodeDesc')}
            </Text>

            <FloatingInput
              label={t('siteCode')}
              value={siteCode}
              onChangeText={(text) => setSiteCode(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={6}
              icon={<Ionicons name="qr-code-outline" size={20} color={Colors.textTertiary} />}
            />

            <GradientButton
              title={t('lookupSite')}
              onPress={handleLookup}
              loading={lookupLoading}
              icon={<Ionicons name="search" size={18} color={Colors.white} />}
            />
          </GlassCard>
        </Animated.View>

        {/* Lookup Result */}
        {lookupResult && (
          <Animated.View entering={FadeInDown.springify()}>
            <GlassCard style={{ marginBottom: 20, borderColor: Colors.success, borderWidth: 1.5 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontFamily: Fonts.bold,
                    fontSize: FontSizes.xl,
                    color: Colors.white,
                    marginBottom: 6,
                  }}>
                    {lookupResult.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Ionicons name="location" size={14} color={Colors.textSecondary} />
                    <Text style={{
                      fontFamily: Fonts.regular,
                      fontSize: FontSizes.sm,
                      color: Colors.textSecondary,
                    }}>
                      {lookupResult.location || '-'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="person" size={14} color={Colors.textSecondary} />
                    <Text style={{
                      fontFamily: Fonts.regular,
                      fontSize: FontSizes.sm,
                      color: Colors.textSecondary,
                    }}>
                      {lookupResult.ownerName || '-'}
                    </Text>
                  </View>
                </View>
                <View style={{
                  paddingHorizontal: 10, paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: lookupResult.isRunning ? Colors.successLight : Colors.warningLight,
                }}>
                  <Text style={{
                    fontFamily: Fonts.semiBold,
                    fontSize: FontSizes.xs,
                    color: lookupResult.isRunning ? Colors.success : Colors.warning,
                  }}>
                    {lookupResult.isRunning ? t('active') : t('completed')}
                  </Text>
                </View>
              </View>

              <GradientButton
                title={t('saveSite')}
                onPress={handleSaveSite}
                style={{ marginTop: 16 }}
                icon={<Ionicons name="bookmark" size={18} color={Colors.white} />}
              />
            </GlassCard>
          </Animated.View>
        )}

        {/* Saved Sites */}
        <Text style={{
          fontFamily: Fonts.semiBold,
          fontSize: FontSizes.base,
          color: Colors.textSecondary,
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}>
          {t('savedSites')}
        </Text>

        {loading ? (
          <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 20 }} />
        ) : savedSites.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Ionicons name="bookmark-outline" size={64} color={Colors.textTertiary} />
            <Text style={{
              fontFamily: Fonts.medium,
              fontSize: FontSizes.base,
              color: Colors.textSecondary,
              marginTop: 16,
              textAlign: 'center',
            }}>
              {t('noSavedSites')}
            </Text>
          </View>
        ) : (
          savedSites.map((entry, index) => (
            <Animated.View
              key={entry.site.id}
              entering={FadeInDown.delay(index * 60).springify()}
            >
              <Pressable
                onPress={() => navigateToSite(entry.site.id)}
                onLongPress={() => handleRemoveSite(entry.site.id)}
              >
                <GlassCard style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontFamily: Fonts.semiBold,
                        fontSize: FontSizes.lg,
                        color: Colors.white,
                        marginBottom: 4,
                      }}>
                        {entry.site.name}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="location-outline" size={12} color={Colors.textTertiary} />
                        <Text style={{
                          fontFamily: Fonts.regular,
                          fontSize: FontSizes.sm,
                          color: Colors.textSecondary,
                        }}>
                          {entry.site.location || '-'}
                        </Text>
                      </View>
                    </View>

                    <View style={{
                      paddingHorizontal: 8, paddingVertical: 4,
                      borderRadius: 8,
                      backgroundColor: entry.site.isRunning ? Colors.successLight : Colors.warningLight,
                    }}>
                      <Text style={{
                        fontFamily: Fonts.semiBold,
                        fontSize: FontSizes.xs,
                        color: entry.site.isRunning ? Colors.success : Colors.warning,
                      }}>
                        {entry.site.isRunning ? t('active') : t('completed')}
                      </Text>
                    </View>
                  </View>

                  {entry.site.contact && (
                    <Pressable
                      onPress={() => Linking.openURL(`tel:${entry.site.contact}`)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: 10,
                        paddingTop: 10,
                        borderTopWidth: 1,
                        borderTopColor: Colors.border,
                      }}
                    >
                      <Ionicons name="call-outline" size={14} color={Colors.primary} />
                      <Text style={{
                        fontFamily: Fonts.medium,
                        fontSize: FontSizes.sm,
                        color: Colors.primary,
                      }}>
                        {entry.site.contact}
                      </Text>
                    </Pressable>
                  )}
                </GlassCard>
              </Pressable>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Help FAB */}
      <HelpFAB />
    </View>
  );
}
