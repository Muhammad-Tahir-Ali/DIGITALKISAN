import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Dimensions, Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui';

const { width } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------
const authSchema = z.object({
  name: z.string().optional().refine((val) => {
    // Required only for register
    return true; 
  }, 'Name is required'),
  phone: z.string().regex(/^(?:\+92|0)[0-9]{10}$/, 'Invalid Pakistan phone number format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type AuthForm = z.infer<typeof authSchema>;

export default function AuthScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: string }>();
  const { login, register } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Determine theme color based on role
  const accentColor = useMemo(() => {
    if (role === 'farmer') return Colors.agri.sabz;
    if (role === 'buyer') return Colors.agri.peela;
    return Colors.primary;
  }, [role]);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
    defaultValues: { name: '', phone: '', password: '' },
  });

  const onSubmit = async (data: AuthForm) => {
    try {
      if (isLogin) {
        await login({ email: `${data.phone}@digitalkisan.app`, password: data.password });
      } else {
        await register({
          name: data.name || 'New User',
          phone: data.phone,
          password: data.password,
          role: (role as any) || 'buyer',
          email: `${data.phone}@digitalkisan.app` // Mapping phone to semi-unique email for system compatibility
        });
      }

      // Root layout/index handles navigation based on auth state
      router.replace('/');
    } catch (err: any) {
      Alert.alert('Authentication Error', err.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>{isLogin ? 'Welcome Back!' : 'Create Account'}</Text>
          <Text style={styles.subtitle}>
            {isLogin 
              ? `Sign in as a DigitalKisan ${role || 'Member'}` 
              : `Join our community as a ${role || 'Member'}`}
          </Text>
        </View>

        {/* Toggle Mode */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleBtn, isLogin && { backgroundColor: accentColor }]} 
            onPress={() => setIsLogin(true)}
          >
            <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, !isLogin && { backgroundColor: accentColor }]} 
            onPress={() => setIsLogin(false)}
          >
            <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>Register</Text>
          </TouchableOpacity>
        </View>

        {/* Form Body */}
        <View style={styles.form}>
          
          {!isLogin && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputWrap, errors.name && styles.inputError]}>
                    <Feather name="user" size={18} color="#94A3B8" />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your full name"
                      placeholderTextColor="#94A3B8"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  </View>
                )}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputWrap, errors.phone && styles.inputError]}>
                  <Text style={styles.flag}>🇵🇰</Text>
                  <Text style={styles.prefix}>+92</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="300 1234567"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                </View>
              )}
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputWrap, errors.password && styles.inputError]}>
                  <Feather name="lock" size={18} color="#94A3B8" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
          </View>

          {isLogin && (
            <TouchableOpacity style={styles.forgotBtn} onPress={() => Alert.alert('Coming Soon', 'Password reset will be available soon!')}>
              <Text style={[styles.forgotText, { color: accentColor }]}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <Button
            label={isLogin ? 'Sign In Securely' : 'Create My Account'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth
            style={{ backgroundColor: accentColor, borderRadius: 16, height: 60, marginTop: 12 }}
          />

          <Text style={styles.terms}>
            By continuing, you agree to our <Text style={{ fontWeight: '700' }}>Terms of Service</Text> and <Text style={{ fontWeight: '700' }}>Privacy Policy</Text>.
          </Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 60, paddingTop: 60 },
  header: { marginBottom: 32 },
  backBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  title: { fontSize: 28, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, fontWeight: '500', marginTop: 4 },
  
  toggleContainer: {
    flexDirection: 'row', backgroundColor: '#E2E8F0',
    borderRadius: 18, padding: 4, marginBottom: 32,
  },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  toggleText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  toggleTextActive: { color: '#fff' },

  form: { flex: 1 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, height: 60, borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  inputError: { borderColor: Colors.error },
  input: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginLeft: 12 },
  flag: { fontSize: 20, marginRight: 8 },
  prefix: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginRight: 8 },
  errorText: { color: Colors.error, fontSize: 12, marginTop: 4, fontWeight: '500' },

  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { fontSize: 14, fontWeight: '700' },
  
  terms: {
    textAlign: 'center', color: Colors.textSecondary,
    fontSize: 12, lineHeight: 18, marginTop: 24, paddingHorizontal: 20,
  },
});
