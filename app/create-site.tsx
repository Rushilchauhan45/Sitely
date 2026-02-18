import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Switch, useColorScheme, Platform, Alert, Animated, Modal, Share } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/lib/AppContext';
import { useThemeColors } from '@/constants/colors';
import { shadow } from '@/constants/shadows';
import { AnimatedPressable } from '@/components/ui';
import * as store from '@/lib/storage';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

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
    <View
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
    </View>
  );
}

export default function CreateSiteScreen() {
  const { t, user } = useApp();
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const [name, setName] = useState('');
  const [type, setType] = useState<import('@/lib/types').SiteType>('residential');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [isRunning, setIsRunning] = useState(true);
  const [ownerName, setOwnerName] = useState('');
  const [contact, setContact] = useState('');
  const [successCode, setSuccessCode] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Generate unique 6-character site code
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let siteCode = '';
      for (let i = 0; i < 6; i++) {
        siteCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      await store.addSite({
        name: name.trim(),
        type,
        location: location.trim(),
        startDate,
        endDate: isRunning ? '' : endDate,
        isRunning,
        ownerName: ownerName.trim(),
        contact: contact.trim(),
        siteCode,
      }, user?.id);

      // Show styled success modal
      setSuccessCode(siteCode);
      setShowSuccessModal(true);
    } catch (e) {
      Alert.alert(t('authError'), String(e));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#0EA5E9', '#0284C7', '#1A1A2E']}
        style={[styles.header, { paddingTop: insets.top + webTopInset + 12 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Pressable onPress={() => router.back()} hitSlop={16} style={styles.headerBackBtn}>
          <Ionicons name="close" size={22} color="#FFF" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: '#FFF', fontFamily: 'Poppins_600SemiBold' }]}>
          {t('createNewSite')}
        </Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + webBottomInset + 40 }]} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <FloatingInput label={t('siteName')} value={name} onChangeText={setName} colors={colors} required />

          <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontFamily: 'Poppins_500Medium' }]}>{t('siteType')}</Text>
          <View style={styles.typeGrid}>
            {SITE_TYPES.map((st) => (
              <Pressable
                key={st}
                onPress={() => { setType(st as import('@/lib/types').SiteType); Haptics.selectionAsync(); }}
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

          <AnimatedPressable
            onPress={handleCreate}
            scaleValue={0.96}
            haptic={null}
            style={{ marginTop: 24 }}
          >
            <LinearGradient
              colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
              style={styles.submitBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="add-circle" size={22} color="#FFF" />
              <Text style={[styles.submitText, { fontFamily: 'Poppins_600SemiBold' }]}>{t('create')}</Text>
            </LinearGradient>
          </AnimatedPressable>
        </Animated.View>
      </ScrollView>

      {/* Site Code Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 28, width: '100%', maxWidth: 340, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#10B98120', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="checkmark-circle" size={40} color="#10B981" />
            </View>
            <Text style={{ color: colors.text, fontSize: 20, fontFamily: 'Poppins_700Bold', marginBottom: 8, textAlign: 'center' }}>
              {t('siteCreated')}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', marginBottom: 16 }}>
              Share this code with the site owner to monitor progress
            </Text>
            <View style={{ backgroundColor: colors.inputBg, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 24, marginBottom: 20, borderWidth: 1, borderColor: colors.primary + '40' }}>
              <Text style={{ color: colors.primary, fontSize: 32, fontFamily: 'Poppins_700Bold', letterSpacing: 6, textAlign: 'center' }}>
                {successCode}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <Pressable
                onPress={async () => {
                  await Clipboard.setStringAsync(successCode);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  Alert.alert('', t('codeCopied') || 'Code copied!');
                }}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primary + '20', borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: colors.primary + '40' }}
              >
                <Ionicons name="copy" size={18} color={colors.primary} />
                <Text style={{ color: colors.primary, fontFamily: 'Poppins_600SemiBold', fontSize: 14 }}>
                  {t('copyCode') || 'Copy'}
                </Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  await Share.share({ message: `Site Code: ${successCode}\nUse this code in Sitely app to track site progress.` });
                }}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#10B98120', borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: '#10B98140' }}
              >
                <Ionicons name="share-social" size={18} color="#10B981" />
                <Text style={{ color: '#10B981', fontFamily: 'Poppins_600SemiBold', fontSize: 14 }}>
                  {t('shareCode') || 'Share'}
                </Text>
              </Pressable>
            </View>
            <Pressable
              onPress={() => { setShowSuccessModal(false); router.back(); }}
              style={{ marginTop: 16, paddingVertical: 10 }}
            >
              <Text style={{ color: colors.textSecondary, fontFamily: 'Poppins_500Medium', fontSize: 14 }}>
                {t('done') || 'Done'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 18, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerBackBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, flex: 1, textAlign: 'center' },
  form: { padding: 24 },
  sectionLabel: { fontSize: 13, marginTop: 16, marginBottom: 10 },
  floatingContainer: { borderRadius: 16, paddingHorizontal: 16, height: 60, justifyContent: 'center', marginBottom: 14, ...shadow({ opacity: 0.04, radius: 8, elevation: 1 }) },
  floatingLabel: { position: 'absolute', left: 16 },
  floatingInput: { fontSize: 15, paddingTop: 14, height: '100%' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  typeChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24, borderWidth: 1, ...shadow({ offsetY: 1, opacity: 0.04, elevation: 1 }) },
  typeChipText: { fontSize: 13 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, borderWidth: 1, marginBottom: 14, ...shadow({ opacity: 0.04, radius: 8, elevation: 1 }) },
  switchLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  switchLabel: { fontSize: 15 },
  submitBtn: { height: 58, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...shadow({ offsetY: 4, opacity: 0.2, radius: 12, elevation: 6 }) },
  submitText: { color: '#FFF', fontSize: 16 },
});
