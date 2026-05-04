import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /** Floating label above the input */
  label?: string;
  /** Feather icon name shown on the left */
  icon?: keyof typeof Feather.glyphMap;
  /** Error message below the input */
  error?: string;
  /** Right side accessory (e.g. eye toggle) */
  rightAccessory?: React.ReactNode;
  /** Override outer container style */
  containerStyle?: ViewStyle;
  /** Helper text below the input (only shown when no error) */
  helperText?: string;
}

export function Input({
  label,
  icon,
  error,
  rightAccessory,
  containerStyle,
  helperText,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = (e: any) => {
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: false,
    }).start();
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
    onBlur?.(e);
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? Colors.error : Colors.border, error ? Colors.error : Colors.primary],
  });

  const shadowOpacity = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.12],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <Animated.View
        style={[
          styles.inputWrap,
          {
            borderColor,
            shadowColor: Colors.primary,
            shadowOpacity,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 6,
            elevation: 0,
          },
        ]}
      >
        {icon && (
          <Feather
            name={icon}
            size={18}
            color={error ? Colors.error : Colors.textTertiary}
            style={styles.icon}
          />
        )}
        <TextInput
          style={[styles.input, !icon && styles.inputNoIcon]}
          placeholderTextColor={Colors.textTertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
        {rightAccessory && (
          <View style={styles.rightAccessory}>{rightAccessory}</View>
        )}
      </Animated.View>
      {error ? (
        <View style={styles.errorRow}>
          <Feather name="alert-circle" size={12} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

/** Convenience wrapper for password fields — handles eye toggle internally */
export function PasswordInput(props: Omit<InputProps, 'secureTextEntry' | 'rightAccessory'>) {
  const [visible, setVisible] = React.useState(false);
  return (
    <Input
      {...props}
      secureTextEntry={!visible}
      rightAccessory={
        <TouchableOpacity onPress={() => setVisible(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name={visible ? 'eye-off' : 'eye'} size={18} color={Colors.textTertiary} />
        </TouchableOpacity>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    height: 56,
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    height: '100%',
    marginLeft: 0,
  },
  inputNoIcon: {
    marginLeft: 0,
  },
  rightAccessory: {
    marginLeft: 8,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '500',
  },
  helperText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 5,
  },
});
