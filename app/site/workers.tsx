import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, useColorScheme, Platform, Alert } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useApp } from '@/lib/AppContext';
import { useThemeColors } from '@/constants/colors';
import { Worker } from '@/lib/types';
import * as store from '@/lib/storage';
import * as Haptics from 'expo-haptics';

export default function WorkersScreen() {
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const { t } = useApp();
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  useFocusEffect(
    useCallback(() => {
      if (siteId) store.getWorkers(siteId).then(setWorkers);
    }, [siteId])
  );

  const handleDelete = (worker: Worker) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(t('delete'), `${worker.name}?`, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: async () => {
        await store.deleteWorker(worker.id);
        if (siteId) store.getWorkers(siteId).then(setWorkers);
      }},
    ]);
  };

  const getInitials = (n: string) => n.trim().split(' ').map(p => p[0]?.toUpperCase() || '').slice(0, 2).join('');

  const renderWorker = ({ item }: { item: Worker }) => (
    <Pressable
      style={[styles.workerCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
      onLongPress={() => handleDelete(item)}
    >
      {item.photoUri ? (
        <Image source={{ uri: item.photoUri }} style={styles.workerPhoto} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.avatarText, { color: colors.primary, fontFamily: 'Inter_700Bold' }]}>
            {getInitials(item.name)}
          </Text>
        </View>
      )}
      <View style={styles.workerInfo}>
        <Text style={[styles.workerName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>{item.name}</Text>
        <View style={styles.workerMeta}>
          <View style={[styles.catBadge, { backgroundColor: item.category === 'karigar' ? '#7C3AED20' : '#E8840C20' }]}>
            <Text style={[styles.catText, { color: item.category === 'karigar' ? '#7C3AED' : '#E8840C', fontFamily: 'Inter_500Medium' }]}>
              {t(item.category)}
            </Text>
          </View>
          {item.village ? (
            <Text style={[styles.villageText, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
              {item.village}
            </Text>
          ) : null}
        </View>
      </View>
      {item.contact ? (
        <Text style={[styles.contactText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
          {item.contact}
        </Text>
      ) : null}
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 12, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
          {t('allWorkers')} ({workers.length})
        </Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={workers}
        renderItem={renderWorker}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + webBottomInset + 20 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={56} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
              {t('noWorkers')}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, flex: 1, textAlign: 'center' },
  list: { padding: 16, gap: 10 },
  workerCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, gap: 12 },
  workerPhoto: { width: 48, height: 48, borderRadius: 24 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18 },
  workerInfo: { flex: 1 },
  workerName: { fontSize: 15, marginBottom: 4 },
  workerMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  catText: { fontSize: 11 },
  villageText: { fontSize: 12 },
  contactText: { fontSize: 12 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16 },
});
