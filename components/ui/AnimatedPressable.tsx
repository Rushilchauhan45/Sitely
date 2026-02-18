/**
 * Reusable Animated Pressable
 * ---------------------------
 * Scale-down on press with optional haptic feedback.
 * Replaces inline ({ pressed }) => [{ transform, opacity }] everywhere.
 */

import React, { useCallback, useRef, ReactNode } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

interface AnimatedPressableProps extends Omit<PressableProps, 'style' | 'children'> {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Scale factor on press (0.0–1.0). Default 0.97 */
  scaleValue?: number;
  /** Opacity when pressed. Default 0.9 */
  pressedOpacity?: number;
  /** Haptic feedback style. Null = no haptic. */
  haptic?: Haptics.ImpactFeedbackStyle | null;
}

export function AnimatedPressable({
  children,
  style,
  scaleValue = 0.97,
  pressedOpacity = 0.9,
  haptic = Haptics.ImpactFeedbackStyle.Light,
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: AnimatedPressableProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(
    (e: any) => {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: scaleValue, useNativeDriver: true, speed: 50, bounciness: 4 }),
        Animated.timing(opacityAnim, { toValue: pressedOpacity, duration: 80, useNativeDriver: true }),
      ]).start();
      onPressIn?.(e);
    },
    [scaleValue, pressedOpacity, onPressIn],
  );

  const handlePressOut = useCallback(
    (e: any) => {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
      onPressOut?.(e);
    },
    [onPressOut],
  );

  const handlePress = useCallback(
    (e: any) => {
      if (haptic != null) {
        Haptics.impactAsync(haptic);
      }
      onPress?.(e);
    },
    [haptic, onPress],
  );

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress} {...rest}>
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
