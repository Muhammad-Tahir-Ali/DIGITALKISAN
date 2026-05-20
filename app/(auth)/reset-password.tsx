import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Alert, TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Lock } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { Button, PasswordInput } from '@/components/ui';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email, role } = useLocalSearchParams<{ email?: string; role?: string }>();
  const { confirmPasswordReset, requestPasswordReset } = useAuth();

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Missing email. Please start the reset flow again.');
      return;
    }
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit code sent to your email.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match. Please try again.');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(email, code, newPassword);

      const navigateHome = () => {
        if (role === 'farmer') router.replace('/(farmer)/dashboard');
        else if (role === 'logistics') router.replace('/(logistics)/map');
        else router.replace('/(buyer)/home');
      };

      Alert.alert(
        'Password Updated',
        "Your password has been reset and you're signed back in.",
        [{ text: 'Continue', onPress: navigateHome }]
      );
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Could not reset password. Please try again.';
      Alert.alert('Reset Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    try {
      await requestPasswordReset(email);
      Alert.alert('Code Resent', 'A new 6-digit code has been sent to your email.');
    } catch {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
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
          <Text className="text-xl font-bold text-textPrimary">Reset Password</Text>
          <Text className="text-sm font-medium text-textSecondary">
            Enter the code we sent and choose a new password.
          </Text>
        </View>
        <View className="w-12 h-12 rounded-xl items-center justify-center bg-emerald-50">
          <Lock size={24} color={Colors.primary} strokeWidth={2} />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-8"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {email ? (
          <Text className="text-textSecondary text-sm mb-6 leading-5">
            We sent a 6-digit code to{' '}
            <Text className="font-bold text-textPrimary">{email}</Text>. Enter it below
            along with your new password.
          </Text>
        ) : (
          <Text className="text-error text-sm mb-6">
            No email provided. Please go back to the Forgot Password screen.
          </Text>
        )}

        <Text className="text-textPrimary font-medium mb-2">Verification Code</Text>
        <TextInput
          className="border rounded-xl h-14 px-4 bg-surface text-lg tracking-[0.25em] mb-4"
          style={{ borderColor: Colors.border, color: Colors.textPrimary }}
          placeholder="XXXXXX"
          placeholderTextColor={Colors.textTertiary}
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, ''))}
        />

        <View className="mt-1">
          <PasswordInput
            label="New Password"
            icon="lock"
            placeholder="Min. 8 characters"
            value={newPassword}
            onChangeText={setNewPassword}
          />
        </View>

        <PasswordInput
          label="Confirm New Password"
          icon="lock"
          placeholder="Re-enter the new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <Button
          label="Reset Password & Sign In"
          onPress={handleReset}
          loading={loading}
          fullWidth
          size="xl"
          style={{ backgroundColor: Colors.primary, borderRadius: 16, marginTop: 16, marginBottom: 16 }}
        />

        <TouchableOpacity
          className="self-center mt-2 mb-8"
          onPress={handleResend}
          disabled={!email}
        >
          <Text
            className="text-sm font-bold"
            style={{ color: email ? Colors.primary : Colors.textTertiary }}
          >
            Didn't get the code? Resend
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
