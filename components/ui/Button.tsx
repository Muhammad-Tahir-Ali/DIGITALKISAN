import React, { useRef } from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { Colors, Semantic } from '@/constants/colors';
import { FontSize, FontWeight, ComponentSize, Shadow } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size preset */
  size?: ButtonSize;
  /** Label text */
  label: string;
  /** Show spinner and disable interaction */
  loading?: boolean;
  /** Icon element shown before the label */
  leftIcon?: React.ReactNode;
  /** Icon element shown after the label */
  rightIcon?: React.ReactNode;
  /** Stretch to fill parent width */
  fullWidth?: boolean;
  /** Override container style */
  style?: ViewStyle;
  /** Override label style */
  labelStyle?: TextStyle;
}

// ---------------------------------------------------------------------------
// Variant token maps
// ---------------------------------------------------------------------------
type VariantTokens = {
  bg: string;
  bgPressed: string;
  bgDisabled: string;
  text: string;
  textDisabled: string;
  border?: string;
  shadow?: object;
};

const VARIANT_MAP: Record<ButtonVariant, VariantTokens> = {
  primary: {
    bg: Colors.primary,
    bgPressed: Colors.green[800],
    bgDisabled: Colors.green[200],
    text: '#FFFFFF',
    textDisabled: Colors.green[400],
    shadow: Shadow.brand,
  },
  secondary: {
    bg: Colors.secondary,
    bgPressed: Colors.amber[600],
    bgDisabled: Colors.amber[200],
    text: Colors.gray[900],
    textDisabled: Colors.amber[400],
    shadow: Shadow.sm,
  },
  outline: {
    bg: 'transparent',
    bgPressed: Colors.green[50],
    bgDisabled: 'transparent',
    text: Colors.primary,
    textDisabled: Colors.green[300],
    border: Colors.primary,
  },
  ghost: {
    bg: 'transparent',
    bgPressed: Colors.gray[100],
    bgDisabled: 'transparent',
    text: Colors.primary,
    textDisabled: Colors.gray[400],
  },
  danger: {
    bg: Colors.error,
    bgPressed: Semantic.error.dark,
    bgDisabled: Colors.errorLight,
    text: '#FFFFFF',
    textDisabled: '#FCA5A5',
    shadow: Shadow.sm,
  },
};



// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function Button({
  variant = 'primary',
  size = 'md',
  label,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  labelStyle,
  ...rest
}: ButtonProps) {
  const tokens = VARIANT_MAP[variant];
  const sizeTokens = ComponentSize[size];
  const isDisabled = disabled || loading;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Separate layout styles for the wrapper vs the button itself
  const { flex, margin, marginTop, marginBottom, marginLeft, marginRight, marginHorizontal, marginVertical, ...buttonStyle } = StyleSheet.flatten(style || {});

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  };

  return (
    <Animated.View style={{ 
      transform: [{ scale: scaleAnim }], 
      alignSelf: fullWidth ? 'stretch' : 'flex-start',
      flex: (flex as any),
      margin, marginTop, marginBottom, marginLeft, marginRight, marginHorizontal, marginVertical
    }}>
      <TouchableOpacity
        activeOpacity={0.88}
        disabled={isDisabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.base,
          {
            height: sizeTokens.height,
            paddingHorizontal: sizeTokens.paddingHorizontal,
            borderRadius: sizeTokens.borderRadius,
            backgroundColor: isDisabled ? tokens.bgDisabled : tokens.bg,
            borderWidth: tokens.border ? 1.5 : 0,
            borderColor: isDisabled
              ? (tokens.border ? tokens.textDisabled : 'transparent')
              : (tokens.border ?? 'transparent'),
            ...(tokens.shadow && !isDisabled ? tokens.shadow : {}),
          },
          fullWidth && styles.fullWidth,
          buttonStyle,
        ]}

        {...rest}
      >
      {/* Left icon */}
      {leftIcon && !loading && (
        <View style={styles.iconLeft}>{leftIcon}</View>
      )}

      {/* Loading spinner */}
      {loading && (
        <ActivityIndicator
          size="small"
          color={isDisabled ? tokens.textDisabled : tokens.text}
          style={styles.spinner}
        />
      )}

      {/* Label */}
      <Text
        style={[
          styles.label,
          {
            fontSize: sizeTokens.fontSize,
            color: isDisabled ? tokens.textDisabled : tokens.text,
          },
          labelStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>

      {/* Right icon */}
      {rightIcon && !loading && (
        <View style={styles.iconRight}>{rightIcon}</View>
      )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  spinner: {
    marginRight: 8,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
