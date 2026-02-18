// ============================================================
// 🔔 NOTIFICATION CENTER — View & manage in-app notifications
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, Alert, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown, SlideOutRight, Layout,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '@/lib/AppContext';
import Colors from '@/constants/colors';
import { Fonts, FontSizes } from '@/theme/typography';
import { GlassCard } from '@/components/ui/GlassCard';

const NOTIFS_KEY = 'sitely_notifications';

export interface AppNotification {
  id: string;
  type: 'todo' | 'salary' | 'hajari' | 'general';
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

function getNotifIcon(type: AppNotification['type']): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'todo': return 'checkmark-circle-outline';
    case 'salary': return 'wallet-outline';
    case 'hajari': return 'clipboard-outline';
    case 'general': return 'notifications-outline';
    default: return 'notifications-outline';
  }
}

function getNotifColor(type: AppNotification['type']): string {
  switch (type) {
    case 'todo': return Colors.primary;
    case 'salary': return Colors.warning;
    case 'hajari': return Colors.success;
    case 'general': return Colors.textSecondary;
    default: return Colors.textSecondary;
  }
}

function getNotifBgColor(type: AppNotification['type']): string {
  switch (type) {
    case 'todo': return Colors.primaryLight;
    case 'salary': return Colors.warningLight;
    case 'hajari': return Colors.successLight;
    case 'general': return Colors.glassMedium;
    default: return Colors.glassMedium;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function groupByDate(notifs: AppNotification[]): { label: string; items: AppNotification[] }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: Record<string, AppNotification[]> = {};

  for (const n of notifs) {
    const d = new Date(n.createdAt);
    d.setHours(0, 0, 0, 0);
    let label: string;
    if (d.getTime() === today.getTime()) label = 'Today';
    else if (d.getTime() === yesterday.getTime()) label = 'Yesterday';
    else label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  }

  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

export default function NotificationsScreen() {
  const { t } = useApp();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const json = await AsyncStorage.getItem(NOTIFS_KEY);
      if (json) {
        const parsed: AppNotification[] = JSON.parse(json);
        setNotifications(parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    } catch (e) {
      console.warn('Error loading notifications:', e);
    }
  };

  const saveNotifications = async (notifs: AppNotification[]) => {
    await AsyncStorage.setItem(NOTIFS_KEY, JSON.stringify(notifs));
    setNotifications(notifs);
  };

  const markAsRead = async (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    await saveNotifications(updated);
    Haptics.selectionAsync();
  };

  const deleteNotification = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = notifications.filter(n => n.id !== id);
    await saveNotifications(updated);
  };

  const clearAll = () => {
    if (notifications.length === 0) return;

    const doClear = async () => {
      await saveNotifications([]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    if (Platform.OS === 'web') {
      if (confirm('Clear all notifications?')) doClear();
    } else {
      Alert.alert(
        t('clearAll') || 'Clear All',
        t('clearAllConfirm') || 'Remove all notifications?',
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('clearAll') || 'Clear All', style: 'destructive', onPress: doClear },
        ]
      );
    }
  };

  const markAllRead = async () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    await saveNotifications(updated);
    Haptics.selectionAsync();
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const grouped = groupByDate(notifications);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <LinearGradient
        colors={[...Colors.gradientHeader]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 12, paddingBottom: 20, paddingHorizontal: 20 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: Colors.glass, justifyContent: 'center', alignItems: 'center',
          }}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: Fonts.bold, fontSize: FontSizes.xl, color: Colors.white }}>
              {t('notifications') || 'Notifications'}
            </Text>
            {unreadCount > 0 && (
              <Text style={{ fontFamily: Fonts.regular, fontSize: FontSizes.sm, color: Colors.whiteSubtle }}>
                {unreadCount} unread
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {unreadCount > 0 && (
              <Pressable onPress={markAllRead} style={{
                paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                backgroundColor: Colors.glass,
              }}>
                <Ionicons name="checkmark-done" size={18} color={Colors.skyBlueLight} />
              </Pressable>
            )}
            {notifications.length > 0 && (
              <Pressable onPress={clearAll} style={{
                paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                backgroundColor: Colors.glass,
              }}>
                <Ionicons name="trash-outline" size={18} color={Colors.error} />
              </Pressable>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Notification List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={{ padding: 60, alignItems: 'center' }}>
            <Ionicons name="notifications-off-outline" size={64} color={Colors.textTertiary} />
            <Text style={{
              fontFamily: Fonts.medium, fontSize: FontSizes.lg, color: Colors.textSecondary,
              marginTop: 16, textAlign: 'center',
            }}>
              {t('noNotifications') || 'No notifications yet'}
            </Text>
            <Text style={{
              fontFamily: Fonts.regular, fontSize: FontSizes.sm, color: Colors.textTertiary,
              marginTop: 8, textAlign: 'center',
            }}>
              {t('noNotificationsDesc') || 'Your notifications will appear here'}
            </Text>
          </View>
        ) : (
          grouped.map((group, groupIdx) => (
            <View key={group.label}>
              <Animated.View entering={FadeInDown.delay(groupIdx * 50)}>
                <Text style={{
                  fontFamily: Fonts.semiBold, fontSize: FontSizes.sm, color: Colors.textTertiary,
                  marginBottom: 10, marginTop: groupIdx > 0 ? 16 : 0,
                  textTransform: 'uppercase', letterSpacing: 1,
                }}>
                  {group.label}
                </Text>
              </Animated.View>

              {group.items.map((notif, index) => (
                <Animated.View
                  key={notif.id}
                  entering={FadeInDown.delay(groupIdx * 50 + index * 40).springify()}
                  exiting={SlideOutRight.duration(250)}
                  layout={Layout.springify()}
                >
                  <Pressable
                    onPress={() => markAsRead(notif.id)}
                    onLongPress={() => {
                      if (Platform.OS === 'web') {
                        deleteNotification(notif.id);
                      } else {
                        Alert.alert('', 'Delete this notification?', [
                          { text: t('cancel'), style: 'cancel' },
                          { text: t('delete'), style: 'destructive', onPress: () => deleteNotification(notif.id) },
                        ]);
                      }
                    }}
                  >
                    <View style={{
                      flexDirection: 'row', alignItems: 'flex-start', gap: 12,
                      padding: 14, borderRadius: 16, marginBottom: 8,
                      backgroundColor: notif.isRead ? Colors.glassMedium : Colors.glass,
                      borderWidth: 1, borderColor: notif.isRead ? Colors.borderLight : Colors.glassBorder,
                    }}>
                      {/* Icon */}
                      <View style={{
                        width: 40, height: 40, borderRadius: 12,
                        backgroundColor: getNotifBgColor(notif.type),
                        justifyContent: 'center', alignItems: 'center',
                      }}>
                        <Ionicons name={getNotifIcon(notif.type)} size={20} color={getNotifColor(notif.type)} />
                      </View>

                      {/* Content */}
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{
                            fontFamily: notif.isRead ? Fonts.medium : Fonts.semiBold,
                            fontSize: FontSizes.base, color: Colors.white,
                            flex: 1,
                          }} numberOfLines={1}>
                            {notif.title}
                          </Text>
                          {!notif.isRead && (
                            <View style={{
                              width: 8, height: 8, borderRadius: 4,
                              backgroundColor: Colors.primary, marginLeft: 8,
                            }} />
                          )}
                        </View>
                        <Text style={{
                          fontFamily: Fonts.regular, fontSize: FontSizes.sm,
                          color: Colors.textSecondary, marginTop: 2, lineHeight: 18,
                        }} numberOfLines={2}>
                          {notif.body}
                        </Text>
                        <Text style={{
                          fontFamily: Fonts.regular, fontSize: FontSizes.xs,
                          color: Colors.textTertiary, marginTop: 6,
                        }}>
                          {timeAgo(notif.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ─── Utility to add notifications from other screens ─────────────────

export async function addAppNotification(notif: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>) {
  try {
    const json = await AsyncStorage.getItem(NOTIFS_KEY);
    const existing: AppNotification[] = json ? JSON.parse(json) : [];

    const newNotif: AppNotification = {
      ...notif,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [newNotif, ...existing].slice(0, 100); // Keep max 100
    await AsyncStorage.setItem(NOTIFS_KEY, JSON.stringify(updated));
    return newNotif;
  } catch (e) {
    console.warn('Error adding notification:', e);
    return null;
  }
}

export async function getUnreadCount(): Promise<number> {
  try {
    const json = await AsyncStorage.getItem(NOTIFS_KEY);
    if (!json) return 0;
    const notifs: AppNotification[] = JSON.parse(json);
    return notifs.filter(n => !n.isRead).length;
  } catch {
    return 0;
  }
}
