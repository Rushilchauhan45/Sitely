// ============================================================
// 📦 MATERIAL MANAGEMENT SCREEN
// Full CRUD for construction materials with usage tracking
// ============================================================

import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, Alert,
  Platform, Dimensions, ActivityIndicator, Modal,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useApp } from '@/lib/AppContext';
import Colors from '@/constants/colors';
import { Fonts, FontSizes } from '@/theme/typography';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { FloatingInput } from '@/components/ui/FloatingInput';
import type { Material, MaterialUnit, MaterialUsage } from '@/lib/types';
import * as store from '@/lib/storage';
import { addAppNotification } from '@/app/notifications';

const { width } = Dimensions.get('window');

const UNITS: { value: MaterialUnit; label: string }[] = [
  { value: 'kg', label: 'Kg' },
  { value: 'bag', label: 'Bag' },
  { value: 'piece', label: 'Piece' },
  { value: 'ton', label: 'Ton' },
  { value: 'litre', label: 'Litre' },
  { value: 'sqft', label: 'Sq.ft' },
  { value: 'cft', label: 'Cft' },
  { value: 'nos', label: 'Nos' },
  { value: 'other', label: 'Other' },
];

export default function MaterialScreen() {
  const { t } = useApp();
  const params = useLocalSearchParams<{ siteId: string; id: string }>();
  const siteId = params.siteId || params.id || '';
  const insets = useSafeAreaInsets();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // Usage totals for remaining stock calculation
  const [usageTotals, setUsageTotals] = useState<Record<string, number>>({});

  // Form state
  const [materialName, setMaterialName] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [quantity, setQuantity] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<MaterialUnit>('kg');
  const [ratePerUnit, setRatePerUnit] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [billPhotoUri, setBillPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Usage form
  const [usageDesc, setUsageDesc] = useState('');
  const [usageQty, setUsageQty] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadMaterials();
    }, []),
  );

  const loadMaterials = async () => {
    setLoading(true);
    try {
      // Load from local storage (materials stored in expense-like format)
      const data = await store.getMaterials(siteId);
      setMaterials(data);
      // Load usage totals for remaining stock calculation
      const totals: Record<string, number> = {};
      for (const mat of data) {
        const usages = await store.getMaterialUsages(siteId, mat.id);
        totals[mat.id] = usages.reduce((sum, u) => sum + u.quantityUsed, 0);
      }
      setUsageTotals(totals);
    } catch (e) {
      console.warn('Error loading materials:', e);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = (() => {
    const qty = parseFloat(quantity) || 0;
    const rate = parseFloat(ratePerUnit) || 0;
    return qty * rate;
  })();

  const remainingPayment = totalAmount - (parseFloat(amountPaid) || 0);

  const resetForm = () => {
    setMaterialName('');
    setVendorName('');
    setVendorPhone('');
    setQuantity('');
    setSelectedUnit('kg');
    setRatePerUnit('');
    setAmountPaid('');
    setBillPhotoUri(null);
  };

  const handleAddMaterial = async () => {
    if (!materialName.trim() || !quantity.trim() || !ratePerUnit.trim()) {
      Alert.alert(t('required'));
      return;
    }
    setSaving(true);
    try {
      const newMaterial: Material = {
        id: Date.now().toString(),
        siteId,
        name: materialName.trim(),
        vendorName: vendorName.trim(),
        vendorPhone: vendorPhone.trim(),
        quantity: parseFloat(quantity),
        unit: selectedUnit,
        ratePerUnit: parseFloat(ratePerUnit),
        totalAmount,
        amountPaid: parseFloat(amountPaid) || 0,
        billPhotoUrl: billPhotoUri,
        purchasedAt: new Date().toISOString(),
      };
      await store.addMaterial(siteId, newMaterial);
      addAppNotification({
        type: 'general',
        title: 'Material Added',
        body: `${materialName.trim()} — ₹${totalAmount.toLocaleString('en-IN')}`,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetForm();
      setShowAddForm(false);
      loadMaterials();
    } catch (e) {
      console.warn('Error adding material:', e);
      Alert.alert('Error', 'Failed to add material');
    } finally {
      setSaving(false);
    }
  };

  const handleAddUsage = async () => {
    if (!selectedMaterial || !usageDesc.trim() || !usageQty.trim()) {
      Alert.alert(t('required'));
      return;
    }
    try {
      const usage: MaterialUsage = {
        id: Date.now().toString(),
        materialId: selectedMaterial.id,
        siteId,
        description: usageDesc.trim(),
        quantityUsed: parseFloat(usageQty),
        date: new Date().toISOString(),
      };
      await store.addMaterialUsage(siteId, selectedMaterial.id, usage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setUsageDesc('');
      setUsageQty('');
      setShowUsageModal(false);
      loadMaterials();
    } catch (e) {
      console.warn('Error adding usage:', e);
    }
  };

  const getRemainingStock = (material: Material): number => {
    const totalUsed = usageTotals[material.id] || 0;
    return Math.max(0, material.quantity - totalUsed);
  };

  const pickBillPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setBillPhotoUri(result.assets[0].uri);
    }
  };

  const isLowStock = (material: Material): boolean => {
    const remaining = getRemainingStock(material);
    return remaining < material.quantity * 0.2;
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <LinearGradient
        colors={[...Colors.gradientHeader]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 20,
          paddingHorizontal: 20,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: Colors.glass,
              justifyContent: 'center', alignItems: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </Pressable>
          <Text style={{
            fontFamily: Fonts.bold,
            fontSize: FontSizes.xl,
            color: Colors.white,
            flex: 1,
          }}>
            {t('materials')}
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAddForm(!showAddForm);
            }}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: Colors.glass,
              justifyContent: 'center', alignItems: 'center',
            }}
          >
            <Ionicons name={showAddForm ? 'close' : 'add'} size={24} color={Colors.white} />
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Material Form */}
        {showAddForm && (
          <Animated.View entering={FadeInDown.springify()}>
            <GlassCard gradient style={{ marginBottom: 20 }}>
              <Text style={{
                fontFamily: Fonts.semiBold,
                fontSize: FontSizes.lg,
                color: Colors.white,
                marginBottom: 16,
              }}>
                {t('addMaterial')}
              </Text>

              <FloatingInput
                label={t('materialName')}
                value={materialName}
                onChangeText={setMaterialName}
              />
              <FloatingInput
                label={t('vendorName')}
                value={vendorName}
                onChangeText={setVendorName}
              />
              <FloatingInput
                label={t('vendorNumber')}
                value={vendorPhone}
                onChangeText={setVendorPhone}
                keyboardType="phone-pad"
              />

              {/* Unit Selector */}
              <Text style={{
                fontFamily: Fonts.medium,
                fontSize: FontSizes.sm,
                color: Colors.textSecondary,
                marginBottom: 8,
              }}>
                {t('unit')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {UNITS.map((u) => (
                    <Pressable
                      key={u.value}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedUnit(u.value);
                      }}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: selectedUnit === u.value ? Colors.primary : Colors.glass,
                        borderWidth: 1,
                        borderColor: selectedUnit === u.value ? Colors.primary : Colors.glassBorder,
                      }}
                    >
                      <Text style={{
                        fontFamily: Fonts.medium,
                        fontSize: FontSizes.sm,
                        color: selectedUnit === u.value ? Colors.white : Colors.textSecondary,
                      }}>
                        {u.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <FloatingInput
                    label={t('quantity')}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FloatingInput
                    label={t('ratePerUnit')}
                    value={ratePerUnit}
                    onChangeText={setRatePerUnit}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Auto-calculated total */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                backgroundColor: Colors.glassMedium,
                borderRadius: 12,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: Colors.glassBorderLight,
              }}>
                <Text style={{
                  fontFamily: Fonts.medium,
                  fontSize: FontSizes.base,
                  color: Colors.textSecondary,
                }}>
                  {t('totalAmount')}
                </Text>
                <Text style={{
                  fontFamily: Fonts.bold,
                  fontSize: FontSizes.xl,
                  color: Colors.skyBlue,
                }}>
                  ₹ {totalAmount.toLocaleString('en-IN')}
                </Text>
              </View>

              <FloatingInput
                label={t('amountPaid')}
                value={amountPaid}
                onChangeText={setAmountPaid}
                keyboardType="numeric"
              />

              {/* Remaining payment */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                backgroundColor: remainingPayment > 0 ? Colors.errorLight : Colors.successLight,
                borderRadius: 12,
                marginBottom: 20,
              }}>
                <Text style={{
                  fontFamily: Fonts.medium,
                  fontSize: FontSizes.base,
                  color: Colors.textSecondary,
                }}>
                  {t('remainingPayment')}
                </Text>
                <Text style={{
                  fontFamily: Fonts.bold,
                  fontSize: FontSizes.xl,
                  color: remainingPayment > 0 ? Colors.error : Colors.success,
                }}>
                  ₹ {remainingPayment.toLocaleString('en-IN')}
                </Text>
              </View>

              {/* Bill Photo Upload */}
              <Pressable
                onPress={pickBillPhoto}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  padding: 14,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderStyle: 'dashed',
                  borderColor: billPhotoUri ? Colors.success : Colors.glassBorder,
                  backgroundColor: Colors.glassMedium,
                  marginBottom: 16,
                }}
              >
                {billPhotoUri ? (
                  <>
                    <Image source={{ uri: billPhotoUri }} style={{ width: 40, height: 40, borderRadius: 8 }} contentFit="cover" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: Fonts.semiBold, fontSize: FontSizes.sm, color: Colors.success }}>
                        {t('billPhotoAdded') || 'Bill photo added'}
                      </Text>
                      <Text style={{ fontFamily: Fonts.regular, fontSize: FontSizes.xs, color: Colors.textSecondary }}>
                        {t('tapToChange') || 'Tap to change'}
                      </Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
                  </>
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={22} color={Colors.textSecondary} />
                    <Text style={{ fontFamily: Fonts.medium, fontSize: FontSizes.sm, color: Colors.textSecondary }}>
                      {t('addBillPhoto') || 'Add Bill Photo'}
                    </Text>
                  </>
                )}
              </Pressable>

              <GradientButton
                title={t('addMaterial')}
                onPress={handleAddMaterial}
                loading={saving}
                icon={<Ionicons name="cube-outline" size={20} color={Colors.white} />}
              />
            </GlassCard>
          </Animated.View>
        )}

        {/* Materials List */}
        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : materials.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Ionicons name="cube-outline" size={64} color={Colors.textTertiary} />
            <Text style={{
              fontFamily: Fonts.medium,
              fontSize: FontSizes.base,
              color: Colors.textSecondary,
              marginTop: 16,
              textAlign: 'center',
            }}>
              {t('noMaterials')}
            </Text>
          </View>
        ) : (
          materials.map((material, index) => (
            <Animated.View
              key={material.id}
              entering={FadeInDown.delay(index * 50).springify()}
            >
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedMaterial(material);
                  setShowUsageModal(true);
                }}
              >
                <GlassCard style={{ marginBottom: 12 }}>
                  {/* Low stock warning */}
                  {isLowStock(material) && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      backgroundColor: Colors.warningLight,
                      borderRadius: 8,
                      alignSelf: 'flex-start',
                    }}>
                      <Ionicons name="warning" size={14} color={Colors.warning} />
                      <Text style={{
                        fontFamily: Fonts.semiBold,
                        fontSize: FontSizes.xs,
                        color: Colors.warning,
                      }}>
                        {t('lowStockWarning')}
                      </Text>
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontFamily: Fonts.semiBold,
                        fontSize: FontSizes.lg,
                        color: Colors.white,
                        marginBottom: 4,
                      }}>
                        {material.name}
                      </Text>
                      {material.vendorName && (
                        <Text style={{
                          fontFamily: Fonts.regular,
                          fontSize: FontSizes.sm,
                          color: Colors.textSecondary,
                        }}>
                          {material.vendorName}
                          {material.vendorPhone ? ` • ${material.vendorPhone}` : ''}
                        </Text>
                      )}
                    </View>
                    <View style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      backgroundColor: Colors.primaryLight,
                      borderRadius: 8,
                    }}>
                      <Text style={{
                        fontFamily: Fonts.semiBold,
                        fontSize: FontSizes.xs,
                        color: Colors.primary,
                      }}>
                        {getRemainingStock(material)}/{material.quantity} {material.unit}
                      </Text>
                    </View>
                  </View>

                  <View style={{
                    marginTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: Colors.border,
                    paddingTop: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{
                        fontFamily: Fonts.regular,
                        fontSize: FontSizes.xs,
                        color: Colors.textTertiary,
                      }}>
                        {t('totalAmount')}
                      </Text>
                      <Text style={{
                        fontFamily: Fonts.semiBold,
                        fontSize: FontSizes.base,
                        color: Colors.white,
                      }}>
                        ₹{material.totalAmount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{
                        fontFamily: Fonts.regular,
                        fontSize: FontSizes.xs,
                        color: Colors.textTertiary,
                      }}>
                        {t('amountPaid')}
                      </Text>
                      <Text style={{
                        fontFamily: Fonts.semiBold,
                        fontSize: FontSizes.base,
                        color: Colors.success,
                      }}>
                        ₹{material.amountPaid.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{
                        fontFamily: Fonts.regular,
                        fontSize: FontSizes.xs,
                        color: Colors.textTertiary,
                      }}>
                        {t('remaining')}
                      </Text>
                      <Text style={{
                        fontFamily: Fonts.bold,
                        fontSize: FontSizes.base,
                        color: (material.totalAmount - material.amountPaid) > 0 ? Colors.error : Colors.success,
                      }}>
                        ₹{(material.totalAmount - material.amountPaid).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </Pressable>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Usage Modal */}
      <Modal
        visible={showUsageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUsageModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: Colors.overlay,
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: Colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: insets.bottom + 24,
          }}>
            <View style={{
              width: 40, height: 4,
              backgroundColor: Colors.textTertiary,
              borderRadius: 2,
              alignSelf: 'center',
              marginBottom: 20,
            }} />

            <Text style={{
              fontFamily: Fonts.bold,
              fontSize: FontSizes.xl,
              color: Colors.white,
              marginBottom: 4,
            }}>
              {selectedMaterial?.name}
            </Text>
            <Text style={{
              fontFamily: Fonts.regular,
              fontSize: FontSizes.sm,
              color: Colors.textSecondary,
              marginBottom: 20,
            }}>
              {t('addUsage')}
            </Text>

            <FloatingInput
              label={t('usageDescription')}
              value={usageDesc}
              onChangeText={setUsageDesc}
              multiline
            />
            <FloatingInput
              label={`${t('quantityUsed')} (${selectedMaterial?.unit ?? ''})`}
              value={usageQty}
              onChangeText={setUsageQty}
              keyboardType="numeric"
            />

            <GradientButton
              title={t('save')}
              onPress={handleAddUsage}
              icon={<Ionicons name="checkmark" size={20} color={Colors.white} />}
            />

            <Pressable
              onPress={() => setShowUsageModal(false)}
              style={{ marginTop: 12, alignItems: 'center' }}
            >
              <Text style={{
                fontFamily: Fonts.medium,
                fontSize: FontSizes.base,
                color: Colors.textSecondary,
              }}>
                {t('cancel')}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
