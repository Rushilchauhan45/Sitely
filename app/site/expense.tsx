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
  description: string;
}

export default function ExpenseScreen() {
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
          setEntries(workers.map(w => ({ worker: w, selected: false, amount: '', description: '' })));
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

  const updateDescription = (index: number, description: string) => {
    setEntries(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], description };
      return copy;
    });
  };

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
        description: e.description.trim() || undefined,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0],
      }));
      await store.addExpenseRecords(records);
      addAppNotification({
        type: 'general',
        title: t('addExpense'),
        body: `${records.length} expense(s) — ₹${records.reduce((s, r) => s + r.amount, 0).toLocaleString('en-IN')}`,
      });
      Alert.alert(t('success'), t('expenseSaved'));
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
          backgroundColor: item.selected ? '#EF444408' : colors.surface,
          borderColor: item.selected ? '#EF444440' : colors.borderLight,
        },
      ]}
    >
      <Pressable onPress={() => toggleSelect(index)} style={styles.entryTappable}>
        <View style={[styles.checkbox, { borderColor: item.selected ? colors.error : colors.border, backgroundColor: item.selected ? colors.error : 'transparent' }]}>
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
        <View style={{ gap: 6, marginLeft: 72 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              style={[styles.amountInput, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border, fontFamily: 'Poppins_500Medium' }]}
              value={item.amount}
              onChangeText={(v) => updateAmount(index, v)}
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.amountInput, { flex: 1, width: undefined, textAlign: 'left', backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border, fontFamily: 'Poppins_400Regular', fontSize: 13 }]}
              value={item.description}
              onChangeText={(v) => updateDescription(index, v)}
              placeholder={t('expenseDescription') || 'Description'}
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#EF4444', '#F87171']}
        style={[styles.header, { paddingTop: insets.top + webTopInset + 12 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Pressable onPress={() => router.back()} hitSlop={16} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: '#FFF', fontFamily: 'Poppins_600SemiBold' }]}>
          {t('addExpense')}
        </Text>
        <Pressable onPress={toggleSelectAll} hitSlop={16}>
          <Ionicons name={selectAll ? "checkbox" : "square-outline"} size={24} color="#FFF" />
        </Pressable>
      </LinearGradient>

      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.worker.id}
        contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="receipt-outline" title={t('noWorkers')} />
        }
      />

      {entries.some(e => e.selected) && (
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + webBottomInset + 12 }]}>
          <AnimatedPressable
            style={[styles.submitBtn, { backgroundColor: colors.error }]}
            scaleValue={0.96}
            haptic={null}
            onPress={handleSubmit}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFF" />
            <Text style={[styles.submitText, { fontFamily: 'Poppins_600SemiBold' }]}>
              {t('submitExpense')}
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
  amountInput: { width: 80, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, textAlign: 'center' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, gap: 8, ...shadow({ color: '#EF4444', offsetY: 4, opacity: 0.3, radius: 12, elevation: 6 }) },
  submitText: { color: '#FFF', fontSize: 16 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16 },
});
