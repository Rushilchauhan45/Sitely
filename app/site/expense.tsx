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

interface WorkerEntry {
  worker: Worker;
  selected: boolean;
  amount: string;
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
          setEntries(workers.map(w => ({ worker: w, selected: false, amount: '' })));
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

  const handleSubmit = async () => {
    const selected = entries.filter(e => e.selected && parseFloat(e.amount) > 0);
    if (selected.length === 0) {
      Alert.alert('', t('invalidAmount'));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const now = new Date();
    const records = selected.map(e => ({
      siteId: siteId || '',
      workerId: e.worker.id,
      workerName: e.worker.name,
      workerCategory: e.worker.category,
      amount: parseFloat(e.amount),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
    }));
    await store.addExpenseRecords(records);
    Alert.alert(t('success'), t('expenseSaved'));
    router.back();
  };

  const getInitials = (n: string) => n.trim().split(' ').map(p => p[0]?.toUpperCase() || '').slice(0, 2).join('');

  const renderEntry = ({ item, index }: { item: WorkerEntry; index: number }) => (
    <Pressable
      onPress={() => toggleSelect(index)}
      style={[
        styles.entryCard,
        {
          backgroundColor: item.selected ? '#EF444408' : colors.surface,
          borderColor: item.selected ? '#EF444440' : colors.borderLight,
        },
      ]}
    >
      <View style={[styles.checkbox, { borderColor: item.selected ? colors.error : colors.border, backgroundColor: item.selected ? colors.error : 'transparent' }]}>
        {item.selected && <Ionicons name="checkmark" size={14} color="#FFF" />}
      </View>
      <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
        <Text style={[styles.avatarText, { color: colors.primary, fontFamily: 'Inter_700Bold' }]}>
          {getInitials(item.worker.name)}
        </Text>
      </View>
      <View style={styles.entryInfo}>
        <Text style={[styles.entryName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
          {item.worker.name}
        </Text>
        <View style={[styles.catBadge, { backgroundColor: item.worker.category === 'karigar' ? '#7C3AED20' : '#E8840C20' }]}>
          <Text style={[styles.catText, { color: item.worker.category === 'karigar' ? '#7C3AED' : '#E8840C', fontFamily: 'Inter_500Medium' }]}>
            {t(item.worker.category)}
          </Text>
        </View>
      </View>
      {item.selected && (
        <TextInput
          style={[styles.amountInput, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border, fontFamily: 'Inter_500Medium' }]}
          value={item.amount}
          onChangeText={(v) => updateAmount(index, v)}
          placeholder="0"
          placeholderTextColor={colors.textTertiary}
          keyboardType="numeric"
        />
      )}
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 12, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
          {t('addExpense')}
        </Text>
        <Pressable onPress={toggleSelectAll} hitSlop={16}>
          <Ionicons name={selectAll ? "checkbox" : "square-outline"} size={24} color={colors.error} />
        </Pressable>
      </View>

      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.worker.id}
        contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={56} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
              {t('noWorkers')}
            </Text>
          </View>
        }
      />

      {entries.some(e => e.selected) && (
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + webBottomInset + 12 }]}>
          <Pressable
            style={({ pressed }) => [styles.submitBtn, { backgroundColor: colors.error, opacity: pressed ? 0.85 : 1 }]}
            onPress={handleSubmit}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFF" />
            <Text style={[styles.submitText, { fontFamily: 'Inter_600SemiBold' }]}>
              {t('submitExpense')}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, flex: 1, textAlign: 'center' },
  list: { padding: 16, gap: 8 },
  entryCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 15 },
  entryInfo: { flex: 1 },
  entryName: { fontSize: 14, marginBottom: 3 },
  catBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, alignSelf: 'flex-start' },
  catText: { fontSize: 10 },
  amountInput: { width: 80, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, textAlign: 'center' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, gap: 8 },
  submitText: { color: '#FFF', fontSize: 16 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16 },
});
