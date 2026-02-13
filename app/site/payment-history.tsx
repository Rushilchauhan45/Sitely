import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, useColorScheme, Platform } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/lib/AppContext';
import { useThemeColors } from '@/constants/colors';
import { PaymentRecord } from '@/lib/types';
import * as store from '@/lib/storage';

export default function PaymentHistoryScreen() {
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const { t } = useApp();
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  useFocusEffect(
    useCallback(() => {
      if (siteId) {
        store.getPayments(siteId).then(p => setPayments(p.reverse()));
      }
    }, [siteId])
  );

  const formatCurrency = (n: number) => n.toLocaleString('en-IN');

  const renderPayment = ({ item, index }: { item: PaymentRecord; index: number }) => (
    <View style={[styles.row, { backgroundColor: index % 2 === 0 ? colors.surface : colors.background, borderBottomColor: colors.borderLight }]}>
      <Text style={[styles.cell, styles.numCell, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>{index + 1}</Text>
      <View style={[styles.nameCell]}>
        <Text style={[styles.cellText, { color: colors.text, fontFamily: 'Inter_500Medium' }]} numberOfLines={1}>{item.workerName}</Text>
        <View style={[styles.catBadge, { backgroundColor: item.workerCategory === 'karigar' ? '#7C3AED20' : '#E8840C20' }]}>
          <Text style={[styles.catText, { color: item.workerCategory === 'karigar' ? '#7C3AED' : '#E8840C', fontFamily: 'Inter_500Medium' }]}>
            {t(item.workerCategory)}
          </Text>
        </View>
      </View>
      <Text style={[styles.cell, styles.amountCell, { color: colors.success, fontFamily: 'Inter_600SemiBold' }]}>
        {formatCurrency(item.amount)}
      </Text>
      <View style={styles.dateCell}>
        <Text style={[styles.dateText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>{item.date}</Text>
        <Text style={[styles.timeText, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>{item.time}</Text>
      </View>
    </View>
  );

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 12, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
          {t('paymentHistory')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {payments.length > 0 && (
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>{t('totalPaid')}</Text>
          <Text style={[styles.summaryValue, { color: colors.success, fontFamily: 'Inter_700Bold' }]}>{formatCurrency(totalPaid)}</Text>
        </View>
      )}

      {payments.length > 0 && (
        <View style={[styles.tableHeader, { backgroundColor: colors.surfaceElevated, borderBottomColor: colors.border }]}>
          <Text style={[styles.cell, styles.numCell, styles.thText, { color: colors.textTertiary, fontFamily: 'Inter_600SemiBold' }]}>{t('number')}</Text>
          <Text style={[styles.cell, { flex: 1 }, styles.thText, { color: colors.textTertiary, fontFamily: 'Inter_600SemiBold' }]}>{t('workerName')}</Text>
          <Text style={[styles.cell, styles.amountCell, styles.thText, { color: colors.textTertiary, fontFamily: 'Inter_600SemiBold' }]}>{t('amount')}</Text>
          <Text style={[styles.cell, styles.thText, { width: 80, color: colors.textTertiary, fontFamily: 'Inter_600SemiBold' }]}>{t('date')}</Text>
        </View>
      )}

      <FlatList
        data={payments}
        renderItem={renderPayment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[{ paddingBottom: insets.bottom + webBottomInset + 20 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={56} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
              {t('noPaymentHistory')}
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
  summaryCard: { margin: 16, padding: 16, borderRadius: 14, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 22 },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  thText: { fontSize: 11, textTransform: 'uppercase' as const },
  row: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 0.5, alignItems: 'center' },
  cell: { fontSize: 13 },
  numCell: { width: 30, textAlign: 'center' },
  nameCell: { flex: 1, gap: 3 },
  cellText: { fontSize: 13 },
  amountCell: { width: 70, textAlign: 'right' },
  catBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, alignSelf: 'flex-start' },
  catText: { fontSize: 9 },
  dateCell: { width: 80, alignItems: 'flex-end' },
  dateText: { fontSize: 11 },
  timeText: { fontSize: 10 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16 },
});
