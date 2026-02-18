// ============================================================
// ❓ HELP FAB — Floating action button with developer info bottom sheet
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View, Text, Pressable, Modal, Linking, ScrollView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { Fonts, FontSizes } from '@/theme/typography';
import { GlassCard } from './GlassCard';
import { GradientButton } from './GradientButton';
import { LinearGradient } from 'expo-linear-gradient';

const DEVELOPER = {
  name: 'Rushil Chauhan',
  phone: '9054364058',
  email: 'chauhanrushil45@gmail.com',
  github: 'https://github.com/rushilchauhan',
  facebook: 'https://facebook.com/',
  instagram: 'https://instagram.com/',
  linkedin: 'https://linkedin.com/in/',
};

const VIDEO_TUTORIAL = ''; // ADD YOUR YOUTUBE LINK HERE

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function HelpFAB() {
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const openSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setVisible(true);
  }, []);

  const closeSheet = useCallback(() => {
    setVisible(false);
  }, []);

  const openLink = useCallback((url: string) => {
    if (url) Linking.openURL(url).catch(() => {});
  }, []);

  const callPhone = useCallback(() => {
    Linking.openURL(`tel:${DEVELOPER.phone}`).catch(() => {});
  }, []);

  const sendEmail = useCallback(() => {
    Linking.openURL(`mailto:${DEVELOPER.email}`).catch(() => {});
  }, []);

  const socialLinks = [
    { icon: 'logo-github', url: DEVELOPER.github, label: 'GitHub' },
    { icon: 'logo-facebook', url: DEVELOPER.facebook, label: 'Facebook' },
    { icon: 'logo-instagram', url: DEVELOPER.instagram, label: 'Instagram' },
    { icon: 'logo-linkedin', url: DEVELOPER.linkedin, label: 'LinkedIn' },
  ];

  return (
    <>
      {/* FAB Button */}
      <AnimatedPressable
        style={[
          animatedStyle,
          {
            position: 'absolute',
            bottom: insets.bottom + 20,
            right: 20,
            zIndex: 100,
          },
        ]}
        onPressIn={() => {
          scale.value = withSpring(0.9, { damping: 15, stiffness: 200 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 200 });
        }}
        onPress={openSheet}
      >
        <LinearGradient
          colors={[...Colors.gradientButton]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: Colors.skyBlue,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Ionicons name="help-circle" size={28} color={Colors.white} />
        </LinearGradient>
      </AnimatedPressable>

      {/* Help Bottom Sheet Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={closeSheet}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: Colors.overlay,
            justifyContent: 'flex-end',
          }}
          onPress={closeSheet}
        >
          <Animated.View
            entering={SlideInDown.springify().damping(18)}
          >
            <Pressable onPress={() => {}}>
              <View
                style={{
                  backgroundColor: Colors.surface,
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  paddingBottom: insets.bottom + 20,
                  maxHeight: '80%',
                }}
              >
                {/* Handle */}
                <View style={{
                  width: 40, height: 4,
                  backgroundColor: Colors.textTertiary,
                  borderRadius: 2,
                  alignSelf: 'center',
                  marginTop: 12,
                  marginBottom: 16,
                }} />

                <ScrollView
                  contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
                  showsVerticalScrollIndicator={false}
                >
                  {/* App Info */}
                  <View style={{ alignItems: 'center', marginBottom: 24 }}>
                    <View style={{
                      width: 70, height: 70, borderRadius: 20,
                      backgroundColor: Colors.blackCard,
                      borderWidth: 2,
                      borderColor: Colors.skyBlue,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}>
                      <Text style={{
                        fontFamily: Fonts.bold,
                        fontSize: 28,
                        color: Colors.skyBlue,
                      }}>S</Text>
                    </View>
                    <Text style={{
                      fontFamily: Fonts.bold,
                      fontSize: FontSizes['2xl'],
                      color: Colors.white,
                      letterSpacing: 2,
                    }}>
                      SITELY
                    </Text>
                    <Text style={{
                      fontFamily: Fonts.regular,
                      fontSize: FontSizes.sm,
                      color: Colors.textSecondary,
                      marginTop: 4,
                    }}>
                      Construction Site Management
                    </Text>
                  </View>

                  {/* Video Tutorial */}
                  {VIDEO_TUTORIAL ? (
                    <GradientButton
                      title="Watch Video Tutorial"
                      onPress={() => openLink(VIDEO_TUTORIAL)}
                      icon={<Ionicons name="play-circle" size={20} color={Colors.white} />}
                      style={{ marginBottom: 20 }}
                    />
                  ) : null}

                  {/* Developer Info */}
                  <GlassCard style={{ marginBottom: 16 }}>
                    <Text style={{
                      fontFamily: Fonts.semiBold,
                      fontSize: FontSizes.base,
                      color: Colors.textSecondary,
                      marginBottom: 12,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}>
                      Developer
                    </Text>

                    <Text style={{
                      fontFamily: Fonts.bold,
                      fontSize: FontSizes.xl,
                      color: Colors.white,
                      marginBottom: 16,
                    }}>
                      {DEVELOPER.name}
                    </Text>

                    {/* Contact Actions */}
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                      <Pressable
                        onPress={callPhone}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          paddingVertical: 12,
                          borderRadius: 12,
                          backgroundColor: Colors.successLight,
                        }}
                      >
                        <Ionicons name="call" size={18} color={Colors.success} />
                        <Text style={{
                          fontFamily: Fonts.medium,
                          fontSize: FontSizes.sm,
                          color: Colors.success,
                        }}>
                          {DEVELOPER.phone}
                        </Text>
                      </Pressable>
                    </View>

                    <Pressable
                      onPress={sendEmail}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        backgroundColor: Colors.primaryLight,
                        marginBottom: 16,
                      }}
                    >
                      <Ionicons name="mail" size={18} color={Colors.primary} />
                      <Text style={{
                        fontFamily: Fonts.medium,
                        fontSize: FontSizes.sm,
                        color: Colors.primary,
                      }}>
                        {DEVELOPER.email}
                      </Text>
                    </Pressable>

                    {/* Social Links */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
                      {socialLinks.map(({ icon, url, label }) => (
                        <Pressable
                          key={label}
                          onPress={() => openLink(url)}
                          style={{
                            width: 48, height: 48, borderRadius: 24,
                            backgroundColor: Colors.glass,
                            borderWidth: 1,
                            borderColor: Colors.glassBorder,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Ionicons name={icon as any} size={22} color={Colors.textSecondary} />
                        </Pressable>
                      ))}
                    </View>
                  </GlassCard>

                  {/* Copyright */}
                  <Text style={{
                    fontFamily: Fonts.regular,
                    fontSize: FontSizes.xs,
                    color: Colors.textTertiary,
                    textAlign: 'center',
                    marginTop: 8,
                  }}>
                    © 2026 Sitely. All rights reserved.
                  </Text>
                  <Text style={{
                    fontFamily: Fonts.regular,
                    fontSize: FontSizes.xs,
                    color: Colors.textTertiary,
                    textAlign: 'center',
                    marginTop: 2,
                  }}>
                    Developed by Rushil Chauhan
                  </Text>
                </ScrollView>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}
