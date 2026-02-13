import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, useColorScheme, Platform, Dimensions } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '@/lib/AppContext';
import { useThemeColors } from '@/constants/colors';
import { SitePhoto } from '@/lib/types';
import * as store from '@/lib/storage';
import * as Haptics from 'expo-haptics';

const screenWidth = Dimensions.get('window').width;

export default function PhotosScreen() {
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const { t } = useApp();
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const [photos, setPhotos] = useState<SitePhoto[]>([]);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  useFocusEffect(
    useCallback(() => {
      if (siteId) store.getPhotos(siteId).then(p => setPhotos(p.reverse()));
    }, [siteId])
  );

  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const now = new Date();
    await store.addPhoto({
      siteId: siteId || '',
      uri: result.assets[0].uri,
      description: '',
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
    });
    if (siteId) store.getPhotos(siteId).then(p => setPhotos(p.reverse()));
  };

  const renderPhoto = ({ item }: { item: SitePhoto }) => (
    <View style={[styles.photoCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <Image source={{ uri: item.uri }} style={styles.photo} contentFit="cover" />
      <View style={styles.photoInfo}>
        <View style={styles.photoDateRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
          <Text style={[styles.photoDate, { color: colors.textSecondary, fontFamily: 'Poppins_400Regular' }]}>
            {item.date}
          </Text>
          <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
          <Text style={[styles.photoDate, { color: colors.textSecondary, fontFamily: 'Poppins_400Regular' }]}>
            {item.time}
          </Text>
        </View>
        {item.description ? (
          <Text style={[styles.photoDesc, { color: colors.text, fontFamily: 'Poppins_400Regular' }]}>
            {item.description}
          </Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 12, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
          {t('sitePhotos')}
        </Text>
        <Pressable onPress={handleAddPhoto} hitSlop={16}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </Pressable>
      </View>

      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + webBottomInset + 20 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="images-outline" size={56} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: 'Poppins_500Medium' }]}>
              {t('noPhotos')}
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
  list: { padding: 16, gap: 16 },
  photoCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  photo: { width: '100%', height: screenWidth * 0.6, backgroundColor: '#E5E7EB' },
  photoInfo: { padding: 14, gap: 6 },
  photoDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  photoDate: { fontSize: 12 },
  photoDesc: { fontSize: 14, lineHeight: 20 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16 },
});
