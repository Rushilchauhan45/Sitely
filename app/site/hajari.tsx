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

interface WorkerEntry {
  worker: Worker;
  selected: boolean;
  amount: string;
  overtimeAmount: string;
}

export default function HajariScreen() {
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const { t } = useApp();
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<WorkerEntry[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  useFocusEffect(
    useCallback(() => {
      if (siteId) {
        store.getWorkers(siteId).then((workers) => {
          setEntries(workers.map(w => ({ worker: w, selected: false, amount: '', overtimeAmount: '' })));
        });
      }
    }, [siteId])
  );

  const toggleSelect = (index: number) => {
    Haptics.selectionAsync();
    setEntries(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], selected: !copy[index].selected };
      return copy;
    });
  };

  const toggleSelectAll = () => {
    Haptics.selectionAsync();
    const newVal = !selectAll;
    setSelectAll(newVal);
    setEntries(prev => prev.map(e => ({ ...e, selected: newVal })));
  };

  const updateAmount = (index: number, amount: string) => {
    setEntries(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], amount };
      return copy;
    });
  };

  const updateOvertimeAmount = (index: number, overtimeAmount: string) => {
    setEntries(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], overtimeAmount };
      return copy;
    });
  };

  const getEntryTotal = (entry: WorkerEntry) => {
    return (parseFloat(entry.amount) || 0) + (parseFloat(entry.overtimeAmount) || 0);
  };

  const grandTotal = entries
    .filter(e => e.selected)
    .reduce((sum, e) => sum + getEntryTotal(e), 0);

  const handleSubmit = async () => {
    const selected = entries.filter(e => e.selected && parseFloat(e.amount) > 0);
    if (selected.length === 0) {
      Alert.alert('', t('invalidAmount'));
      return;
    }
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const now = new Date();
      const records = selected.map(e => ({
        siteId: siteId || '',
        workerId: e.worker.id,
        workerName: e.worker.name,
        workerCategory: e.worker.category,
        amount: parseFloat(e.amount),
        overtime: parseFloat(e.overtimeAmount) || 0,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0],
      }));
      await store.addHajariRecords(records);
      addAppNotification({
        type: 'hajari',
        title: t('dailyHajari'),
        body: `${records.length} ${t('dailyHajari')} — ${records.reduce((s, r) => s + r.amount + (r.overtime || 0), 0).toLocaleString('en-IN')}`,
      });
      Alert.alert(t('success'), t('hajariSaved'));
      router.back();
    } catch (e) {
      Alert.alert(t('authError'), String(e));
    }
  };

  const getInitials = (n: string) => n.trim().split(' ').map(p => p[0]?.toUpperCase() || '').slice(0, 2).join('');

  const renderEntry = ({ item, index }: { item: WorkerEntry; index: number }) => (
    <View
      style={[
        styles.entryCard,
        {
          backgroundColor: item.selected ? colors.primary + '08' : colors.surface,
          borderColor: item.selected ? colors.primary + '40' : colors.borderLight,
        },
      ]}
    >
      <Pressable onPress={() => toggleSelect(index)} style={styles.entryTappable}>
        <View style={[styles.checkbox, { borderColor: item.selected ? colors.primary : colors.border, backgroundColor: item.selected ? colors.primary : 'transparent' }]}>
          {item.selected && <Ionicons name="checkmark" size={14} color="#FFF" />}
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.avatarText, { color: colors.primary, fontFamily: 'Poppins_700Bold' }]}>
            {getInitials(item.worker.name)}
          </Text>
        </View>
        <View style={styles.entryInfo}>
          <Text style={[styles.entryName, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
            {item.worker.name}
          </Text>
          <View style={[styles.catBadge, { backgroundColor: item.worker.category === 'karigar' ? '#7C3AED20' : '#E8840C20' }]}>
            <Text style={[styles.catText, { color: item.worker.category === 'karigar' ? '#7C3AED' : '#E8840C', fontFamily: 'Poppins_500Medium' }]}>
              {t(item.worker.category)}
            </Text>
          </View>
        </View>
      </Pressable>
      {item.selected && (
        <View style={styles.selectedControls}>
          {/* Base Amount */}
          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary, fontFamily: 'Poppins_500Medium' }]}>
              {t('amount') || 'Amount'}
            </Text>
            <TextInput
              style={[styles.amountInput, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.primary + '50', fontFamily: 'Poppins_500Medium' }]}
              value={item.amount}
              onChangeText={(v) => updateAmount(index, v)}
              placeholder="₹ 0"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />
          </View>
          {/* Overtime Amount */}
          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: '#F59E0B', fontFamily: 'Poppins_500Medium' }]}>
              {t('overtime') || 'OT'}
            </Text>
            <TextInput
              style={[styles.amountInput, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: '#F59E0B50', fontFamily: 'Poppins_500Medium' }]}
              value={item.overtimeAmount}
              onChangeText={(v) => updateOvertimeAmount(index, v)}
              placeholder="₹ 0"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />
          </View>
          {/* Entry Total */}
          {getEntryTotal(item) > 0 && (
            <View style={[styles.entryTotalRow, { backgroundColor: colors.success + '15' }]}>
              <Text style={[styles.entryTotalLabel, { color: colors.textSecondary, fontFamily: 'Poppins_400Regular' }]}>
                {t('total') || 'Total'}
              </Text>
              <Text style={[styles.entryTotalValue, { color: colors.success, fontFamily: 'Poppins_700Bold' }]}>
                ₹ {getEntryTotal(item).toLocaleString('en-IN')}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#7C3AED', '#A78BFA']}
        style={[styles.header, { paddingTop: insets.top + webTopInset + 12 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Pressable onPress={() => router.back()} hitSlop={16} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: '#FFF', fontFamily: 'Poppins_600SemiBold' }]}>
          {t('dailyHajari')}
        </Text>
        <Pressable onPress={toggleSelectAll} hitSlop={16}>
          <Ionicons name={selectAll ? "checkbox" : "square-outline"} size={24} color="#FFF" />
        </Pressable>
      </LinearGradient>

      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.worker.id}
        contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="clipboard-outline" title={t('noWorkers')} />
        }
      />

      {entries.some(e => e.selected) && (
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + webBottomInset + 12 }]}>
          {grandTotal > 0 && (
            <View style={styles.grandTotalRow}>
              <Text style={[styles.grandTotalLabel, { color: colors.textSecondary, fontFamily: 'Poppins_500Medium' }]}>
                {t('grandTotal') || 'Grand Total'}
              </Text>
              <Text style={[styles.grandTotalValue, { color: colors.success, fontFamily: 'Poppins_700Bold' }]}>
                ₹ {grandTotal.toLocaleString('en-IN')}
              </Text>
            </View>
          )}
          <AnimatedPressable
            style={[styles.submitBtn, { backgroundColor: '#7C3AED' }]}
            scaleValue={0.96}
            haptic={null}
            onPress={handleSubmit}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFF" />
            <Text style={[styles.submitText, { fontFamily: 'Poppins_600SemiBold' }]}>
              {t('submitHajari')}
            </Text>
          </AnimatedPressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 18, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerBackBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, flex: 1, textAlign: 'center', color: '#FFF' },
  list: { padding: 16, gap: 8 },
  entryCard: { padding: 14, borderRadius: 16, borderWidth: 1, gap: 10, ...shadow({ opacity: 0.04, radius: 8, elevation: 1 }) },
  entryTappable: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 15 },
  entryInfo: { flex: 1 },
  entryName: { fontSize: 14, marginBottom: 3 },
  catBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, alignSelf: 'flex-start' },
  catText: { fontSize: 10 },
  selectedControls: { marginLeft: 72, gap: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputLabel: { fontSize: 12, width: 52 },
  amountInput: { flex: 1, borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, textAlign: 'center' },
  entryTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  entryTotalLabel: { fontSize: 12 },
  entryTotalValue: { fontSize: 14 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1, gap: 10 },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  grandTotalLabel: { fontSize: 14 },
  grandTotalValue: { fontSize: 18 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, gap: 8, ...shadow({ color: '#7C3AED', offsetY: 4, opacity: 0.3, radius: 12, elevation: 6 }) },
  submitText: { color: '#FFF', fontSize: 16 },
});
