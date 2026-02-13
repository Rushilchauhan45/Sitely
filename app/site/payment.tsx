import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, useColorScheme, Platform, Alert } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/lib/AppContext';
import { useThemeColors } from '@/constants/colors';
import { Worker } from '@/lib/types';
import * as store from '@/lib/storage';
import * as Haptics from 'expo-haptics';

interface WorkerPaymentInfo {
  worker: Worker;
  totalHajari: number;
  totalExpense: number;
  totalPaid: number;
  remaining: number;
}

export default function PaymentScreen() {
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const { t } = useApp();
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const [workerInfos, setWorkerInfos] = useState<WorkerPaymentInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  useFocusEffect(
    useCallback(() => {
      if (siteId) loadData();
    }, [siteId])
  );

  const loadData = async () => {
    if (!siteId) return;
    const workers = await store.getWorkers(siteId);
    const infos: WorkerPaymentInfo[] = [];
    for (const w of workers) {
      const totals = await store.getWorkerTotals(siteId, w.id);
      infos.push({ worker: w, ...totals });
    }
    setWorkerInfos(infos);
  };

  const handlePay = async (info: WorkerPaymentInfo) => {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) {
      Alert.alert('', t('invalidAmount'));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const now = new Date();
    await store.addPayment({
      siteId: siteId || '',
      workerId: info.worker.id,
      workerName: info.worker.name,
      workerCategory: info.worker.category,
      amount,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
    });
    Alert.alert(t('success'), t('paymentSaved'));
    setSelectedId(null);
    setPayAmount('');
    loadData();
  };

  const getInitials = (n: string) => n.trim().split(' ').map(p => p[0]?.toUpperCase() || '').slice(0, 2).join('');

  const formatCurrency = (n: number) => n.toLocaleString('en-IN');

  const renderWorker = ({ item }: { item: WorkerPaymentInfo }) => {
    const isSelected = selectedId === item.worker.id;
    return (
      <Pressable
        onPress={() => { setSelectedId(isSelected ? null : item.worker.id); setPayAmount(''); Haptics.selectionAsync(); }}
        style={[
          styles.card,
          {
            backgroundColor: isSelected ? colors.success + '08' : colors.surface,
            borderColor: isSelected ? colors.success + '40' : colors.borderLight,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.avatarText, { color: colors.primary, fontFamily: 'Inter_700Bold' }]}>
              {getInitials(item.worker.name)}
            </Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.workerName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
              {item.worker.name}
            </Text>
            <View style={[styles.catBadge, { backgroundColor: item.worker.category === 'karigar' ? '#7C3AED20' : '#E8840C20' }]}>
              <Text style={[styles.catText, { color: item.worker.category === 'karigar' ? '#7C3AED' : '#E8840C', fontFamily: 'Inter_500Medium' }]}>
                {t(item.worker.category)}
              </Text>
            </View>
          </View>
          <Ionicons name={isSelected ? "chevron-up" : "chevron-down"} size={20} color={colors.textTertiary} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>{t('totalHajari')}</Text>
            <Text style={[styles.statValue, { color: colors.success, fontFamily: 'Inter_600SemiBold' }]}>{formatCurrency(item.totalHajari)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>{t('totalExpense')}</Text>
            <Text style={[styles.statValue, { color: colors.error, fontFamily: 'Inter_600SemiBold' }]}>{formatCurrency(item.totalExpense)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>{t('totalPaid')}</Text>
            <Text style={[styles.statValue, { color: colors.accent, fontFamily: 'Inter_600SemiBold' }]}>{formatCurrency(item.totalPaid)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>{t('remaining')}</Text>
            <Text style={[styles.statValue, { color: item.remaining > 0 ? colors.warning : colors.textTertiary, fontFamily: 'Inter_700Bold' }]}>{formatCurrency(item.remaining)}</Text>
          </View>
        </View>

        {isSelected && (
          <View style={styles.paySection}>
            <TextInput
              style={[styles.payInput, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border, fontFamily: 'Inter_500Medium' }]}
              value={payAmount}
              onChangeText={setPayAmount}
              placeholder={t('enterAmount')}
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />
            <Pressable
              style={({ pressed }) => [styles.payBtn, { backgroundColor: colors.success, opacity: pressed ? 0.85 : 1 }]}
              onPress={() => handlePay(item)}
            >
              <Ionicons name="cash" size={18} color="#FFF" />
              <Text style={[styles.payBtnText, { fontFamily: 'Inter_600SemiBold' }]}>{t('payNow')}</Text>
            </Pressable>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 12, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
          {t('payToWorker')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={workerInfos}
        renderItem={renderWorker}
        keyExtractor={(item) => item.worker.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + webBottomInset + 20 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cash-outline" size={56} color={colors.textTertiary} />
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
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16 },
  cardInfo: { flex: 1 },
  workerName: { fontSize: 15, marginBottom: 3 },
  catBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, alignSelf: 'flex-start' },
  catText: { fontSize: 10 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, marginBottom: 2 },
  statValue: { fontSize: 13 },
  paySection: { marginTop: 14, flexDirection: 'row', gap: 10 },
  payInput: { flex: 1, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  payBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, borderRadius: 10, gap: 6 },
  payBtnText: { color: '#FFF', fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16 },
});
