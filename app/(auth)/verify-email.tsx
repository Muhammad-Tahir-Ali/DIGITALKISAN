import React, { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email, role } = useLocalSearchParams<{ email: string; role: string }>();
  const { verifyRegistration } = useAuth();

  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyRegistration(email, code);

      const navigateNext = () => {
        if (role === 'farmer') router.replace('/(farmer)/dashboard');
        else if (role === 'buyer') router.replace('/(buyer)/home');
        else if (role === 'logistics') router.replace('/(logistics)/dashboard');
        else router.replace('/(auth)/login');
      };

      if (Platform.OS === 'web') {
        window.alert('Your email has been verified successfully!');
        navigateNext();
      } else {
        Alert.alert('Success', 'Your email has been verified successfully!', [
          {
            text: 'Continue',
            onPress: navigateNext,
          },
        ]);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Verification failed. Please check your code.';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="px-6 pt-16 pb-4">
        <TouchableOpacity
          className="w-10 h-10 items-center justify-center rounded-full bg-gray-50 mb-6"
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text className="text-3xl font-bold text-textPrimary mb-2">Verify Email</Text>
        <Text className="text-textSecondary text-base leading-relaxed mb-8">
          We have sent a 6-digit verification code to <Text className="font-bold text-textPrimary">{email}</Text>. Please enter it below to verify your account.
        </Text>

        <View className="mb-8">
          <Text className="text-textPrimary font-medium mb-2">Verification Code</Text>
          <TextInput
            className="border border-gray-200 rounded-xl h-14 px-4 bg-surface text-lg tracking-[0.25em]"
            placeholder="XXXXXX"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
            onSubmitEditing={handleVerify}
          />
        </View>

        <Button
          variant="primary"
          label="Verify Account"
          onPress={handleVerify}
          loading={isSubmitting}
          size="lg"
        />

        <Text className="text-center text-textSecondary mt-6">
          Didn't receive the code? Check your spam folder.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
