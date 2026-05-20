import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Mail } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input } from '@/components/ui';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { role, email: prefillEmail } = useLocalSearchParams<{ role?: string; email?: string }>();
  const { requestPasswordReset } = useAuth();

  const [email, setEmail] = useState(prefillEmail ?? '');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await requestPasswordReset(trimmed);

      const goNext = () =>
        router.push({
          pathname: '/(auth)/reset-password' as any,
          params: { email: trimmed, role: role ?? '' },
        });

      let msg = `If an account exists for ${trimmed}, a 6-digit reset code has been sent. Check your inbox (and spam folder).`;
      if (__DEV__ && response?.devCode) {
        msg += `\n\n[DEV] Your code is: ${response.devCode}`;
      }

      Alert.alert('Check your email', msg, [{ text: 'Enter Code', onPress: goNext }]);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Something went wrong. Try again later.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="px-6 pt-14 pb-6 flex-row items-center border-b border-border bg-surface">
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-4 border border-border"
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-textPrimary">Forgot Password</Text>
          <Text className="text-sm font-medium text-textSecondary">
            We'll send a 6-digit code to your email.
          </Text>
        </View>
        <View className="w-12 h-12 rounded-xl items-center justify-center bg-emerald-50">
          <Mail size={24} color={Colors.primary} strokeWidth={2} />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-8"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-textSecondary text-sm mb-8 leading-5">
          Enter the email address associated with your DigitalKisan account.
          We'll send you a reset code if we find a matching account.
        </Text>

        <Input
          label="Email Address"
          icon="mail"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />

        <Button
          label="Send Reset Code"
          onPress={handleSend}
          loading={loading}
          fullWidth
          size="xl"
          style={{ backgroundColor: Colors.primary, borderRadius: 16, marginTop: 24, marginBottom: 24 }}
        />

        <TouchableOpacity
          className="self-center mt-2"
          onPress={() =>
            router.push({
              pathname: '/(auth)/reset-password' as any,
              params: { email: email.trim() || prefillEmail || '', role: role ?? '' },
            })
          }
        >
          <Text className="text-sm font-bold" style={{ color: Colors.primary }}>
            I already have a code
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
