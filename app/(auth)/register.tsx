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
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/store/authStore';

const CITIES = ['Lahore', 'Karachi', 'Faisalabad', 'Rawalpindi', 'Gujranwala', 'Multan', 'Peshawar', 'Other'];
const CROPS = ['Wheat', 'Rice', 'Cotton', 'Sugarcane', 'Maize', 'Vegetables', 'Fruits'];

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Name is required'),
    phone: z.string().regex(/^(?:\+92|0)[0-9]{10}$/, 'Invalid Pakistani phone format'),
    email: z.string().email('Invalid email').or(z.literal('')),
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
      await registerUser({
        name: data.fullName,
        email: data.email || `${data.phone}@placeholder.com`,
        phone: data.phone,
        password: data.password,
        role: role as UserRole,
      });

      // API calls to upload other details could follow here
      
      Alert.alert('Success', 'Your account has been created successfully!', [
        {
          text: 'Continue',
          onPress: () => {
            if (role === 'farmer') router.replace('/(farmer)/dashboard');
            else if (role === 'buyer') router.replace('/(buyer)/home');
            else if (role === 'logistics') router.replace('/(logistics)/dashboard');
            else router.replace('/(auth)/login');
          },
        },
      ]);
    } catch (err: any) {
      const msg = err.message || 'Registration failed';
      if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
      else Alert.alert('Error', msg);
    }
  };

  const onValidSubmit = (data: any) => onSubmit(data as RegisterForm);

  const pickImage = async (field: keyof RegisterForm) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setValue(field, result.assets[0].uri);
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
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header & Progress */}
      <View className="px-6 pt-16 pb-4">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity 
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-50 mr-4"
            onPress={handleBack}
          >
            <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-textPrimary capitalize">Register as {role}</Text>
        </View>

        {/* Progress Bar */}
        <View className="flex-row items-center mb-2">
          <Text className="text-sm font-medium text-textSecondary flex-1">Step {step} of {totalSteps}</Text>
          <Text className="text-sm font-semibold text-primary">{Math.round((step/totalSteps)*100)}%</Text>
        </View>
        <View className="h-2 bg-gray-100 rounded-full w-full overflow-hidden flex-row gap-x-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View 
              key={i} 
              className={`flex-1 h-full rounded-full transition-all duration-300 ${i < step ? 'bg-primary' : 'bg-transparent'}`} 
            />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* STEP 1: Personal Info */}
        {step === 1 && (
          <View>
            <Text className="text-2xl font-bold text-textPrimary mb-6">Personal Information</Text>

            <Controller control={control} name="fullName" render={({ field: { onChange, onBlur, value } }) => (
              <View className="mb-4">
                <Text className="text-textPrimary font-medium mb-1">Full Name</Text>
                <TextInput className={`border rounded-xl h-12 px-4 bg-surface ${errors.fullName ? 'border-red-500' : 'border-gray-200'}`} placeholder="Enter your full name" onBlur={onBlur} onChangeText={onChange} value={value} />
                {errors.fullName && <Text className="text-red-500 text-xs mt-1">{errors.fullName.message}</Text>}
              </View>
            )} />

            <Controller control={control} name="phone" render={({ field: { onChange, onBlur, value } }) => (
              <View className="mb-4">
                <Text className="text-textPrimary font-medium mb-1">Phone Number</Text>
                <View className={`flex-row items-center border rounded-xl h-12 px-4 bg-surface ${errors.phone ? 'border-red-500' : 'border-gray-200'}`}>
                  <Text className="text-lg mr-2">🇵🇰</Text>
                  <TextInput className="flex-1 text-base text-textPrimary h-full" placeholder="+92 300 1234567" keyboardType="phone-pad" onBlur={onBlur} onChangeText={onChange} value={value} />
                </View>
                {errors.phone && <Text className="text-red-500 text-xs mt-1">{errors.phone.message}</Text>}
              </View>
            )} />

            <Controller control={control} name="email" render={({ field: { onChange, onBlur, value } }) => (
              <View className="mb-4">
                <Text className="text-textPrimary font-medium mb-1">Email <Text className="text-gray-400 font-normal">(Optional)</Text></Text>
                <TextInput className={`border rounded-xl h-12 px-4 bg-surface ${errors.email ? 'border-red-500' : 'border-gray-200'}`} placeholder="Enter your email" keyboardType="email-address" onBlur={onBlur} onChangeText={onChange} value={value} autoCapitalize="none" />
                {errors.email && <Text className="text-red-500 text-xs mt-1">{errors.email.message}</Text>}
              </View>
            )} />

            <View className="mb-4">
               <Text className="text-textPrimary font-medium mb-1">City / Location</Text>
               <TouchableOpacity 
                 className={`border rounded-xl h-12 px-4 bg-surface justify-center ${errors.city ? 'border-red-500' : 'border-gray-200'}`}
                 onPress={() => setDropdownModal({ field: 'city', options: CITIES })}
               >
                 <Text className={formData.city ? 'text-textPrimary' : 'text-gray-400'}>{formData.city || 'Select your city'}</Text>
               </TouchableOpacity>
               {errors.city && <Text className="text-red-500 text-xs mt-1">{errors.city.message}</Text>}
            </View>

            <Controller control={control} name="password" render={({ field: { onChange, onBlur, value } }) => (
              <View className="mb-4">
                <Text className="text-textPrimary font-medium mb-1">Password</Text>
                <View className={`flex-row items-center border rounded-xl h-12 px-4 bg-surface ${errors.password ? 'border-red-500' : 'border-gray-200'}`}>
                  <TextInput className="flex-1 text-base text-textPrimary h-full" placeholder="Min 8 characters" secureTextEntry={!showPassword} onBlur={onBlur} onChangeText={onChange} value={value} />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}><Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color={Colors.textSecondary} /></TouchableOpacity>
                </View>
                {errors.password && <Text className="text-red-500 text-xs mt-1">{errors.password.message}</Text>}
              </View>
            )} />

            <Controller control={control} name="confirmPassword" render={({ field: { onChange, onBlur, value } }) => (
              <View className="mb-6">
                <Text className="text-textPrimary font-medium mb-1">Confirm Password</Text>
                <TextInput className={`border rounded-xl h-12 px-4 bg-surface ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'}`} placeholder="Re-enter password" secureTextEntry={!showPassword} onBlur={onBlur} onChangeText={onChange} value={value} />
                {errors.confirmPassword && <Text className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</Text>}
              </View>
            )} />
          </View>
        )}

        {/* STEP 2: Role Info */}
        {step === 2 && (
          <View>
            <Text className="text-2xl font-bold text-textPrimary mb-6">Role Details</Text>

            {role === 'farmer' && (
              <>
                <Controller control={control} name="farmName" render={({ field: { onChange, value } }) => (
                  <View className="mb-4">
                    <Text className="text-textPrimary font-medium mb-1">Farm Name</Text>
                    <TextInput className="border border-gray-200 rounded-xl h-12 px-4 bg-surface" placeholder="e.g. Green Acres" onChangeText={onChange} value={value} />
                    {errors.farmName && <Text className="text-red-500 text-xs mt-1">{errors.farmName.message}</Text>}
                  </View>
                )} />
                <Controller control={control} name="farmLocation" render={({ field: { onChange, value } }) => (
                  <View className="mb-4">
                    <Text className="text-textPrimary font-medium mb-1">Farm Location (Village/Tehsil)</Text>
                    <TextInput className="border border-gray-200 rounded-xl h-12 px-4 bg-surface" placeholder="e.g. Chak 22, Okara" onChangeText={onChange} value={value} />
                    {errors.farmLocation && <Text className="text-red-500 text-xs mt-1">{errors.farmLocation.message}</Text>}
                  </View>
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
                  <Controller control={control} name="businessName" render={({ field: { onChange, value } }) => (
                    <View className="mb-4">
                      <Text className="text-textPrimary font-medium mb-1">Business Name</Text>
                      <TextInput className="border border-gray-200 rounded-xl h-12 px-4 bg-surface" placeholder="e.g. Al-Fatah Stores" onChangeText={onChange} value={value} />
                      {errors.businessName && <Text className="text-red-500 text-xs mt-1">{errors.businessName.message}</Text>}
                    </View>
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

                <Controller control={control} name="vehicleCapacity" render={({ field: { onChange, value } }) => (
                  <View className="mb-4">
                    <Text className="text-textPrimary font-medium mb-1">Capacity (kg)</Text>
                    <TextInput className="border border-gray-200 rounded-xl h-12 px-4 bg-surface" keyboardType="numeric" placeholder="e.g. 500" onChangeText={onChange} value={value} />
                    {errors.vehicleCapacity && <Text className="text-red-500 text-xs mt-1">{errors.vehicleCapacity.message}</Text>}
                  </View>
                )} />

                <Controller control={control} name="cnic" render={({ field: { onChange, value } }) => (
                  <View className="mb-4">
                    <Text className="text-textPrimary font-medium mb-1">CNIC Number</Text>
                    <TextInput className="border border-gray-200 rounded-xl h-12 px-4 bg-surface" placeholder="XXXXX-XXXXXXX-X" keyboardType="numeric" onChangeText={onChange} value={value} />
                    {errors.cnic && <Text className="text-red-500 text-xs mt-1">{errors.cnic.message}</Text>}
                  </View>
                )} />

                <Controller control={control} name="licenseNumber" render={({ field: { onChange, value } }) => (
                  <View className="mb-4">
                    <Text className="text-textPrimary font-medium mb-1">Driving License Number</Text>
                    <TextInput className="border border-gray-200 rounded-xl h-12 px-4 bg-surface" placeholder="Enter license #" onChangeText={onChange} value={value} />
                    {errors.licenseNumber && <Text className="text-red-500 text-xs mt-1">{errors.licenseNumber.message}</Text>}
                  </View>
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
      <View className="px-6 py-4 bg-white border-t border-gray-100 flex-row gap-x-4">
        <Button
          variant="outline"
          label={step === 1 ? "Cancel" : "Back"}
          onPress={handleBack}
          style={{ flex: 1 }}
          size="lg"
        />
        <Button
          variant="primary"
          label={step === totalSteps ? "Register" : "Next"}
          onPress={step === totalSteps ? handleSubmit(onValidSubmit) : handleNext}
          loading={isSubmitting}
          style={{ flex: 1 }}
          size="lg"
        />
      </View>

      {renderDropdownModal()}
    </KeyboardAvoidingView>
  );
}
