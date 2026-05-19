import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ToastAndroid,
  Alert,
  Modal,
  Animated,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Button, Input, PasswordInput } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/store/authStore';

const CITIES = ['Lahore', 'Karachi', 'Faisalabad', 'Rawalpindi', 'Gujranwala', 'Multan', 'Peshawar', 'Other'];
const CROPS = ['Wheat', 'Rice', 'Cotton', 'Sugarcane', 'Maize', 'Vegetables', 'Fruits'];

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Name is required'),
    phone: z.string().regex(/^(?:\+92|0)[0-9]{10}$/, 'Invalid Pakistani phone format'),
    email: z.string().email('Invalid email address is required'),
    city: z.string().min(1, 'City is required'),
    password: z.string().min(8, 'Minimum 8 characters'),
    confirmPassword: z.string(),

    farmName: z.string().optional(),
    farmLocation: z.string().optional(),
    landSize: z.string().optional(),
    primaryCrops: z.array(z.string()).optional(),

    businessType: z.string().optional(),
    businessName: z.string().optional(),

    vehicleType: z.string().optional(),
    vehicleCapacity: z.string().optional(),
    cnic: z.string().optional(),
    licenseNumber: z.string().optional(),

    cnicFront: z.string().optional(),
    cnicBack: z.string().optional(),
    landDoc: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Passwords don't match", path: ['confirmPassword'] });
    }
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: string }>();
  const { register: registerUser } = useAuth();

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [dropdownModal, setDropdownModal] = useState<{ field: keyof RegisterForm; options: string[] } | null>(null);

  const isFarmer = role === 'farmer';
  const totalSteps = isFarmer ? 3 : 2;

  // Animated progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: step / totalSteps,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [step, totalSteps]);

  const {
    control,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '', phone: '', email: '', city: '', password: '', confirmPassword: '',
      primaryCrops: [],
    },
  });

  const formData = watch();

  const handleNext = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await trigger(['fullName', 'phone', 'email', 'city', 'password', 'confirmPassword']);
    } else if (step === 2) {
      if (role === 'farmer') {
        isValid = await trigger(['farmName', 'farmLocation', 'landSize', 'primaryCrops']);
        if (!formData.farmName) { setValue('farmName', '', { shouldValidate: true }); isValid = false; }
        if (!formData.farmLocation) { setValue('farmLocation', '', { shouldValidate: true }); isValid = false; }
        if (!formData.landSize) { setValue('landSize', '', { shouldValidate: true }); isValid = false; }
        if (!formData.primaryCrops || formData.primaryCrops.length === 0) isValid = false;
      } else if (role === 'buyer') {
        isValid = await trigger(['businessType', 'businessName']);
        if (!formData.businessType) { setValue('businessType', '', { shouldValidate: true }); isValid = false; }
        if (formData.businessType !== 'Individual' && !formData.businessName) {
          setValue('businessName', '', { shouldValidate: true });
          isValid = false;
        }
      } else if (role === 'logistics') {
        isValid = await trigger(['vehicleType', 'vehicleCapacity', 'cnic', 'licenseNumber']);
        if (!formData.vehicleType) { setValue('vehicleType', '', { shouldValidate: true }); isValid = false; }
        if (!formData.vehicleCapacity) { setValue('vehicleCapacity', '', { shouldValidate: true }); isValid = false; }
        if (!formData.cnic || !/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/.test(formData.cnic)) {
          setValue('cnic', formData.cnic || '', { shouldValidate: true }); isValid = false;
          if (Platform.OS === 'android') ToastAndroid.show('Invalid CNIC Format', ToastAndroid.SHORT);
        }
        if (!formData.licenseNumber) { setValue('licenseNumber', '', { shouldValidate: true }); isValid = false; }
      }
    }

    if (isValid) {
      if (step < totalSteps) setStep(step + 1);
      else handleSubmit(onSubmit)();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  const onSubmit = async (data: RegisterForm) => {
    if (isFarmer && (!data.cnicFront || !data.cnicBack)) {
      if (Platform.OS === 'android') ToastAndroid.show('Please upload required CNIC images', ToastAndroid.SHORT);
      else Alert.alert('Error', 'Please upload required CNIC images');
      return;
    }

    try {
      const responseData = await registerUser({
        name: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: role as UserRole,
        ...(isFarmer && {
          cnicFront: data.cnicFront,
          cnicBack: data.cnicBack,
          landDoc: data.landDoc,
        }),
      });

      if (__DEV__ && responseData && responseData.devCode) {
        const msg = `[DEV MODE] Your verification code is: ${responseData.devCode}`;
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert('DEV MODE', msg);
        }
      }

      // Navigate to verify email screen
      router.push({
        pathname: '/(auth)/verify-email',
        params: { email: responseData?.email || data.email, role }
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Registration failed. Please try again.';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else if (Platform.OS === 'android') {
        ToastAndroid.show(msg, ToastAndroid.SHORT);
      } else {
        Alert.alert('Registration Failed', msg);
      }
    }
  };


  const pickImage = async (field: keyof RegisterForm) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const uri = asset.uri;
      const mimeType = asset.mimeType || 'image/jpeg';

      let base64Uri: string;
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        base64Uri = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } else {
        const b64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        base64Uri = `data:${mimeType};base64,${b64}`;
      }

      setValue(field, base64Uri);
    }
  };

  const renderDropdownModal = () => {
    if (!dropdownModal) return null;
    return (
      <Modal transparent visible animationType="fade">
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} 
          activeOpacity={1} 
          onPress={() => setDropdownModal(null)}
        >
          <View className="bg-white rounded-t-3xl p-6 pb-12">
            <Text className="text-xl font-semibold mb-4 text-textPrimary">Select Option</Text>
            {dropdownModal.options.map((opt) => (
              <TouchableOpacity
                key={opt}
                className="py-4 border-b border-gray-100"
                onPress={() => {
                  setValue(dropdownModal.field, opt, { shouldValidate: true });
                  setDropdownModal(null);
                }}
              >
                <Text className="text-lg text-textPrimary">{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F8FAFB' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >

      {/* ── HEADER & PROGRESS ── */}
      <View style={regStyles.header}>
        <View style={regStyles.headerTop}>
          <TouchableOpacity style={regStyles.backBtn} onPress={handleBack}>
            <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={regStyles.headerTitle}>Register as <Text style={{ color: Colors.primary, textTransform: 'capitalize' }}>{role}</Text></Text>
          </View>
          <Text style={regStyles.stepCount}>{step}/{totalSteps}</Text>
        </View>
        {/* Animated Progress Bar */}
        <View style={regStyles.progressTrack}>
          <Animated.View
            style={[
              regStyles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <View style={regStyles.stepLabels}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <Text key={i} style={[regStyles.stepLabel, i + 1 <= step && { color: Colors.primary, fontWeight: '700' }]}>
              {['Personal', 'Details', 'Verify'][i]}
            </Text>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* STEP 1: Personal Info */}
        {step === 1 && (
          <View>
            <Text style={regStyles.stepHeading}>Personal Information</Text>

            <Controller control={control} name="fullName" render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Full Name"
                icon="user"
                placeholder="Your full name"
                error={errors.fullName?.message}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )} />

            <Controller control={control} name="phone" render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Phone Number"
                icon="phone"
                placeholder="+92 300 1234567"
                keyboardType="phone-pad"
                error={errors.phone?.message}
                helperText="Format: +92XXXXXXXXXX or 0XXXXXXXXXX"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )} />

            <Controller control={control} name="email" render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email Address"
                icon="mail"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email?.message}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )} />

            <View style={{ marginBottom: 20 }}>
              <Text style={regStyles.fieldLabel}>City / Location</Text>
              <TouchableOpacity
                style={[
                  regStyles.dropdownBtn,
                  { borderColor: errors.city ? Colors.error : Colors.border },
                ]}
                onPress={() => setDropdownModal({ field: 'city', options: CITIES })}
              >
                <Feather name="map-pin" size={18} color={Colors.textTertiary} style={{ marginRight: 12 }} />
                <Text style={[regStyles.dropdownText, !formData.city && { color: Colors.textTertiary }]}>
                  {formData.city || 'Select your city'}
                </Text>
                <Feather name="chevron-down" size={16} color={Colors.textTertiary} />
              </TouchableOpacity>
              {errors.city && <Text style={regStyles.errorText}>{errors.city.message}</Text>}
            </View>

            <Controller control={control} name="password" render={({ field: { onChange, onBlur, value } }) => (
              <PasswordInput
                label="Password"
                icon="lock"
                placeholder="Min. 8 characters"
                error={errors.password?.message}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )} />

            <Controller control={control} name="confirmPassword" render={({ field: { onChange, onBlur, value } }) => (
              <PasswordInput
                label="Confirm Password"
                icon="lock"
                placeholder="Re-enter your password"
                error={errors.confirmPassword?.message}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )} />
          </View>
        )}

        {/* STEP 2: Role Info */}
        {step === 2 && (
          <View>
            <Text className="text-2xl font-bold text-textPrimary mb-6">Role Details</Text>

            {role === 'farmer' && (
              <>
                <Controller control={control} name="farmName" render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Farm Name"
                    icon="home"
                    placeholder="e.g. Green Acres"
                    error={errors.farmName?.message}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value ?? ''}
                  />
                )} />
                <Controller control={control} name="farmLocation" render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Farm Location (Village/Tehsil)"
                    icon="map-pin"
                    placeholder="e.g. Chak 22, Okara"
                    error={errors.farmLocation?.message}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value ?? ''}
                  />
                )} />
                
                <View className="mb-4">
                  <Text className="text-textPrimary font-medium mb-2">Land Size</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {['<1 acre', '1-5 acres', '5-20 acres', '20+ acres'].map(s => (
                      <TouchableOpacity key={s} onPress={() => setValue('landSize', s, { shouldValidate: true })} className={`px-4 py-2 rounded-full border ${formData.landSize === s ? 'bg-primary-50 border-primary' : 'bg-surface border-gray-200'}`}>
                        <Text className={formData.landSize === s ? 'text-primary font-medium' : 'text-textSecondary'}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {errors.landSize && <Text className="text-red-500 text-xs mt-1">{errors.landSize.message}</Text>}
                </View>

                <View className="mb-4">
                  <Text className="text-textPrimary font-medium mb-2">Primary Crops</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {CROPS.map(c => {
                      const cropsList = formData.primaryCrops || [];
                      const isSelected = cropsList.includes(c);
                      return (
                        <TouchableOpacity 
                          key={c} 
                          onPress={() => {
                            const next = isSelected ? cropsList.filter(x => x !== c) : [...cropsList, c];
                            setValue('primaryCrops', next, { shouldValidate: true });
                          }}
                          className={`px-4 py-2 rounded-full border ${isSelected ? 'bg-primary text-white border-primary' : 'bg-surface border-gray-200'}`}
                        >
                          <Text className={isSelected ? 'text-white font-medium' : 'text-textSecondary'}>{c}</Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                  {(!formData.primaryCrops || formData.primaryCrops.length === 0) && <Text className="text-red-500 text-xs mt-1">Select at least one crop</Text>}
                </View>
              </>
            )}

            {role === 'buyer' && (
              <>
                <View className="mb-4">
                  <Text className="text-textPrimary font-medium mb-2">Business Type</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {['Individual', 'Household', 'Retailer', 'Restaurant', 'Wholesaler'].map(bt => (
                      <TouchableOpacity key={bt} onPress={() => setValue('businessType', bt, { shouldValidate: true })} className={`px-4 py-2 rounded-full border ${formData.businessType === bt ? 'bg-amber-50 border-amber-500' : 'bg-surface border-gray-200'}`}>
                        <Text className={formData.businessType === bt ? 'text-amber-600 font-medium' : 'text-textSecondary'}>{bt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {errors.businessType && <Text className="text-red-500 text-xs mt-1">{errors.businessType.message}</Text>}
                </View>
                {formData.businessType && formData.businessType !== 'Individual' && (
                  <Controller control={control} name="businessName" render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Business Name"
                      icon="briefcase"
                      placeholder="e.g. Al-Fatah Stores"
                      error={errors.businessName?.message}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value ?? ''}
                    />
                  )} />
                )}
              </>
            )}

            {role === 'logistics' && (
              <>
                <View className="mb-4">
                  <Text className="text-textPrimary font-medium mb-2">Vehicle Type</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {['Motorcycle', 'Rickshaw', 'Small Truck', 'Large Truck'].map(vt => (
                      <TouchableOpacity key={vt} onPress={() => setValue('vehicleType', vt, { shouldValidate: true })} className={`px-4 py-2 rounded-full border ${formData.vehicleType === vt ? 'bg-blue-50 border-blue-500' : 'bg-surface border-gray-200'}`}>
                        <Text className={formData.vehicleType === vt ? 'text-blue-600 font-medium' : 'text-textSecondary'}>{vt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {errors.vehicleType && <Text className="text-red-500 text-xs mt-1">{errors.vehicleType.message}</Text>}
                </View>

                <Controller control={control} name="vehicleCapacity" render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Capacity (kg)"
                    icon="package"
                    keyboardType="numeric"
                    placeholder="e.g. 500"
                    error={errors.vehicleCapacity?.message}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value ?? ''}
                  />
                )} />

                <Controller control={control} name="cnic" render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="CNIC Number"
                    icon="credit-card"
                    placeholder="XXXXX-XXXXXXX-X"
                    keyboardType="numeric"
                    error={errors.cnic?.message}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value ?? ''}
                  />
                )} />

                <Controller control={control} name="licenseNumber" render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Driving License Number"
                    icon="file-text"
                    placeholder="Enter license #"
                    error={errors.licenseNumber?.message}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value ?? ''}
                  />
                )} />
              </>
            )}
          </View>
        )}

        {/* STEP 3: Verification (Farmer Only) */}
        {step === 3 && role === 'farmer' && (
          <View>
            <Text className="text-2xl font-bold text-textPrimary mb-2">Verification Docs</Text>
            <Text className="text-textSecondary text-sm mb-6">Your account will be verified within 24-48 hours. Please provide clear photos.</Text>

            <View className="mb-4">
              <Text className="text-textPrimary font-medium mb-2">CNIC Front *</Text>
              <TouchableOpacity onPress={() => pickImage('cnicFront')} className={`h-24 rounded-xl border-2 border-dashed items-center justify-center flex-row ${formData.cnicFront ? 'border-primary bg-primary-50' : 'border-gray-300 bg-surface'}`}>
                <Feather name={formData.cnicFront ? "check-circle" : "camera"} size={24} color={formData.cnicFront ? Colors.primary : Colors.textSecondary} />
                <Text className={`ml-2 font-medium ${formData.cnicFront ? 'text-primary' : 'text-textSecondary'}`}>
                  {formData.cnicFront ? 'Photo Uploaded' : 'Tap to Upload'}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-textPrimary font-medium mb-2">CNIC Back *</Text>
              <TouchableOpacity onPress={() => pickImage('cnicBack')} className={`h-24 rounded-xl border-2 border-dashed items-center justify-center flex-row ${formData.cnicBack ? 'border-primary bg-primary-50' : 'border-gray-300 bg-surface'}`}>
                <Feather name={formData.cnicBack ? "check-circle" : "camera"} size={24} color={formData.cnicBack ? Colors.primary : Colors.textSecondary} />
                <Text className={`ml-2 font-medium ${formData.cnicBack ? 'text-primary' : 'text-textSecondary'}`}>
                  {formData.cnicBack ? 'Photo Uploaded' : 'Tap to Upload'}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mb-6">
              <Text className="text-textPrimary font-medium mb-2">Land Ownership Docs <Text className="text-gray-400 font-normal">(Optional)</Text></Text>
              <TouchableOpacity onPress={() => pickImage('landDoc')} className={`h-24 rounded-xl border-2 border-dashed items-center justify-center flex-row ${formData.landDoc ? 'border-primary bg-primary-50' : 'border-gray-300 bg-surface'}`}>
                <Feather name={formData.landDoc ? "check-circle" : "upload"} size={24} color={formData.landDoc ? Colors.primary : Colors.textSecondary} />
                <Text className={`ml-2 font-medium ${formData.landDoc ? 'text-primary' : 'text-textSecondary'}`}>
                  {formData.landDoc ? 'Document Uploaded' : 'Tap to Upload'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Footer Buttons */}
      <View className="px-6 py-6 bg-white border-t border-gray-100 flex-row gap-x-4">
        <Button
          variant="outline"
          label={step === 1 ? "Cancel" : "Back"}
          onPress={handleBack}
          style={{ flex: 1 }}
          size="xl"
          fullWidth
        />
        <Button
          variant="primary"
          label={step === totalSteps ? "Register" : "Next"}
          onPress={step === totalSteps ? handleSubmit(onSubmit) : handleNext}
          loading={isSubmitting}
          style={{ flex: 2 }}
          size="xl"
          fullWidth
          rightIcon={<Feather name={step === totalSteps ? "check" : "arrow-right"} size={20} color="#fff" />}
        />
      </View>



      {renderDropdownModal()}
    </KeyboardAvoidingView>
  );
}

const regStyles = StyleSheet.create({
  header: {
    backgroundColor: Colors.surface,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  stepCount: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textTertiary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.cardBorder,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 999,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  stepHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 24,
    marginTop: 8,
    letterSpacing: -0.3,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    height: 56,
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },
});
