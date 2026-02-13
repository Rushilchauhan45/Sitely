import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Switch, useColorScheme, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/lib/AppContext';
import { useThemeColors } from '@/constants/colors';
import * as store from '@/lib/storage';
import * as Haptics from 'expo-haptics';

const SITE_TYPES = ['residential', 'commercial', 'rowHouse', 'tenament', 'shop', 'other'];

export default function CreateSiteScreen() {
  const { t } = useApp();
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const [name, setName] = useState('');
  const [type, setType] = useState('residential');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [isRunning, setIsRunning] = useState(true);
  const [ownerName, setOwnerName] = useState('');
  const [contact, setContact] = useState('');

  const handleCreate = async () => {
    if (!name.trim() || !contact.trim()) {
      Alert.alert('', t('required'));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await store.addSite({
      name: name.trim(),
      type,
      location: location.trim(),
      startDate,
      endDate: isRunning ? '' : endDate,
      isRunning,
      ownerName: ownerName.trim(),
      contact: contact.trim(),
    });
    router.back();
  };

  const inputStyle = [styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border, fontFamily: 'Inter_400Regular' as const }];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 12, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
          {t('createNewSite')}
        </Text>
        <Pressable
          onPress={handleCreate}
          style={({ pressed }) => [styles.saveBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
        >
          <Ionicons name="checkmark" size={22} color="#FFF" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t('siteName')} *</Text>
        <TextInput style={inputStyle} value={name} onChangeText={setName} placeholder={t('siteName')} placeholderTextColor={colors.textTertiary} />

        <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t('siteType')}</Text>
        <View style={styles.typeGrid}>
          {SITE_TYPES.map((st) => (
            <Pressable
              key={st}
              onPress={() => { setType(st); Haptics.selectionAsync(); }}
              style={[
                styles.typeChip,
                {
                  backgroundColor: type === st ? colors.primary + '18' : colors.surfaceElevated,
                  borderColor: type === st ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.typeChipText, { color: type === st ? colors.primary : colors.textSecondary, fontFamily: type === st ? 'Inter_600SemiBold' : 'Inter_400Regular' as any }]}>
                {t(st)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t('siteLocation')}</Text>
        <TextInput style={inputStyle} value={location} onChangeText={setLocation} placeholder={t('siteLocation')} placeholderTextColor={colors.textTertiary} />

        <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t('startDate')}</Text>
        <TextInput style={inputStyle} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textTertiary} />

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>{t('running')}</Text>
          <Switch
            value={isRunning}
            onValueChange={setIsRunning}
            trackColor={{ false: colors.border, true: colors.primary + '60' }}
            thumbColor={isRunning ? colors.primary : colors.textTertiary}
          />
        </View>

        {!isRunning && (
          <>
            <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t('endDate')}</Text>
            <TextInput style={inputStyle} value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textTertiary} />
          </>
        )}

        <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t('ownerName')}</Text>
        <TextInput style={inputStyle} value={ownerName} onChangeText={setOwnerName} placeholder={t('ownerName')} placeholderTextColor={colors.textTertiary} />

        <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t('contactDetails')} *</Text>
        <TextInput style={inputStyle} value={contact} onChangeText={setContact} placeholder={t('contactDetails')} placeholderTextColor={colors.textTertiary} keyboardType="phone-pad" />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18 },
  saveBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  form: { padding: 24, gap: 4 },
  label: { fontSize: 13, marginTop: 12, marginBottom: 6 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5 },
  typeChipText: { fontSize: 13 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 4 },
  switchLabel: { fontSize: 16 },
});
