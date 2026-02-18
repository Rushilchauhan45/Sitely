// ============================================================
// 🃏 GLASS CARD — Premium glassmorphism card component
// ============================================================

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: boolean;
  noPadding?: boolean;
}

export function GlassCard({ children, style, gradient = false, noPadding = false }: GlassCardProps) {
  const baseStyle: ViewStyle = {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
    ...(noPadding ? {} : { padding: 20 }),
    ...style,
  };

  if (gradient) {
    return (
      <LinearGradient
        colors={[Colors.glassLight, Colors.glassMedium, 'rgba(0,0,0,0.3)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={baseStyle}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View
      style={{
        ...baseStyle,
        backgroundColor: Colors.glass,
      }}
    >
      {children}
    </View>
  );
}
