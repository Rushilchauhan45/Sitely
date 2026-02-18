// ============================================================
// 🎬 SITELY ANIMATION CONFIGS
// Shared spring & timing configs for Reanimated 3
// ============================================================

import { WithSpringConfig, WithTimingConfig, Easing } from 'react-native-reanimated';

// Spring configs
export const SpringConfigs = {
  /** Default spring — snappy, polished */
  default: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  } satisfies WithSpringConfig,

  /** Gentle spring — for sheet opening, large moves */
  gentle: {
    damping: 20,
    stiffness: 100,
    mass: 1,
  } satisfies WithSpringConfig,

  /** Bouncy spring — for success, celebration effects */
  bouncy: {
    damping: 8,
    stiffness: 200,
    mass: 0.8,
  } satisfies WithSpringConfig,

  /** Quick spring — for button press scale animations */
  quick: {
    damping: 22,
    stiffness: 280,
    mass: 0.7,
  } satisfies WithSpringConfig,

  /** Soft spring — for subtle UI shifts */
  soft: {
    damping: 30,
    stiffness: 80,
    mass: 1.2,
  } satisfies WithSpringConfig,
};

// Timing configs
export const TimingConfigs = {
  fast: {
    duration: 200,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  } satisfies WithTimingConfig,

  medium: {
    duration: 350,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  } satisfies WithTimingConfig,

  slow: {
    duration: 500,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  } satisfies WithTimingConfig,

  glow: {
    duration: 1500,
    easing: Easing.bezier(0.37, 0, 0.63, 1),
  } satisfies WithTimingConfig,
};

// Stagger delays for list animations
export const StaggerDelay = {
  fast: 30,
  default: 50,
  slow: 80,
} as const;

// Common animation values
export const AnimValues = {
  buttonPressScale: 0.96,
  cardPressScale: 0.98,
  iconPressScale: 0.9,
  entryTranslateY: 30,
  entryTranslateX: 20,
} as const;
