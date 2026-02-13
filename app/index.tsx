import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '@/lib/AppContext';
import { useThemeColors } from '@/constants/colors';

export default function IndexScreen() {
  const { isReady, onboardingDone } = useApp();
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);

  useEffect(() => {
    if (!isReady) return;
    if (onboardingDone) {
      router.replace('/dashboard');
    } else {
      router.replace('/onboarding');
    }
  }, [isReady, onboardingDone]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
