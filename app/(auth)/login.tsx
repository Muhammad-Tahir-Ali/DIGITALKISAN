import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Tractor, ShoppingBag, Truck, User, ArrowLeft } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, PasswordInput } from '@/components/ui';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

const ROLE_CONFIG: Record<string, { label: string; Icon: any; color: string; bg: string }> = {
  farmer: {
    label: 'Farmer',
    Icon: Tractor,
    color: Colors.primary,
    bg: '#E8F5E9',
  },
  buyer: {
    label: 'Buyer',
    Icon: ShoppingBag,
    color: Colors.amber[600],
    bg: '#FFF8E1',
  },
  logistics: {
    label: 'Logistics',
    Icon: Truck,
    color: '#1e3a5f',
    bg: '#DBEAFE',
  },
  default: {
    label: 'Member',
    Icon: User,
    color: Colors.textPrimary,
    bg: '#F1F5F9',
  },
};

export default function LoginScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: string }>();
  const { login } = useAuth();

  const roleKey = role ?? 'default';
  const config = ROLE_CONFIG[roleKey] ?? ROLE_CONFIG.default;

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login({ email: data.email, password: data.password });
      router.replace('/');
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Something went wrong.';
      const isUnverified = message.toLowerCase().includes('verify');

      if (Platform.OS === 'web') {
        window.alert(message + (isUnverified ? '\n\nPlease check your email for the verification code.' : ''));
        if (isUnverified) {
          router.push({ pathname: '/(auth)/verify-email', params: { email: data.email, role: roleKey } });
        }
        return;
      }

      if (isUnverified) {
        Alert.alert(
          'Email Not Verified',
          message,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Go to Verification',
              onPress: () => router.push({ pathname: '/(auth)/verify-email', params: { email: data.email, role: roleKey } }),
            },
          ]
        );
      } else {
        Alert.alert('Login Failed', message);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}
    >
      {/* ── HEADER ── */}
      <View className="px-6 pt-14 pb-6 flex-row items-center border-b border-border bg-surface">
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-4 border border-border"
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-textPrimary">Welcome Back</Text>
          <Text className="text-sm font-medium text-textSecondary">Sign in as a DigitalKisan {config.label}</Text>
        </View>
        <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: config.bg }}>
           <config.Icon size={24} color={config.color} strokeWidth={2} />
        </View>
      </View>

      {/* ── FORM ── */}
      <ScrollView
        className="flex-1 px-6 pt-8"
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Role Badge */}
        <View className="items-center mb-6">
          <View
            className="flex-row items-center gap-x-2 px-5 py-2.5 rounded-full"
            style={{ backgroundColor: config.bg, borderWidth: 1.5, borderColor: config.color + '55' }}
          >
            <config.Icon size={18} color={config.color} strokeWidth={2.5} />
            <Text className="text-base font-bold" style={{ color: config.color }}>
              Signing in as {config.label}
            </Text>
          </View>
        </View>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email Address"
              icon="mail"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email?.message}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <PasswordInput
              label="Password"
              icon="lock"
              placeholder="Min. 8 characters"
              error={errors.password?.message}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />

        <TouchableOpacity
          className="self-end mb-8 mt-[-8px]"
          onPress={() => router.push({
            pathname: '/(auth)/forgot-password' as any,
            params: { role: roleKey },
          })}
        >
          <Text className="text-sm font-bold" style={{ color: config.color }}>Forgot Password?</Text>
        </TouchableOpacity>

        <Button
          label="Sign In Securely"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          fullWidth
          size="xl"
          style={{ backgroundColor: config.color, borderRadius: 16, marginBottom: 24 }}
        />

        <View className="flex-row items-center my-6">
          <View className="flex-1 h-[1px] bg-border" />
          <Text className="mx-4 text-xs font-bold text-textTertiary">OR</Text>
          <View className="flex-1 h-[1px] bg-border" />
        </View>

        <TouchableOpacity
          className="h-14 rounded-2xl border-2 items-center justify-center mb-6"
          style={{ borderColor: config.color }}
          onPress={() => router.push({ pathname: '/(auth)/role-select' })}
        >
          <Text className="text-base font-bold" style={{ color: config.color }}>Create a New Account</Text>
        </TouchableOpacity>

        <Text className="text-center text-xs font-medium text-textTertiary px-4 leading-5 mb-8">
          By continuing, you agree to our{' '}
          <Text className="font-bold text-textSecondary">Terms of Service</Text>
          {' '}and{' '}
          <Text className="font-bold text-textSecondary">Privacy Policy</Text>.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
