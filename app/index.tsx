import React, { useEffect } from 'react';
import { Image, BackHandler, Dimensions, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useApp } from '@/lib/AppContext';
import Colors from '@/constants/colors';
import { Fonts, FontSizes } from '@/theme/typography';

const ICON_SIZE = 130;

export default function SplashScreen() {
  const { isReady, onboardingDone, user } = useApp();

  const iconScale = useSharedValue(0);
  const iconOpacity = useSharedValue(0);
  const sloganOpacity = useSharedValue(0);
  const sloganTranslateY = useSharedValue(12);

  // Block hardware back
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

  const navigate = async () => {
    if (!user) {
      router.replace('/auth');
    } else if (!onboardingDone) {
      router.replace('/onboarding');
    } else {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const role = await AsyncStorage.getItem('@user_role');
        if (role === 'owner') {
          router.replace('/owner-dashboard' as any);
        } else {
          router.replace('/dashboard');
        }
      } catch {
        router.replace('/dashboard');
      }
    }
  };

  useEffect(() => {
    // Icon springs in
    iconOpacity.value = withTiming(1, { duration: 500 });
    iconScale.value = withSpring(1, { damping: 10, stiffness: 90, mass: 0.8 });

    // Slogan fades in after icon
    sloganOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));
    sloganTranslateY.value = withDelay(800, withSpring(0, { damping: 12, stiffness: 100 }));
  }, []);

  // Navigate after 2.5s once ready
  useEffect(() => {
    if (!isReady) return;
    const timer = setTimeout(() => {
      navigate();
    }, 2500);
    return () => clearTimeout(timer);
  }, [isReady, user, onboardingDone]);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const sloganStyle = useAnimatedStyle(() => ({
    opacity: sloganOpacity.value,
    transform: [{ translateY: sloganTranslateY.value }],
  }));

  return (
    <LinearGradient
      colors={['#0A0A0A', '#0F1A2E', '#0A0A0A']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      {/* App Icon */}
      <Animated.View style={[styles.iconContainer, iconStyle]}>
        <Image
          source={require('@/assets/images/android-icon-foreground.png')}
          style={styles.appIcon}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Slogan */}
      <Animated.Text style={[styles.slogan, sloganStyle]}>
        Build Smart • Track Easy • Grow Fast
      </Animated.Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  appIcon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 24,
  },
  slogan: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 24,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});
