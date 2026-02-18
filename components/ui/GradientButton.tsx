// ============================================================
// 🔵 GRADIENT BUTTON — Premium animated button with sky blue gradient
// ============================================================

import React, { useCallback } from 'react';
import { Pressable, Text, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { Fonts, FontSizes } from '@/theme/typography';
import { SpringConfigs, AnimValues } from '@/theme/animations';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GradientButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  variant = 'primary',
  size = 'md',
  fullWidth = true,
  style,
}: GradientButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(AnimValues.buttonPressScale, SpringConfigs.quick);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SpringConfigs.quick);
  }, []);

  const handlePress = useCallback(() => {
    if (loading || disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [onPress, loading, disabled]);

  const sizeStyles: Record<string, { height: number; fontSize: number; paddingHorizontal: number }> = {
    sm: { height: 40, fontSize: FontSizes.sm, paddingHorizontal: 16 },
    md: { height: 52, fontSize: FontSizes.md, paddingHorizontal: 24 },
    lg: { height: 60, fontSize: FontSizes.lg, paddingHorizontal: 32 },
  };

  const { height, fontSize, paddingHorizontal } = sizeStyles[size];

  const textStyle: TextStyle = {
    fontFamily: Fonts.semiBold,
    fontSize,
    color: variant === 'outline' ? Colors.primary : Colors.white,
    textAlign: 'center',
  };

  const containerStyle: ViewStyle = {
    height,
    borderRadius: height / 2,
    paddingHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: disabled ? 0.5 : 1,
    ...(fullWidth ? { width: '100%' as unknown as number } : {}),
    ...style,
  };

  if (variant === 'outline') {
    return (
      <AnimatedPressable
        style={[animatedStyle, containerStyle, {
          borderWidth: 1.5,
          borderColor: Colors.primary,
          backgroundColor: 'transparent',
        }]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary} size="small" />
        ) : (
          <>
            {icon}
            <Text style={textStyle}>{title}</Text>
          </>
        )}
      </AnimatedPressable>
    );
  }

  if (variant === 'secondary') {
    return (
      <AnimatedPressable
        style={[animatedStyle, containerStyle, {
          backgroundColor: Colors.glass,
          borderWidth: 1,
          borderColor: Colors.glassBorder,
        }]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary} size="small" />
        ) : (
          <>
            {icon}
            <Text style={[textStyle, { color: Colors.text }]}>{title}</Text>
          </>
        )}
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      style={animatedStyle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      <LinearGradient
        colors={[...Colors.gradientButton]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[containerStyle, {
          shadowColor: Colors.skyBlue,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        }]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} size="small" />
        ) : (
          <>
            {icon}
            <Text style={textStyle}>{title}</Text>
          </>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}
