import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, useColorScheme, Platform, Alert } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/lib/AppContext';
import { useThemeColors } from '@/constants/colors';
import { shadow } from '@/constants/shadows';
import { Worker } from '@/lib/types';
import { EmptyState, AnimatedPressable } from '@/components/ui';
import * as store from '@/lib/storage';
import * as Haptics from 'expo-haptics';
import { addAppNotification } from '@/app/notifications';

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
  const [payMethod, setPayMethod] = useState<'cash' | 'upi' | 'bank'>('cash');
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
    try {
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
        method: payMethod,
      });
      Alert.alert(t('success'), t('paymentSaved'));
      addAppNotification({
        type: 'salary',
        title: t('payToWorker'),
        body: `₹${amount.toLocaleString('en-IN')} → ${info.worker.name}`,
      });
      setSelectedId(null);
      setPayAmount('');
      setPayMethod('cash');
      loadData();
    } catch (e) {
      Alert.alert(t('authError'), String(e));
    }
  };

  const getInitials = (n: string) => n.trim().split(' ').map(p => p[0]?.toUpperCase() || '').slice(0, 2).join('');

  const formatCurrency = (n: number) => n.toLocaleString('en-IN');

  const renderWorker = ({ item }: { item: WorkerPaymentInfo }) => {
    const isSelected = selectedId === item.worker.id;
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: isSelected ? colors.success + '08' : colors.surface,
            borderColor: isSelected ? colors.success + '40' : colors.borderLight,
          },
        ]}
      >
        <Pressable onPress={() => { setSelectedId(isSelected ? null : item.worker.id); setPayAmount(''); Haptics.selectionAsync(); }}>
          <View style={styles.cardHeader}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.avatarText, { color: colors.primary, fontFamily: 'Poppins_700Bold' }]}>
                {getInitials(item.worker.name)}
              </Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.workerName, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
                {item.worker.name}
              </Text>
              <View style={[styles.catBadge, { backgroundColor: item.worker.category === 'karigar' ? '#7C3AED20' : '#E8840C20' }]}>
                <Text style={[styles.catText, { color: item.worker.category === 'karigar' ? '#7C3AED' : '#E8840C', fontFamily: 'Poppins_500Medium' }]}>
                  {t(item.worker.category)}
                </Text>
              </View>
            </View>
            <Ionicons name={isSelected ? "chevron-up" : "chevron-down"} size={20} color={colors.textTertiary} />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textTertiary, fontFamily: 'Poppins_400Regular' }]}>{t('totalHajari')}</Text>
              <Text style={[styles.statValue, { color: colors.success, fontFamily: 'Poppins_600SemiBold' }]}>{formatCurrency(item.totalHajari)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textTertiary, fontFamily: 'Poppins_400Regular' }]}>{t('totalExpense')}</Text>
              <Text style={[styles.statValue, { color: colors.error, fontFamily: 'Poppins_600SemiBold' }]}>{formatCurrency(item.totalExpense)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textTertiary, fontFamily: 'Poppins_400Regular' }]}>{t('totalPaid')}</Text>
              <Text style={[styles.statValue, { color: colors.accent, fontFamily: 'Poppins_600SemiBold' }]}>{formatCurrency(item.totalPaid)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textTertiary, fontFamily: 'Poppins_400Regular' }]}>{t('remaining')}</Text>
              <Text style={[styles.statValue, { color: item.remaining > 0 ? colors.warning : colors.textTertiary, fontFamily: 'Poppins_700Bold' }]}>{formatCurrency(item.remaining)}</Text>
            </View>
          </View>
        </Pressable>

        {isSelected && (
          <View style={styles.paySection}>
            {/* Payment Method Picker */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              {(['cash', 'upi', 'bank'] as const).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => { setPayMethod(m); Haptics.selectionAsync(); }}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: payMethod === m ? colors.primary + '20' : colors.surfaceElevated,
                    borderWidth: 1,
                    borderColor: payMethod === m ? colors.primary : colors.border,
                    alignItems: 'center',
                  }}
                >
                  <Ionicons
                    name={m === 'cash' ? 'cash' : m === 'upi' ? 'phone-portrait' : 'business'}
                    size={18}
                    color={payMethod === m ? colors.primary : colors.textTertiary}
                  />
                  <Text style={{ color: payMethod === m ? colors.primary : colors.textSecondary, fontSize: 11, fontFamily: 'Poppins_500Medium', marginTop: 2 }}>
                    {t(m === 'bank' ? 'bankTransfer' : m) || (m === 'cash' ? 'Cash' : m === 'upi' ? 'UPI' : 'Bank')}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.payInput, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border, fontFamily: 'Poppins_500Medium' }]}
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
                <Text style={[styles.payBtnText, { fontFamily: 'Poppins_600SemiBold' }]}>{t('payNow')}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#10B981', '#34D399']}
        style={[styles.header, { paddingTop: insets.top + webTopInset + 12 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Pressable onPress={() => router.back()} hitSlop={16} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: '#FFF', fontFamily: 'Poppins_600SemiBold' }]}>
          {t('payToWorker')}
        </Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <FlatList
        data={workerInfos}
        renderItem={renderWorker}
        keyExtractor={(item) => item.worker.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + webBottomInset + 20 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="cash-outline" title={t('noWorkers')} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 18, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerBackBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, flex: 1, textAlign: 'center', color: '#FFF' },
  list: { padding: 16, gap: 10 },
  card: { borderRadius: 18, padding: 16, borderWidth: 1, ...shadow({ offsetY: 3, opacity: 0.06, radius: 10 }) },
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
  paySection: { marginTop: 14, gap: 0 },
  payInput: { flex: 1, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  payBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, borderRadius: 12, gap: 6, ...shadow({ color: '#10B981', offsetY: 3, opacity: 0.3, radius: 8, elevation: 4 }) },
  payBtnText: { color: '#FFF', fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16 },
});
