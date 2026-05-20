import React from 'react';
import {
  View, Text, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Alert, TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Lock } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { Button, PasswordInput } from '@/components/ui';

const schema = z.object({
  code: z.string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must be numeric'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
});
type ResetForm = z.infer<typeof schema>;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email, role } = useLocalSearchParams<{ email?: string; role?: string }>();
  const { confirmPasswordReset, requestPasswordReset } = useAuth();

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetForm>({
    resolver: zodResolver(schema),
    defaultValues: { code: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetForm) => {
    if (!email) {
      const msg = 'Missing email. Please start the reset flow again.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
      return;
    }
    try {
      await confirmPasswordReset(email, data.code, data.newPassword);

      const navigateHome = () => {
        if (role === 'farmer') router.replace('/(farmer)/dashboard');
        else if (role === 'logistics') router.replace('/(logistics)/map');
        else router.replace('/(buyer)/home');
      };

      const msg = 'Your password has been reset and you\'re signed back in.';
      if (Platform.OS === 'web') {
        window.alert(msg);
        navigateHome();
      } else {
        Alert.alert('Password Updated', msg, [{ text: 'Continue', onPress: navigateHome }]);
      }
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Could not reset password.';
      if (Platform.OS === 'web') window.alert(message);
      else Alert.alert('Reset Failed', message);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    try {
      await requestPasswordReset(email);
      const msg = 'A new code has been sent to your email.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Code Resent', msg);
    } catch {
      const msg = 'Failed to resend code. Please try again.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
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
            No email provided. Please start over from the Forgot Password screen.
          </Text>
        )}

        <Text className="text-textPrimary font-medium mb-2">Verification Code</Text>
        <Controller
          control={control}
          name="code"
          render={({ field: { onChange, value } }) => (
            <TextInput
              className="border rounded-xl h-14 px-4 bg-surface text-lg tracking-[0.25em] mb-1"
              style={{ borderColor: errors.code ? Colors.error : Colors.border, color: Colors.textPrimary }}
              placeholder="XXXXXX"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="number-pad"
              maxLength={6}
              value={value}
              onChangeText={(v) => onChange(v.replace(/\D/g, ''))}
            />
          )}
        />
        {errors.code && (
          <Text className="text-error text-xs mb-3 font-medium">{errors.code.message}</Text>
        )}

        <View className="mt-5">
          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <PasswordInput
                label="New Password"
                icon="lock"
                placeholder="Min. 8 characters"
                error={errors.newPassword?.message}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
        </View>

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <PasswordInput
              label="Confirm New Password"
              icon="lock"
              placeholder="Re-enter the new password"
              error={errors.confirmPassword?.message}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />

        <Button
          label="Reset Password & Sign In"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          fullWidth
          size="xl"
          style={{ backgroundColor: Colors.primary, borderRadius: 16, marginTop: 16, marginBottom: 16 }}
        />

        <TouchableOpacity className="self-center mt-2 mb-8" onPress={handleResend} disabled={!email}>
          <Text className="text-sm font-bold" style={{ color: email ? Colors.primary : Colors.textTertiary }}>
            Didn't get the code? Resend
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
