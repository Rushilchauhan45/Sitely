import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Switch, useColorScheme, Platform, Alert, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/lib/AppContext';
import { useThemeColors } from '@/constants/colors';
import * as store from '@/lib/storage';
import * as Haptics from 'expo-haptics';

const SITE_TYPES = ['residential', 'commercial', 'rowHouse', 'tenament', 'shop', 'other'];

function FloatingInput({
  label,
  value,
  onChangeText,
  colors,
  keyboardType,
  required,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  colors: any;
  keyboardType?: any;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: focused || value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [focused, value]);

  const labelTop = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 6] });
  const labelSize = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });

  return (
    <Pressable
      style={[
        styles.floatingContainer,
        {
          backgroundColor: colors.inputBg,
          borderColor: focused ? colors.primary : colors.border,
          borderWidth: focused ? 1.5 : 1,
        },
      ]}
    >
      <Animated.Text
        style={[
          styles.floatingLabel,
          {
            top: labelTop,
            fontSize: labelSize,
            color: focused ? colors.primary : colors.textTertiary,
            fontFamily: 'Poppins_500Medium',
          },
        ]}
      >
        {label}{required ? ' *' : ''}
      </Animated.Text>
      <TextInput
        style={[styles.floatingInput, { color: colors.text, fontFamily: 'Poppins_400Regular' }]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType={keyboardType}
      />
    </Pressable>
  );
}

export default function CreateSiteScreen() {
  const { t } = useApp();
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const [name, setName] = useState('');
  const [type, setType] = useState('residential');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [isRunning, setIsRunning] = useState(true);
  const [ownerName, setOwnerName] = useState('');
  const [contact, setContact] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 12, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
          {t('createNewSite')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + webBottomInset + 40 }]} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <FloatingInput label={t('siteName')} value={name} onChangeText={setName} colors={colors} required />

          <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontFamily: 'Poppins_500Medium' }]}>{t('siteType')}</Text>
          <View style={styles.typeGrid}>
            {SITE_TYPES.map((st) => (
              <Pressable
                key={st}
                onPress={() => { setType(st); Haptics.selectionAsync(); }}
                style={({ pressed }) => [
                  styles.typeChip,
                  {
                    backgroundColor: type === st ? colors.primary : colors.inputBg,
                    borderColor: type === st ? colors.primary : colors.border,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  },
                ]}
              >
                <Text style={[styles.typeChipText, { color: type === st ? '#FFF' : colors.textSecondary, fontFamily: type === st ? 'Poppins_600SemiBold' : 'Poppins_400Regular' as any }]}>
                  {t(st)}
                </Text>
              </Pressable>
            ))}
          </View>

          <FloatingInput label={t('siteLocation')} value={location} onChangeText={setLocation} colors={colors} />
          <FloatingInput label={t('startDate')} value={startDate} onChangeText={setStartDate} colors={colors} />

          <View style={[styles.switchRow, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <View style={styles.switchLeft}>
              <Ionicons name={isRunning ? "pulse" : "checkmark-done"} size={20} color={isRunning ? colors.success : colors.textTertiary} />
              <Text style={[styles.switchLabel, { color: colors.text, fontFamily: 'Poppins_500Medium' }]}>{t('running')}</Text>
            </View>
            <Switch
              value={isRunning}
              onValueChange={setIsRunning}
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={isRunning ? colors.primary : colors.textTertiary}
            />
          </View>

          {!isRunning && (
            <FloatingInput label={t('endDate')} value={endDate} onChangeText={setEndDate} colors={colors} />
          )}

          <FloatingInput label={t('ownerName')} value={ownerName} onChangeText={setOwnerName} colors={colors} />
          <FloatingInput label={t('contactDetails')} value={contact} onChangeText={setContact} colors={colors} keyboardType="phone-pad" required />

          <Pressable
            onPress={handleCreate}
            style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }], marginTop: 24 }]}
          >
            <LinearGradient
              colors={['#1B4332', '#2D6A4F']}
              style={styles.submitBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="add-circle" size={22} color="#FFF" />
              <Text style={[styles.submitText, { fontFamily: 'Poppins_600SemiBold' }]}>{t('create')}</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18 },
  form: { padding: 24 },
  sectionLabel: { fontSize: 13, marginTop: 16, marginBottom: 10 },
  floatingContainer: { borderRadius: 14, paddingHorizontal: 16, height: 60, justifyContent: 'center', marginBottom: 14 },
  floatingLabel: { position: 'absolute', left: 16 },
  floatingInput: { fontSize: 15, paddingTop: 14, height: '100%' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  typeChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24, borderWidth: 1 },
  typeChipText: { fontSize: 13 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1, marginBottom: 14 },
  switchLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  switchLabel: { fontSize: 15 },
  submitBtn: { height: 56, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitText: { color: '#FFF', fontSize: 16 },
});
