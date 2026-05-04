import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, PasswordInput } from '@/components/ui';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

const ROLE_CONFIG: Record<string, { label: string; emoji: string; gradient: [string, string]; color: string }> = {
  farmer: {
    label: 'Farmer',
    emoji: '🌾',
    gradient: ['#052e16', '#166534'],
    color: Colors.agri.sabz,
  },
  buyer: {
    label: 'Buyer',
    emoji: '🧺',
    gradient: ['#78350f', '#b45309'],
    color: Colors.agri.peela,
  },
  logistics: {
    label: 'Logistics',
    emoji: '🚛',
    gradient: ['#1e3a5f', '#2d4a7a'],
    color: Colors.agri.shab,
  },
  default: {
    label: 'Member',
    emoji: '👤',
    gradient: ['#111827', '#374151'],
    color: Colors.primary,
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
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── HERO ── */}
      <LinearGradient
        colors={config.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroBlob1} />
        <View style={styles.heroBlob2} />

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color="rgba(255,255,255,0.85)" />
        </TouchableOpacity>

        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeEmoji}>{config.emoji}</Text>
        </View>
        <Text style={styles.heroTitle}>Welcome Back</Text>
        <Text style={styles.heroSub}>Sign in as a DigitalKisan {config.label}</Text>
      </LinearGradient>

      {/* ── FORM SHEET ── */}
      <ScrollView
        style={styles.sheet}
        contentContainerStyle={styles.sheetContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.formHeading}>Sign In</Text>
        <Text style={styles.formSub}>Enter your credentials to continue</Text>

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
          style={styles.forgotBtn}
          onPress={() => Alert.alert('Coming Soon', 'Password reset will be available soon!')}
        >
          <Text style={[styles.forgotText, { color: config.color }]}>Forgot Password?</Text>
        </TouchableOpacity>

        <Button
          label="Sign In Securely"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          fullWidth
          size="xl"
          style={{ backgroundColor: config.color, borderRadius: 16, marginBottom: 20 }}
        />

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity
          style={[styles.registerBtn, { borderColor: config.color }]}
          onPress={() => router.push({ pathname: '/(auth)/role-select' })}
        >
          <Text style={[styles.registerBtnText, { color: config.color }]}>Create a New Account</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  // Hero
  hero: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 40,
    paddingHorizontal: 28,
    overflow: 'hidden',
  },
  heroBlob1: {
    position: 'absolute', top: -50, right: -40,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroBlob2: {
    position: 'absolute', bottom: -20, left: -20,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  heroBadge: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  heroBadgeEmoji: { fontSize: 30 },
  heroTitle: {
    fontSize: 28, fontWeight: '900', color: '#fff',
    letterSpacing: -0.8, marginBottom: 4,
  },
  heroSub: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.65)' },

  // Sheet
  sheet: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 60,
  },
  formHeading: {
    fontSize: 24, fontWeight: '900', color: Colors.textPrimary,
    letterSpacing: -0.5, marginBottom: 4,
  },
  formSub: {
    fontSize: 14, color: Colors.textSecondary,
    fontWeight: '500', marginBottom: 28,
  },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24, marginTop: -8 },
  forgotText: { fontSize: 13, fontWeight: '700' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divider: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textTertiary, fontSize: 12, fontWeight: '700', marginHorizontal: 12 },

  registerBtn: {
    height: 56, borderRadius: 16, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  registerBtnText: { fontSize: 15, fontWeight: '800' },

  terms: {
    textAlign: 'center', color: Colors.textTertiary,
    fontSize: 12, lineHeight: 18, paddingHorizontal: 16,
  },
  termsLink: { fontWeight: '700', color: Colors.textSecondary },
});
