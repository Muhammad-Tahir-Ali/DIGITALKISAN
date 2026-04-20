import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ToastAndroid,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';

const loginSchema = z.object({
  phone: z
    .string()
    .regex(/^(?:\+92|0)[0-9]{10}$/, 'Invalid Pakistani phone number format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const user = await login({ phone: data.phone, password: data.password });
      
      // Navigate based on role
      switch (user?.role) {
        case 'farmer':
          router.replace('/(farmer)/dashboard');
          break;
        case 'buyer':
          router.replace('/(buyer)/home');
          break;
        case 'logistics':
          router.replace('/(logistics)/dashboard');
          break;
        case 'admin':
          router.replace('/(admin)/dashboard');
          break;
        default:
          router.replace('/(auth)/role-select');
          break;
      }
    } catch (err: any) {
      const msg = err.message || 'Login failed';
      if (Platform.OS === 'android') {
        ToastAndroid.show(msg, ToastAndroid.SHORT);
      } else {
        Alert.alert('Error', msg);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="px-6 pt-16 pb-6">
          <TouchableOpacity 
            className="mb-8 w-10 h-10 items-center justify-center rounded-full bg-gray-50"
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          
          <Text className="text-3xl font-bold text-textPrimary mb-2">Welcome Back</Text>
          <Text className="text-textSecondary text-base">Sign in to your account</Text>
        </View>

        {/* Form */}
        <View className="px-6 flex-1">
          {/* Phone Input */}
          <View className="mb-6">
            <Text className="text-textPrimary font-medium mb-2">Phone Number</Text>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className={`flex-row items-center border rounded-xl h-14 px-4 bg-surface ${errors.phone ? 'border-red-500' : 'border-gray-200 focus:border-primary'}`}>
                  <Text className="text-xl mr-2">🇵🇰</Text>
                  <TextInput
                    className="flex-1 text-base text-textPrimary h-full"
                    placeholder="+92 300 1234567"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="phone-pad"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                </View>
              )}
            />
            {errors.phone && (
              <Text className="text-red-500 text-sm mt-1">{errors.phone.message}</Text>
            )}
          </View>

          {/* Password Input */}
          <View className="mb-2">
            <Text className="text-textPrimary font-medium mb-2">Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className={`flex-row items-center border rounded-xl h-14 px-4 bg-surface ${errors.password ? 'border-red-500' : 'border-gray-200 focus:border-primary'}`}>
                  <TextInput
                    className="flex-1 text-base text-textPrimary h-full"
                    placeholder="Enter your password"
                    placeholderTextColor={Colors.textSecondary}
                    secureTextEntry={!showPassword}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2">
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password && (
              <Text className="text-red-500 text-sm mt-1">{errors.password.message}</Text>
            )}
          </View>

          {/* Forgot Password */}
          <View className="items-end mb-8">
            <TouchableOpacity>
              <Text className="text-secondary font-medium">Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <Button
            variant="primary"
            size="lg"
            label="Sign In"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth
            style={{ marginBottom: 24 }}
          />

          {/* Divider */}
          <View className="flex-row items-center justify-center mb-8">
            <View className="flex-1 h-[1px] bg-gray-200" />
            <Text className="mx-4 text-textSecondary text-sm font-medium">or</Text>
            <View className="flex-1 h-[1px] bg-gray-200" />
          </View>

          {/* Create Account Outline */}
          <Button
            variant="outline"
            size="lg"
            label="Create new account"
            onPress={() => router.push('/(auth)/role-select')}
            fullWidth
            style={{ marginBottom: 24 }}
          />

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
