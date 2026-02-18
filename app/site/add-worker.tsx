import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, useColorScheme, Platform, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '@/lib/AppContext';
import { useThemeColors } from '@/constants/colors';
import { shadow } from '@/constants/shadows';
import { AnimatedPressable } from '@/components/ui';
import * as store from '@/lib/storage';
import * as Haptics from 'expo-haptics';

export default function AddWorkerScreen() {
  const { siteId, editId, editName, editAge, editContact, editVillage, editCategory, editPhotoUri } = useLocalSearchParams<{
    siteId: string;
    editId?: string;
    editName?: string;
    editAge?: string;
    editContact?: string;
    editVillage?: string;
    editCategory?: string;
    editPhotoUri?: string;
  }>();
  const isEditMode = !!editId;
  const { t } = useApp();
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const [name, setName] = useState(editName || '');
  const [age, setAge] = useState(editAge || '');
  const [contact, setContact] = useState(editContact || '');
  const [village, setVillage] = useState(editVillage || '');
  const [category, setCategory] = useState<'karigar' | 'majdur'>((editCategory as 'karigar' | 'majdur') || 'majdur');
  const [photoUri, setPhotoUri] = useState<string | null>(editPhotoUri || null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('', t('required'));
      return;
    }
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (isEditMode && editId) {
        await store.updateWorker(editId, {
          name: name.trim(),
          age: age.trim(),
          contact: contact.trim(),
          village: village.trim(),
          category,
          photoUri,
        });
      } else {
        await store.addWorker({
          siteId: siteId || '',
          name: name.trim(),
          age: age.trim(),
          contact: contact.trim(),
          village: village.trim(),
          category,
          photoUri,
        });
      }
      router.back();
    } catch (e) {
      Alert.alert(t('authError'), String(e));
    }
  };

  const getInitials = (n: string) => {
    const parts = n.trim().split(' ');
    return parts.map(p => p[0]?.toUpperCase() || '').slice(0, 2).join('');
  };

  const inputStyle = [styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border, fontFamily: 'Poppins_400Regular' as const }];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#E8840C', '#F59E0B']}
        style={[styles.header, { paddingTop: insets.top + webTopInset + 12 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Pressable onPress={() => router.back()} hitSlop={16} style={styles.headerBackBtn}>
          <Ionicons name="close" size={22} color="#FFF" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: '#FFF', fontFamily: 'Poppins_600SemiBold' }]}>
          {isEditMode ? (t('editWorker') || 'Edit Worker') : t('addWorkers')}
        </Text>
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [styles.saveBtn, { backgroundColor: 'rgba(255,255,255,0.25)', opacity: pressed ? 0.8 : 1 }]}
        >
          <Ionicons name="checkmark" size={22} color="#FFF" />
        </Pressable>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        <Pressable onPress={pickImage} style={styles.photoSection}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
              {name.trim() ? (
                <Text style={[styles.avatarText, { color: colors.primary, fontFamily: 'Poppins_700Bold' }]}>
                  {getInitials(name)}
                </Text>
              ) : (
                <Ionicons name="camera" size={32} color={colors.primary} />
              )}
            </View>
          )}
          <Text style={[styles.photoLabel, { color: colors.textSecondary, fontFamily: 'Poppins_400Regular' }]}>
            {t('workerPhoto')}
          </Text>
        </Pressable>

        <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Poppins_500Medium' }]}>{t('workerName')} *</Text>
        <TextInput style={inputStyle} value={name} onChangeText={setName} placeholder={t('workerName')} placeholderTextColor={colors.textTertiary} />

        <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Poppins_500Medium' }]}>{t('age')}</Text>
        <TextInput style={inputStyle} value={age} onChangeText={setAge} placeholder={t('age')} placeholderTextColor={colors.textTertiary} keyboardType="number-pad" />

        <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Poppins_500Medium' }]}>{t('contact')}</Text>
        <TextInput style={inputStyle} value={contact} onChangeText={setContact} placeholder={t('contact')} placeholderTextColor={colors.textTertiary} keyboardType="phone-pad" />

        <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Poppins_500Medium' }]}>{t('village')}</Text>
        <TextInput style={inputStyle} value={village} onChangeText={setVillage} placeholder={t('village')} placeholderTextColor={colors.textTertiary} />

        <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Poppins_500Medium' }]}>{t('category')}</Text>
        <View style={styles.categoryRow}>
          {(['karigar', 'majdur'] as const).map((cat) => (
            <Pressable
              key={cat}
              onPress={() => { setCategory(cat); Haptics.selectionAsync(); }}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: category === cat ? colors.primary + '18' : colors.surfaceElevated,
                  borderColor: category === cat ? colors.primary : colors.border,
                  flex: 1,
                },
              ]}
            >
              <Text style={[styles.categoryText, { color: category === cat ? colors.primary : colors.textSecondary, fontFamily: category === cat ? 'Poppins_600SemiBold' : 'Poppins_400Regular' as any }]}>
                {t(cat)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 18, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerBackBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, flex: 1, textAlign: 'center' },
  saveBtn: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  form: { padding: 24, gap: 4 },
  photoSection: { alignItems: 'center', marginBottom: 16 },
  photoPreview: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 32 },
  photoLabel: { fontSize: 13, marginTop: 8 },
  label: { fontSize: 13, marginTop: 12, marginBottom: 6 },
  input: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, ...shadow({ opacity: 0.04, radius: 6, elevation: 1 }) },
  categoryRow: { flexDirection: 'row', gap: 10 },
  categoryChip: { paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  categoryText: { fontSize: 15 },
});
