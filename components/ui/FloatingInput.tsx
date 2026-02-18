// ============================================================
// 📝 FLOATING INPUT — Premium floating label text input
// ============================================================

import React, { useState, useCallback } from 'react';
import { TextInput, View, Text, TextInputProps, ViewStyle, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { Fonts, FontSizes } from '@/theme/typography';
import { SpringConfigs } from '@/theme/animations';

interface FloatingInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function FloatingInput({
  label,
  value,
  onChangeText,
  error,
  icon,
  rightIcon,
  containerStyle,
  ...props
}: FloatingInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const animation = useSharedValue(value ? 1 : 0);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    animation.value = withSpring(1, SpringConfigs.quick);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (!value) {
      animation.value = withSpring(0, SpringConfigs.quick);
    }
  }, [value]);

  const labelStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: icon ? 44 : 16,
    top: interpolate(animation.value, [0, 1], [16, 4]),
    fontSize: interpolate(animation.value, [0, 1], [FontSizes.base, FontSizes.xs]),
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? Colors.error
      : isFocused
      ? Colors.primary
      : Colors.glassBorder,
  }));

  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: Colors.inputBg,
            borderRadius: 14,
            borderWidth: 1.5,
            minHeight: 56,
            paddingHorizontal: 16,
          },
          borderStyle,
        ]}
      >
        {icon && (
          <View style={{ marginRight: 12 }}>{icon}</View>
        )}
        <View style={{ flex: 1, paddingTop: 10 }}>
          <Animated.Text
            style={[
              labelStyle,
              {
                fontFamily: Fonts.regular,
                color: error
                  ? Colors.error
                  : isFocused
                  ? Colors.primary
                  : Colors.textTertiary,
                zIndex: 1,
              },
            ]}
          >
            {label}
          </Animated.Text>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={{
              fontFamily: Fonts.medium,
              fontSize: FontSizes.base,
              color: Colors.text,
              paddingVertical: 8,
              paddingTop: 14,
            }}
            placeholderTextColor={Colors.textTertiary}
            cursorColor={Colors.primary}
            {...props}
          />
        </View>
        {rightIcon && (
          <View style={{ marginLeft: 8 }}>{rightIcon}</View>
        )}
      </Animated.View>
      {error && (
        <Text
          style={{
            fontFamily: Fonts.regular,
            fontSize: FontSizes.xs,
            color: Colors.error,
            marginTop: 4,
            marginLeft: 16,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
