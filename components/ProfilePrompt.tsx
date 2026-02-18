import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TextInput, Pressable, useColorScheme,
  Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/lib/AppContext';
import { useThemeColors } from '@/constants/colors';
import { shadow } from '@/constants/shadows';
import * as Haptics from 'expo-haptics';

interface ProfilePromptProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (data: { username: string; gender: string; age: string }) => Promise<void>;
}

const GENDERS = [
  { key: 'male', icon: 'male', label: 'Male' },
  { key: 'female', icon: 'female', label: 'Female' },
  { key: 'other', icon: 'person', label: 'Other' },
];

export default function ProfilePrompt({ visible, onDismiss, onSave }: ProfilePromptProps) {
  const { t } = useApp();
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);

  const [username, setUsername] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!username.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      await onSave({ username: username.trim(), gender, age });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <LinearGradient
                colors={['#0EA5E9', '#38BDF8']}
                style={styles.iconCircle}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="person" size={28} color="#FFF" />
              </LinearGradient>
              <Text style={[styles.title, { color: colors.text, fontFamily: 'Poppins_700Bold' }]}>
                {t('completeProfile') || 'Complete Your Profile'}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: 'Poppins_400Regular' }]}>
                {t('profilePromptDesc') || 'Help us personalize your experience'}
              </Text>
            </View>

            {/* Username */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Poppins_500Medium' }]}>
                {t('username') || 'Username'} *
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Ionicons name="at" size={18} color={colors.textTertiary} />
                <TextInput
                  style={[styles.input, { color: colors.text, fontFamily: 'Poppins_400Regular' }]}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="e.g., rushil_45"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Gender */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Poppins_500Medium' }]}>
                {t('gender') || 'Gender'}
              </Text>
              <View style={styles.genderRow}>
                {GENDERS.map((g) => (
                  <Pressable
                    key={g.key}
                    style={[
                      styles.genderChip,
                      {
                        backgroundColor: gender === g.key ? 'rgba(14,165,233,0.15)' : colors.inputBg,
                        borderColor: gender === g.key ? '#0EA5E9' : colors.border,
                      },
                    ]}
                    onPress={() => { Haptics.selectionAsync(); setGender(g.key); }}
                  >
                    <Ionicons
                      name={g.icon as any}
                      size={18}
                      color={gender === g.key ? '#0EA5E9' : colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.genderText,
                        {
                          color: gender === g.key ? '#0EA5E9' : colors.textSecondary,
                          fontFamily: gender === g.key ? 'Poppins_600SemiBold' : 'Poppins_400Regular',
                        },
                      ]}
                    >
                      {g.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Age */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Poppins_500Medium' }]}>
                {t('age') || 'Age'}
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Ionicons name="calendar" size={18} color={colors.textTertiary} />
                <TextInput
                  style={[styles.input, { color: colors.text, fontFamily: 'Poppins_400Regular' }]}
                  value={age}
                  onChangeText={setAge}
                  placeholder="25"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable style={styles.skipBtn} onPress={onDismiss}>
                <Text style={[styles.skipText, { color: colors.textTertiary, fontFamily: 'Poppins_500Medium' }]}>
                  {t('skip') || 'Skip for now'}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSave}
                disabled={!username.trim() || saving}
                style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
              >
                <LinearGradient
                  colors={['#0EA5E9', '#38BDF8']}
                  style={[styles.saveBtn, (!username.trim() || saving) && { opacity: 0.5 }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                      <Text style={[styles.saveBtnText, { fontFamily: 'Poppins_600SemiBold' }]}>
                        {t('save') || 'Save'}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  card: { borderRadius: 28, padding: 28, maxHeight: '85%', ...shadow({ offsetY: 8, opacity: 0.15, radius: 24, elevation: 8 }) },
  header: { alignItems: 'center', marginBottom: 24 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 22, marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  field: { marginBottom: 18 },
  label: { fontSize: 13, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, gap: 10, height: 52 },
  input: { flex: 1, fontSize: 15, height: '100%' },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, gap: 6 },
  genderText: { fontSize: 13 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  skipBtn: { paddingVertical: 12, paddingHorizontal: 8 },
  skipText: { fontSize: 14 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, gap: 8 },
  saveBtnText: { color: '#FFF', fontSize: 15 },
});
