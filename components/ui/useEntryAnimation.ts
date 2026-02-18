/**
 * Staggered entry animation hook
 * --------------------------------
 * Returns fade + translateY animated values that trigger when the component mounts.
 * Usage:
 *   const { fadeStyle } = useEntryAnimation();
 *   <Animated.View style={fadeStyle}>...</Animated.View>
 */

import { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface EntryAnimationOptions {
  /** Delay before animation starts (ms). Default 0. */
  delay?: number;
  /** Duration of fade-in (ms). Default 400. */
  duration?: number;
  /** Starting Y offset. Default 24. */
  translateY?: number;
}

export function useEntryAnimation(options: EntryAnimationOptions = {}) {
  const { delay = 0, duration = 400, translateY = 24 } = options;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(translateY)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration, delay, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 9, delay, useNativeDriver: true }),
    ]);
    animation.start();
  }, []);

  const fadeStyle: Animated.WithAnimatedObject<ViewStyle> = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  };

  return { fadeAnim, slideAnim, fadeStyle };
}
