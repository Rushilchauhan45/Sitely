// ============================================================
// 📊 REPORTS SCREEN — Generate Worker / Material / Budget reports
// Supports CSV export & HTML report view
// ============================================================

import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Alert, Share,
  ActivityIndicator, Platform, Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown, FadeInUp,
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useApp } from '@/lib/AppContext';
import Colors from '@/constants/colors';
import { Fonts, FontSizes } from '@/theme/typography';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import * as ReportGen from '@/utils/reportGenerator';
import { WebView } from 'react-native-webview';

interface ReportType {
  id: 'workers' | 'materials' | 'budget' | 'payments';
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  descKey: string;
  gradient: readonly [string, string];
}

const REPORT_TYPES: ReportType[] = [
  {
    id: 'workers',
    icon: 'people',
    titleKey: 'workersReport',
    descKey: 'workersReportDesc',
    gradient: ['#0EA5E9', '#0284C7'] as const,
  },
  {
    id: 'materials',
    icon: 'cube',
    titleKey: 'materialsReport',
    descKey: 'materialsReportDesc',
    gradient: ['#10B981', '#059669'] as const,
  },
  {
    id: 'budget',
    icon: 'wallet',
    titleKey: 'budgetReport',
    descKey: 'budgetReportDesc',
    gradient: ['#F59E0B', '#D97706'] as const,
  },
  {
    id: 'payments',
    icon: 'receipt',
    titleKey: 'paymentHistory',
    descKey: 'paymentHistoryDesc',
    gradient: ['#8B5CF6', '#7C3AED'] as const,
  },
];

export default function ReportsScreen() {
  const { t } = useApp();
  const params = useLocalSearchParams<{ id: string; siteName: string }>();
  const siteId = params.id ?? '';
  const siteName = params.siteName ?? 'Site';
  const insets = useSafeAreaInsets();

  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const generateReport = async (type: ReportType['id']) => {
    setGeneratingId(type);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let csv = '';
      let filename = '';

      switch (type) {
        case 'workers':
          csv = await ReportGen.generateWorkerReportCSV(siteId, siteName);
          filename = `${siteName}_Workers_Report_${formatDateForFile()}.csv`;
          break;
        case 'materials':
          csv = await ReportGen.generateMaterialReportCSV(siteId, siteName);
          filename = `${siteName}_Materials_Report_${formatDateForFile()}.csv`;
          break;
        case 'budget':
          csv = await ReportGen.generateBudgetReportCSV(siteId, siteName);
          filename = `${siteName}_Budget_Report_${formatDateForFile()}.csv`;
          break;
        case 'payments':
          csv = await ReportGen.generatePaymentHistoryCSV(siteId, siteName);
          filename = `${siteName}_Payments_Report_${formatDateForFile()}.csv`;
          break;
      }

      if (Platform.OS === 'web') {
        // Web: use Share API or download
        try {
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
        } catch {
          Alert.alert('Report Generated', csv.substring(0, 500) + '...');
        }
      } else {
        await ReportGen.exportAndShareCSV(csv, filename);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      console.warn('Report generation error:', e);
      Alert.alert('Error', e?.message || 'Failed to generate report');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setGeneratingId(null);
    }
  };

  const generatePDF = async (type: ReportType['id']) => {
    setGeneratingId(type);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      let html = '';
      let title = '';

      switch (type) {
        case 'workers':
          html = await ReportGen.generateWorkerReportHTML(siteId, siteName);
          title = 'Workers';
          break;
        case 'materials':
          html = await ReportGen.generateMaterialReportHTML(siteId, siteName);
          title = 'Materials';
          break;
        case 'budget':
          html = await ReportGen.generateBudgetReportHTML(siteId, siteName);
          title = 'Budget';
          break;
        case 'payments':
          html = await ReportGen.generatePaymentHistoryHTML(siteId, siteName);
          title = 'Payments';
          break;
      }

      if (!html) {
        Alert.alert('No Data', 'No data available to generate PDF.');
        return;
      }

      const filename = `${siteName}_${title}_Report_${formatDateForFile()}`;

      if (Platform.OS === 'web') {
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(html);
          win.document.close();
          setTimeout(() => win.print(), 500);
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html, base64: false });
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: filename });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      console.warn('PDF generation error:', e);
      Alert.alert('Error', e?.message || 'Failed to generate PDF');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setGeneratingId(null);
    }
  };

  const previewReport = async (type: ReportType['id']) => {
    setGeneratingId(type);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      let html = '';
      let title = '';

      switch (type) {
        case 'workers':
          html = await ReportGen.generateWorkerReportHTML(siteId, siteName);
          title = 'Workers Report';
          break;
        case 'materials':
          html = await ReportGen.generateMaterialReportHTML(siteId, siteName);
          title = 'Materials Report';
          break;
        case 'budget':
          html = await ReportGen.generateBudgetReportHTML(siteId, siteName);
          title = 'Budget Report';
          break;
        case 'payments':
          html = await ReportGen.generatePaymentHistoryHTML(siteId, siteName);
          title = 'Payment History';
          break;
        default:
          html = '';
          title = 'Report Preview';
      }

      setPreviewHtml(html || '<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;color:#94a3b8;"><p>No data available for this report.</p></body></html>');
      setPreviewTitle(title);
      setShowPreview(true);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to preview report');
    } finally {
      setGeneratingId(null);
    }
  };

  const formatDateForFile = () => {
    const d = new Date();
    return `${d.getDate()}${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]}${d.getFullYear()}`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <LinearGradient
        colors={[...Colors.gradientHeader]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 12, paddingBottom: 24, paddingHorizontal: 20 }}
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
              {t('reports') || 'Reports'}
            </Text>
            <Text style={{ fontFamily: Fonts.regular, fontSize: FontSizes.sm, color: Colors.whiteSubtle }}>
              {siteName}
            </Text>
          </View>
          <View style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: Colors.glass, justifyContent: 'center', alignItems: 'center',
          }}>
            <Ionicons name="document-text" size={22} color={Colors.white} />
          </View>
        </View>
      </LinearGradient>

      {/* Report Cards */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <Text style={{
            fontFamily: Fonts.semiBold, fontSize: FontSizes.base,
            color: Colors.textSecondary, marginBottom: 16,
            textTransform: 'uppercase', letterSpacing: 1,
          }}>
            {t('selectReportType') || 'Select Report Type'}
          </Text>
        </Animated.View>

        {REPORT_TYPES.map((report, index) => (
          <Animated.View key={report.id} entering={FadeInDown.delay(100 + index * 80).springify()}>
            <GlassCard style={{ marginBottom: 16 }}>
              {/* Report Icon + Title */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <LinearGradient
                  colors={[...report.gradient]}
                  style={{
                    width: 48, height: 48, borderRadius: 14,
                    justifyContent: 'center', alignItems: 'center',
                  }}
                >
                  <Ionicons name={report.icon} size={24} color={Colors.white} />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontFamily: Fonts.semiBold, fontSize: FontSizes.lg, color: Colors.white,
                  }}>
                    {t(report.titleKey) || report.titleKey}
                  </Text>
                  <Text style={{
                    fontFamily: Fonts.regular, fontSize: FontSizes.sm, color: Colors.textSecondary,
                    marginTop: 2,
                  }}>
                    {t(report.descKey) || report.descKey}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  onPress={() => previewReport(report.id)}
                  disabled={generatingId !== null}
                  style={{
                    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    gap: 4, paddingVertical: 12, borderRadius: 12,
                    backgroundColor: Colors.glass,
                    borderWidth: 1, borderColor: Colors.glassBorder,
                    opacity: generatingId !== null ? 0.6 : 1,
                  }}
                >
                  <Ionicons name="eye-outline" size={16} color={Colors.textSecondary} />
                  <Text style={{
                    fontFamily: Fonts.medium, fontSize: FontSizes.xs, color: Colors.textSecondary,
                  }}>
                    {t('preview') || 'Preview'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => generatePDF(report.id)}
                  disabled={generatingId !== null}
                  style={{ flex: 1, overflow: 'hidden', borderRadius: 12, opacity: generatingId !== null ? 0.6 : 1 }}
                >
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                      gap: 4, paddingVertical: 12,
                    }}
                  >
                    {generatingId === report.id ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <Ionicons name="document-outline" size={16} color={Colors.white} />
                        <Text style={{
                          fontFamily: Fonts.semiBold, fontSize: FontSizes.xs, color: Colors.white,
                        }}>
                          PDF
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>

                <Pressable
                  onPress={() => generateReport(report.id)}
                  disabled={generatingId !== null}
                  style={{ flex: 1, overflow: 'hidden', borderRadius: 12, opacity: generatingId !== null ? 0.6 : 1 }}
                >
                  <LinearGradient
                    colors={[...report.gradient]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                      gap: 4, paddingVertical: 12,
                    }}
                  >
                    {generatingId === report.id ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <Ionicons name="download-outline" size={16} color={Colors.white} />
                        <Text style={{
                          fontFamily: Fonts.semiBold, fontSize: FontSizes.xs, color: Colors.white,
                        }}>
                          CSV
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </GlassCard>
          </Animated.View>
        ))}

        {/* Info Card */}
        <Animated.View entering={FadeInUp.delay(400).springify()}>
          <View style={{
            padding: 16, borderRadius: 16,
            backgroundColor: Colors.primaryLight,
            borderWidth: 1, borderColor: Colors.glassBorderLight,
            flexDirection: 'row', alignItems: 'center', gap: 12,
          }}>
            <Ionicons name="information-circle" size={24} color={Colors.primary} />
            <Text style={{
              flex: 1, fontFamily: Fonts.regular, fontSize: FontSizes.sm, color: Colors.textSecondary,
              lineHeight: 20,
            }}>
              {t('reportInfo') || 'Reports are generated from your local data. CSV files can be shared via WhatsApp, Email, or any other app.'}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Preview Modal */}
      <Modal visible={showPreview} animationType="slide" onRequestClose={() => setShowPreview(false)}>
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            paddingTop: insets.top + 12, paddingBottom: 12, paddingHorizontal: 20,
            backgroundColor: Colors.surface,
            borderBottomWidth: 1, borderBottomColor: Colors.border,
          }}>
            <Pressable onPress={() => setShowPreview(false)} style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: Colors.glass, justifyContent: 'center', alignItems: 'center',
            }}>
              <Ionicons name="close" size={22} color={Colors.white} />
            </Pressable>
            <Text style={{
              fontFamily: Fonts.semiBold, fontSize: FontSizes.lg, color: Colors.white, flex: 1,
            }}>
              {previewTitle}
            </Text>
          </View>
          {Platform.OS !== 'web' ? (
            <WebView
              source={{ html: previewHtml }}
              style={{ flex: 1, backgroundColor: '#fff' }}
            />
          ) : (
            <ScrollView style={{ flex: 1, padding: 16 }}>
              <Text style={{ fontFamily: Fonts.regular, fontSize: FontSizes.sm, color: Colors.textSecondary }}>
                {previewHtml.replace(/<[^>]+>/g, '\n')}
              </Text>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}
