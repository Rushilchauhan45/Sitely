/**
 * Animated Empty State
 * ---------------------
 * Fade-in empty placeholder with icon, title, and optional subtitle.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/colors';
import { useColorScheme } from 'react-native';

interface EmptyStateProps {
  icon: string;
  iconSet?: 'ionicons' | 'material';
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, iconSet = 'ionicons', title, subtitle }: EmptyStateProps) {
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const IconComponent = iconSet === 'material' ? MaterialCommunityIcons : Ionicons;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
        <IconComponent name={icon as any} size={40} color={colors.textTertiary} />
      </View>
      <Text style={[styles.title, { color: colors.textSecondary, fontFamily: 'Poppins_600SemiBold' }]}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textTertiary, fontFamily: 'Poppins_400Regular' }]}>
          {subtitle}
        </Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: 12,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
