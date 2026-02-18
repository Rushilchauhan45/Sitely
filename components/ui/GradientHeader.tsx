/**
 * Reusable Gradient Header
 * -------------------------
 * Premium gradient header bar with back button, centred title,
 * and optional right action. Used across all inner screens.
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useThemeColors, ThemeColors } from '@/constants/colors';
import { useColorScheme } from 'react-native';

interface GradientHeaderProps {
  title: string;
  /** Gradient colour pair. Falls back to theme primary gradient. */
  gradient?: [string, string];
  /** Override back button behaviour. Default: router.back() */
  onBack?: () => void;
  /** Optional right-side element */
  rightElement?: ReactNode;
  /** Extra bottom content inside the gradient (e.g. summary card) */
  children?: ReactNode;
  /** Extra styles for the outer container */
  style?: ViewStyle;
}

export function GradientHeader({
  title,
  gradient,
  onBack,
  rightElement,
  children,
  style,
}: GradientHeaderProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const defaultGradient: [string, string] =
    colorScheme === 'dark'
      ? [colors.primaryGradientStart, colors.primaryGradientEnd]
      : [colors.primaryGradientStart, colors.primaryGradientEnd];

  return (
    <LinearGradient
      colors={gradient || defaultGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top + webTopInset + 12 }, style]}
    >
      <View style={styles.row}>
        <Pressable onPress={onBack ?? (() => router.back())} hitSlop={16} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </Pressable>
        <Text style={[styles.title, { fontFamily: 'Poppins_600SemiBold' }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.rightSlot}>
          {rightElement ?? <View style={{ width: 36 }} />}
        </View>
      </View>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    color: '#FFF',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  rightSlot: {
    width: 36,
    alignItems: 'flex-end',
  },
});
