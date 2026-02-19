import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TouchableOpacity, useColorScheme,
  Dimensions, Modal, TextInput, Animated, Alert, ActivityIndicator, KeyboardAvoidingView,
  ScrollView, Keyboard, TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

import { useApp } from '@/lib/AppContext';
import { useThemeColors } from '@/constants/colors';
import { shadow } from '@/constants/shadows';
import { SitePhoto, PhotoGroup } from '@/lib/types';
import { EmptyState } from '@/components/ui';
import { Alert as RNAlert } from 'react-native';
import * as store from '@/lib/storage';
import * as Haptics from 'expo-haptics';

const screenWidth = Dimensions.get('window').width;
const PHOTO_SIZE = (screenWidth - 48 - 8) / 2;

export default function PhotosScreen() {
  const params = useLocalSearchParams<{ siteId: string; id: string }>();
  const siteId = Array.isArray(params.siteId) ? params.siteId[0] : (params.siteId || params.id);
  const { t } = useApp();
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const [photos, setPhotos] = useState<SitePhoto[]>([]);
  const [groups, setGroups] = useState<PhotoGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showViewer, setShowViewer] = useState(false);
  const [viewerPhoto, setViewerPhoto] = useState<SitePhoto | null>(null);
  const [showDescModal, setShowDescModal] = useState(false);
  const [pendingAssets, setPendingAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [photoDescription, setPhotoDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const refreshData = useCallback(async () => {
    if (!siteId) {
      console.warn('[Photos] refreshData: siteId is falsy:', siteId);
      return;
    }
    try {
      console.log('[Photos] refreshData: fetching photos for siteId:', siteId);
      const p = await store.getPhotos(siteId as string);
      console.log('[Photos] refreshData: got', p.length, 'photos');
      setPhotos(p);
      const g = await store.getPhotoGroups(siteId as string);
      setGroups(g);
    } catch (e: any) {
      console.warn('Refresh photos error:', e);
    }
  }, [siteId]);

  useFocusEffect(useCallback(() => { refreshData(); }, [refreshData]));

  const filteredPhotos = selectedGroup
    ? photos.filter((p: any) => p.groupId === selectedGroup)
    : photos;

  const handleAddPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to add photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: true,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setPendingAssets(result.assets);
      setPhotoDescription('');
      setShowDescModal(true);
    } catch (e: any) {
      console.warn('Add photo error:', e);
      Alert.alert('Error', e?.message || 'Failed to open photo picker');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Required', 'Please allow camera access to take photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setPendingAssets(result.assets);
      setPhotoDescription('');
      setShowDescModal(true);
    } catch (e: any) {
      console.warn('Camera error:', e);
      Alert.alert('Error', e?.message || 'Failed to open camera');
    }
  };

  const confirmSavePhotos = async () => {
    if (saving) return;
    Keyboard.dismiss();
    setSaving(true);
    try {
      const resolvedSiteId = Array.isArray(siteId) ? siteId[0] : siteId;
      console.log('[Photos] confirmSavePhotos called, siteId:', resolvedSiteId, 'pendingAssets:', pendingAssets.length);
      if (!resolvedSiteId) {
        Alert.alert('Error', 'Site ID not found. Please go back and try again.');
        setSaving(false);
        return;
      }
      if (!pendingAssets || pendingAssets.length === 0) {
        Alert.alert('Error', 'No photos selected.');
        setSaving(false);
        return;
      }


      let photosDir = null;
      if (Platform.OS !== 'web') {
        photosDir = `${FileSystem.documentDirectory}site_photos/`;
        const dirInfo = await FileSystem.getInfoAsync(photosDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
        }
      }

      const now = new Date();
      let savedCount = 0;
      let failedCount = 0;
      for (const asset of pendingAssets) {
        try {
          let finalUri = asset.uri;
          if (Platform.OS !== 'web') {
            // Copy photo from temp cache to permanent storage using legacy API
            const fileName = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.jpg`;
            finalUri = `${photosDir}${fileName}`;
            console.log('[Photos] Copying photo from', asset.uri.substring(0, 60), 'to', finalUri);
            await FileSystem.copyAsync({ from: asset.uri, to: finalUri });
          } else {
            console.log('[Photos] On web, using asset.uri directly:', asset.uri);
          }

          await store.addPhoto({
            siteId: resolvedSiteId,
            uri: finalUri,
            description: photoDescription.trim() || '',
            date: now.toISOString().split('T')[0],
            time: now.toTimeString().split(' ')[0],
            groupId: selectedGroup || null,
          });
          savedCount++;
          console.log('[Photos] Photo saved successfully, count:', savedCount);
        } catch (photoErr: any) {
          failedCount++;
          console.error('[Photos] Failed to save individual photo:', photoErr?.message, photoErr);
          RNAlert.alert('Photo Save Error', photoErr?.message || 'Unknown error');
        }
      }
      if (savedCount > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      if (failedCount > 0) {
        Alert.alert('Partial Save', `${savedCount} photo(s) saved, ${failedCount} failed.`);
      }
      setPendingAssets([]);
      setPhotoDescription('');
      setShowDescModal(false);
      await refreshData();

      // DEBUG: Query all photos in DB and log them
      try {
        const allPhotos = await store.getPhotos(resolvedSiteId);
        console.log('[Photos] ALL PHOTOS IN DB:', allPhotos);
      } catch (err) {
        console.error('[Photos] Could not query all photos:', err);
      }
    } catch (e: any) {
      console.error('[Photos] Save photo error:', e?.message, e);
      Alert.alert('Error', e?.message || 'Failed to save photos');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await store.addPhotoGroup({
        siteId: siteId || '',
        name: newGroupName.trim(),
        createdAt: new Date().toISOString(),
      });
      setNewGroupName('');
      setShowGroupModal(false);
      await refreshData();
    } catch (e: any) {
      console.warn('Create group error:', e);
      Alert.alert('Error', e?.message || 'Failed to create group');
    }
  };

  const openViewer = (photo: SitePhoto) => {
    setViewerPhoto(photo);
    setShowViewer(true);
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  };

  const closeViewer = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setShowViewer(false);
      setViewerPhoto(null);
    });
  };

  const getDayName = (dateStr: string): string => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'long' });
    } catch { return ''; }
  };

  const renderPhoto = ({ item }: { item: SitePhoto }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.photoCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
      onPress={() => openViewer(item)}
    >
      <Image source={{ uri: item.uri }} style={styles.photoThumb} contentFit="cover" />
      <View style={styles.photoOverlay}>
        <Text style={[styles.photoDate, { fontFamily: 'Poppins_400Regular' }]}>{getDayName(item.date)}</Text>
        <Text style={[styles.photoDate, { fontFamily: 'Poppins_400Regular' }]}>{item.date}</Text>
        {item.description ? (
          <Text numberOfLines={1} style={[styles.photoDesc, { fontFamily: 'Poppins_400Regular' }]}>{item.description}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const allGroups = [{ id: null as string | null, name: 'All' }, ...groups.map((g) => ({ id: g.id, name: g.name }))];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#EC4899', '#F472B6', '#1A1A2E']}
        style={[styles.header, { paddingTop: insets.top + webTopInset + 12 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity activeOpacity={0.6} onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: 'Poppins_600SemiBold' }]}>
          {t('sitePhotos')}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity activeOpacity={0.6} onPress={handleTakePhoto} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={styles.headerBtn}>
            <Ionicons name="camera" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.6} onPress={handleAddPhoto} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={styles.headerBtn}>
            <Ionicons name="images" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Group Chips */}
      <View style={styles.groupSection}>
        <FlatList
          horizontal
          data={allGroups}
          renderItem={({ item }) => {
            const isActive = selectedGroup === item.id;
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.groupChip, { backgroundColor: isActive ? '#0EA5E9' : colors.inputBg, borderColor: isActive ? '#0EA5E9' : colors.border }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedGroup(item.id); }}
              >
                <Text style={[styles.groupChipText, { color: isActive ? '#FFF' : colors.textSecondary, fontFamily: isActive ? 'Poppins_600SemiBold' : 'Poppins_400Regular' }]}>
                  {item.name}
                </Text>
                {item.id && (
                  <Text style={[styles.groupChipCount, { color: isActive ? 'rgba(255,255,255,0.7)' : colors.textTertiary }]}>
                    {photos.filter((p: any) => p.groupId === item.id).length}
                  </Text>
                )}
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => item.id || 'all'}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.groupList}
          ListFooterComponent={
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.groupChip, styles.addGroupChip, { borderColor: colors.border }]}
              onPress={() => setShowGroupModal(true)}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={[styles.groupChipText, { color: colors.primary, fontFamily: 'Poppins_500Medium' }]}>
                New Group
              </Text>
            </TouchableOpacity>
          }
        />
      </View>

      {/* Photo Grid */}
      <FlatList
        data={filteredPhotos}
        extraData={photos.length}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + webBottomInset + 20 }]}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.gridHeader}>
            <Text style={[styles.photoCount, { color: colors.textSecondary, fontFamily: 'Poppins_500Medium' }]}>
              {filteredPhotos.length} photos
            </Text>
          </View>
        }
        ListEmptyComponent={<EmptyState icon="images-outline" title={t('noPhotos')} />}
      />

      {/* Full-screen Photo Viewer */}
      <Modal visible={showViewer} transparent animationType="none" onRequestClose={closeViewer}>
        <Animated.View style={[styles.viewer, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeViewer} />
          {viewerPhoto && (
            <Image source={{ uri: viewerPhoto.uri }} style={styles.viewerImage} contentFit="contain" />
          )}
          <TouchableOpacity activeOpacity={0.6} style={[styles.viewerClose, { top: insets.top + 16 }]} onPress={closeViewer}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          {viewerPhoto && (
            <View style={[styles.viewerInfo, { bottom: insets.bottom + 20 }]}>
              <Text style={[styles.viewerDay, { fontFamily: 'Poppins_600SemiBold' }]}>
                {getDayName(viewerPhoto.date)}
              </Text>
              <Text style={[styles.viewerDate, { fontFamily: 'Poppins_500Medium' }]}>
                {viewerPhoto.date} • {viewerPhoto.time}
              </Text>
              {viewerPhoto.description ? (
                <Text style={[styles.viewerDesc, { fontFamily: 'Poppins_400Regular' }]}>
                  {viewerPhoto.description}
                </Text>
              ) : null}
            </View>
          )}
        </Animated.View>
      </Modal>

      {/* Photo Description Modal */}
      <Modal visible={showDescModal} transparent animationType="fade" onRequestClose={() => { if (!saving) { setShowDescModal(false); setPendingAssets([]); } }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView
              contentContainerStyle={styles.modalOverlay}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
                <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
                  {t('addDescription') || 'Add Description'}
                </Text>
                {pendingAssets.length > 0 && (
                  <Image source={{ uri: pendingAssets[0].uri }} style={{ width: '100%', height: 160, borderRadius: 12, marginBottom: 12, backgroundColor: '#E5E7EB' }} contentFit="cover" />
                )}
                {pendingAssets.length > 1 && (
                  <Text style={[{ color: colors.textSecondary, fontFamily: 'Poppins_400Regular', fontSize: 12, marginBottom: 8, textAlign: 'center' }]}>
                    +{pendingAssets.length - 1} more photos
                  </Text>
                )}
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text, fontFamily: 'Poppins_400Regular' }]}
                  value={photoDescription}
                  onChangeText={setPhotoDescription}
                  placeholder={t('descriptionPlaceholder') || 'E.g., Foundation work completed'}
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={3}
                  blurOnSubmit
                  returnKeyType="done"
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.modalBtn, { backgroundColor: colors.inputBg }]}
                    onPress={() => { Keyboard.dismiss(); setShowDescModal(false); setPendingAssets([]); }}
                    disabled={saving}
                  >
                    <Text style={[styles.modalBtnText, { color: colors.textSecondary, fontFamily: 'Poppins_500Medium' }]}>
                      {t('cancel')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.modalBtn, { backgroundColor: '#EC4899', opacity: saving ? 0.6 : 1 }]}
                    onPress={confirmSavePhotos}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={[styles.modalBtnText, { color: '#FFF', fontFamily: 'Poppins_600SemiBold' }]}>
                        {t('save') || 'Save'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Create Group Modal */}
      <Modal visible={showGroupModal} transparent animationType="fade" onRequestClose={() => setShowGroupModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView
              contentContainerStyle={styles.modalOverlay}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
                <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
                  Create Photo Group
                </Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text, fontFamily: 'Poppins_400Regular' }]}
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                  placeholder="Group name (e.g., Foundation, Roofing)"
                  placeholderTextColor={colors.textTertiary}
                  blurOnSubmit
                  returnKeyType="done"
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.modalBtn, { backgroundColor: colors.inputBg }]}
                    onPress={() => { Keyboard.dismiss(); setShowGroupModal(false); setNewGroupName(''); }}
                  >
                    <Text style={[styles.modalBtnText, { color: colors.textSecondary, fontFamily: 'Poppins_500Medium' }]}>
                      {t('cancel')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.modalBtn, { backgroundColor: '#0EA5E9' }]}
                    onPress={() => { Keyboard.dismiss(); handleCreateGroup(); }}
                  >
                    <Text style={[styles.modalBtnText, { color: '#FFF', fontFamily: 'Poppins_600SemiBold' }]}>
                      Create
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 18, borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    zIndex: 10,
  },
  headerBackBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, flex: 1, textAlign: 'center', color: '#FFF' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  groupSection: { paddingTop: 12 },
  groupList: { paddingHorizontal: 16, gap: 8 },
  groupChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, gap: 4,
  },
  addGroupChip: { borderStyle: 'dashed' as const },
  groupChipText: { fontSize: 13 },
  groupChipCount: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  gridHeader: { paddingHorizontal: 4, paddingBottom: 8 },
  photoCount: { fontSize: 13 },
  grid: { padding: 16 },
  gridRow: { gap: 8, marginBottom: 8 },
  photoCard: {
    width: PHOTO_SIZE, borderRadius: 16, overflow: 'hidden', borderWidth: 1,
    ...shadow({ offsetY: 2, opacity: 0.06, radius: 8, elevation: 2 }),
  },
  photoThumb: { width: '100%', height: PHOTO_SIZE, backgroundColor: '#E5E7EB' },
  photoOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  photoDate: { fontSize: 11, color: '#FFF' },
  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  viewerImage: { width: screenWidth, height: screenWidth * 1.2 },
  viewerClose: { position: 'absolute', right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  viewerInfo: { position: 'absolute', left: 20, right: 20 },
  viewerDay: { fontSize: 16, color: '#FFF', marginBottom: 2 },
  viewerDate: { fontSize: 14, color: '#FFF' },
  viewerDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 6 },
  photoDesc: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 400, borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, marginBottom: 16, textAlign: 'center' },
  modalInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  modalBtnText: { fontSize: 15 },
});
