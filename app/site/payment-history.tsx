import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, Pressable, useColorScheme, Platform, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/lib/AppContext';
import { useThemeColors } from '@/constants/colors';
import { shadow } from '@/constants/shadows';
import { PaymentRecord, Material } from '@/lib/types';
import { EmptyState } from '@/components/ui';
import * as store from '@/lib/storage';

type PaymentItem =
  | { type: 'worker'; data: PaymentRecord }
  | { type: 'material'; data: Material };

export default function PaymentHistoryScreen() {
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const { t } = useApp();
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [exporting, setExporting] = useState(false);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  useFocusEffect(
    useCallback(() => {
      if (siteId) {
        store.getPayments(siteId).then(setPayments);
        store.getMaterials(siteId).then(setMaterials);
      }
    }, [siteId])
  );

  const workerTotal = payments.reduce((s, p) => s + p.amount, 0);
  const materialTotal = materials.reduce((s, m) => s + (m.amountPaid || 0), 0);
  const grandTotal = workerTotal + materialTotal;

  const sections = [
    ...(payments.length > 0
      ? [{
          title: t('workerPayments') || 'Worker Payments',
          data: payments.map((p): PaymentItem => ({ type: 'worker' as const, data: p })),
        }]
      : []),
    ...(materials.filter(m => (m.amountPaid || 0) > 0).length > 0
      ? [{
          title: t('materialPayments') || 'Material Payments',
          data: materials
            .filter(m => (m.amountPaid || 0) > 0)
            .map((m): PaymentItem => ({ type: 'material' as const, data: m })),
        }]
      : []),
  ];

  const handleExportPDF = async () => {
    if (!siteId || (payments.length === 0 && materials.length === 0)) return;
    setExporting(true);
    try {
      const html = generatePaymentPDFHTML(payments, materials, workerTotal, materialTotal, grandTotal, t);
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
        } else {
          const blob = new Blob([html], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `payment_history_${new Date().toISOString().split('T')[0]}.html`;
          a.click();
          URL.revokeObjectURL(url);
        }
      } else {
        const { File, Paths } = require('expo-file-system');
        const Sharing = require('expo-sharing');
        const { generatePaymentHistoryCSV } = require('@/utils/reportGenerator');
        const csv = await generatePaymentHistoryCSV(siteId, '');
        const fileName = `payment_history_${siteId.slice(0, 8)}_${new Date().toISOString().split('T')[0]}.csv`;
        const file = new File(Paths.cache, fileName);
        file.write(csv);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: t('exportPDF') });
        }
      }
    } catch (e) {
      Alert.alert(t('authError'), String(e));
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (n: number) => n.toLocaleString('en-IN');

  const renderItem = ({ item, index }: { item: PaymentItem; index: number }) => {
    if (item.type === 'worker') {
      const p = item.data as PaymentRecord;
      return (
        <View style={[styles.row, { backgroundColor: index % 2 === 0 ? colors.surface : colors.background, borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.cell, styles.numCell, { color: colors.textTertiary, fontFamily: 'Poppins_400Regular' }]}>{index + 1}</Text>
          <View style={[styles.nameCell]}>
            <Text style={[styles.cellText, { color: colors.text, fontFamily: 'Poppins_500Medium' }]} numberOfLines={1}>{p.workerName}</Text>
            <View style={[styles.catBadge, { backgroundColor: p.workerCategory === 'karigar' ? '#7C3AED20' : '#E8840C20' }]}>
              <Text style={[styles.catText, { color: p.workerCategory === 'karigar' ? '#7C3AED' : '#E8840C', fontFamily: 'Poppins_500Medium' }]}>
                {t(p.workerCategory)}
              </Text>
            </View>
          </View>
          <Text style={[styles.cell, styles.amountCell, { color: colors.success, fontFamily: 'Poppins_600SemiBold' }]}>
            {formatCurrency(p.amount)}
          </Text>
          <View style={styles.dateCell}>
            <Text style={[styles.dateText, { color: colors.textSecondary, fontFamily: 'Poppins_400Regular' }]}>{p.date}</Text>
            <Text style={[styles.timeText, { color: colors.textTertiary, fontFamily: 'Poppins_400Regular' }]}>{p.time}</Text>
          </View>
        </View>
      );
    } else {
      const m = item.data as Material;
      const remaining = (m.totalAmount || 0) - (m.amountPaid || 0);
      return (
        <View style={[styles.row, { backgroundColor: index % 2 === 0 ? colors.surface : colors.background, borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.cell, styles.numCell, { color: colors.textTertiary, fontFamily: 'Poppins_400Regular' }]}>{index + 1}</Text>
          <View style={[styles.nameCell]}>
            <Text style={[styles.cellText, { color: colors.text, fontFamily: 'Poppins_500Medium' }]} numberOfLines={1}>{m.name}</Text>
            <View style={[styles.catBadge, { backgroundColor: '#F9731620' }]}>
              <Text style={[styles.catText, { color: '#F97316', fontFamily: 'Poppins_500Medium' }]}>
                {m.vendorName || t('materials')}
              </Text>
            </View>
          </View>
          <Text style={[styles.cell, styles.amountCell, { color: colors.success, fontFamily: 'Poppins_600SemiBold' }]}>
            {formatCurrency(m.amountPaid || 0)}
          </Text>
          <View style={styles.dateCell}>
            <Text style={[styles.dateText, { color: colors.textSecondary, fontFamily: 'Poppins_400Regular' }]}>{m.purchasedAt?.split('T')[0] || '-'}</Text>
            <Text style={[styles.timeText, { color: remaining > 0 ? '#EF4444' : colors.textTertiary, fontFamily: 'Poppins_400Regular' }]}>
              {remaining > 0 ? `Due: ₹${formatCurrency(remaining)}` : 'Paid'}
            </Text>
          </View>
        </View>
      );
    }
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.surfaceElevated || colors.background, borderBottomColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: 'Poppins_600SemiBold' }]}>{section.title}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#2196F3', '#60A5FA']}
        style={[styles.header, { paddingTop: insets.top + webTopInset + 12 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Pressable onPress={() => router.back()} hitSlop={16} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: '#FFF', fontFamily: 'Poppins_600SemiBold' }]}>
          {t('paymentHistory')}
        </Text>
        {sections.length > 0 ? (
          <Pressable onPress={handleExportPDF} hitSlop={16} style={styles.headerBackBtn} disabled={exporting}>
            {exporting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="download-outline" size={20} color="#FFF" />
            )}
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </LinearGradient>

      {/* Summary Cards */}
      {(workerTotal > 0 || materialTotal > 0) && (
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary, fontFamily: 'Poppins_400Regular' }]}>
              {t('workerPayments') || 'Workers'}
            </Text>
            <Text style={[styles.summarySmValue, { color: '#0EA5E9', fontFamily: 'Poppins_700Bold' }]}>
              ₹{formatCurrency(workerTotal)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary, fontFamily: 'Poppins_400Regular' }]}>
              {t('materialPayments') || 'Materials'}
            </Text>
            <Text style={[styles.summarySmValue, { color: '#F97316', fontFamily: 'Poppins_700Bold' }]}>
              ₹{formatCurrency(materialTotal)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.primary + '30' }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary, fontFamily: 'Poppins_400Regular' }]}>
              {t('totalPaid')}
            </Text>
            <Text style={[styles.summarySmValue, { color: colors.success, fontFamily: 'Poppins_700Bold' }]}>
              ₹{formatCurrency(grandTotal)}
            </Text>
          </View>
        </View>
      )}

      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        contentContainerStyle={[{ paddingBottom: insets.bottom + webBottomInset + 20 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="time-outline" title={t('noPaymentHistory')} />
        }
      />
    </View>
  );
}

// ─── PDF HTML Generator (both workers + materials) ──────────────────
function generatePaymentPDFHTML(
  payments: PaymentRecord[],
  materials: Material[],
  workerTotal: number,
  materialTotal: number,
  grandTotal: number,
  t: (key: string) => string,
): string {
  const fmtCurrency = (n: number) => n.toLocaleString('en-IN');

  const workerRows = payments.map((p, i) => `
    <tr>
      <td style="text-align:center;padding:10px 8px;border-bottom:1px solid #E5E7EB;">${i + 1}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #E5E7EB;">
        ${p.workerName}
        <span style="display:inline-block;margin-left:6px;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:600;background:${p.workerCategory === 'karigar' ? '#EDE9FE' : '#FFF7ED'};color:${p.workerCategory === 'karigar' ? '#7C3AED' : '#E8840C'};">
          ${t(p.workerCategory)}
        </span>
      </td>
      <td style="text-align:right;padding:10px 8px;border-bottom:1px solid #E5E7EB;font-weight:600;color:#059669;">₹${fmtCurrency(p.amount)}</td>
      <td style="text-align:right;padding:10px 8px;border-bottom:1px solid #E5E7EB;color:#6B7280;">${p.date}<br/><small style="color:#9CA3AF;">${p.time}</small></td>
    </tr>
  `).join('');

  const materialRows = materials
    .filter(m => (m.amountPaid || 0) > 0)
    .map((m, i) => {
      const remaining = (m.totalAmount || 0) - (m.amountPaid || 0);
      return `
    <tr>
      <td style="text-align:center;padding:10px 8px;border-bottom:1px solid #E5E7EB;">${i + 1}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #E5E7EB;">
        ${m.name}
        <span style="display:inline-block;margin-left:6px;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:600;background:#FFF7ED;color:#F97316;">
          ${m.vendorName || 'Material'}
        </span>
      </td>
      <td style="text-align:right;padding:10px 8px;border-bottom:1px solid #E5E7EB;font-weight:600;color:#059669;">₹${fmtCurrency(m.amountPaid || 0)}</td>
      <td style="text-align:right;padding:10px 8px;border-bottom:1px solid #E5E7EB;color:#6B7280;">${m.purchasedAt?.split('T')[0] || ''}${remaining > 0 ? `<br/><small style="color:#EF4444;">Due: ₹${fmtCurrency(remaining)}</small>` : ''}</td>
    </tr>
  `;
    }).join('');

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<title>${t('paymentHistory')}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #F8FAFC; color: #1F2937; padding: 32px; }
  .header { background: linear-gradient(135deg, #0EA5E9, #38BDF8); color: #FFF; padding: 28px 32px; border-radius: 16px; margin-bottom: 24px; }
  .header h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
  .header p { font-size: 13px; opacity: 0.85; }
  .summary { display: flex; gap: 12px; margin-bottom: 20px; }
  .summary-card { flex: 1; background: #FFF; border: 1px solid #E5E7EB; padding: 14px 18px; border-radius: 14px; text-align: center; }
  .summary-card .label { font-size: 12px; color: #6B7280; }
  .summary-card .value { font-size: 20px; font-weight: 700; }
  .section-title { font-size: 16px; font-weight: 600; color: #0EA5E9; margin: 20px 0 8px; }
  table { width: 100%; border-collapse: collapse; background: #FFF; border-radius: 14px; overflow: hidden; border: 1px solid #E5E7EB; margin-bottom: 16px; }
  thead { background: #F1F5F9; }
  th { padding: 12px 8px; font-size: 11px; text-transform: uppercase; font-weight: 600; color: #6B7280; letter-spacing: 0.5px; }
  .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #9CA3AF; }
  @media print { body { padding: 16px; } .no-print { display: none; } }
</style>
</head><body>
<div class="header">
  <h1>${t('paymentHistory')}</h1>
  <p>${t('exportPDF')} — ${new Date().toLocaleDateString()}</p>
</div>
<div class="summary">
  <div class="summary-card"><div class="label">Worker Payments</div><div class="value" style="color:#0EA5E9;">₹${fmtCurrency(workerTotal)}</div></div>
  <div class="summary-card"><div class="label">Material Payments</div><div class="value" style="color:#F97316;">₹${fmtCurrency(materialTotal)}</div></div>
  <div class="summary-card"><div class="label">Total Paid</div><div class="value" style="color:#059669;">₹${fmtCurrency(grandTotal)}</div></div>
</div>
${payments.length > 0 ? `
<div class="section-title">Worker Payments</div>
<table>
  <thead>
    <tr>
      <th style="text-align:center;width:50px;">#</th>
      <th style="text-align:left;">${t('workerName')}</th>
      <th style="text-align:right;width:100px;">${t('amount')}</th>
      <th style="text-align:right;width:110px;">${t('date')}</th>
    </tr>
  </thead>
  <tbody>${workerRows}</tbody>
</table>` : ''}
${materialRows ? `
<div class="section-title">Material Payments</div>
<table>
  <thead>
    <tr>
      <th style="text-align:center;width:50px;">#</th>
      <th style="text-align:left;">Material</th>
      <th style="text-align:right;width:100px;">Paid</th>
      <th style="text-align:right;width:110px;">Date</th>
    </tr>
  </thead>
  <tbody>${materialRows}</tbody>
</table>` : ''}
<div class="footer">Generated by SiteLy</div>
<script class="no-print">window.onload = function() { window.print(); }</script>
</body></html>`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 18, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerBackBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, flex: 1, textAlign: 'center', color: '#FFF' },
  summaryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  summaryCard: { flex: 1, padding: 12, borderRadius: 14, borderWidth: 1, alignItems: 'center', ...shadow({ offsetY: 4, opacity: 0.08, radius: 12, elevation: 3 }) },
  summaryLabel: { fontSize: 10, marginBottom: 2 },
  summarySmValue: { fontSize: 14 },
  sectionHeader: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  sectionTitle: { fontSize: 14 },
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
});
