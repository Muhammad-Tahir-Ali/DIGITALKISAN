import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, ToastAndroid, Alert, Image, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/colors';

const productSchema = z.object({
  name: z.string().min(2, 'Crop name is required'),
  price: z.string().min(1, 'Price is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  unit: z.string().min(1, 'Unit is required'),
});

type ProductForm = z.infer<typeof productSchema>;

const UNITS = ['kg', 'maund', 'tons', 'dozens'];

export default function AddProductScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSimulatingAI, setIsSimulatingAI] = useState(false);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', price: '', quantity: '', unit: 'kg' },
  });

  const selectedUnit = watch('unit');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const onSubmit = (data: ProductForm) => {
    if (!imageUri) {
      if (Platform.OS === 'android') ToastAndroid.show('Please upload a product photo.', ToastAndroid.SHORT);
      else Alert.alert('Error', 'Please upload a product photo.');
      return;
    }

    setIsSimulatingAI(true);
    
    // Simulate AI grading and backend submission delay
    setTimeout(() => {
      setIsSimulatingAI(false);
      Alert.alert('Listing Created!', 'Your crop has been analyzed by AI and listed successfully.', [
        { text: 'Awesome', onPress: () => router.back() }
      ]);
    }, 1500);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-background">
      <View className="px-6 pt-16 pb-4 bg-white border-b border-gray-100 flex-row items-center">
        <TouchableOpacity 
          className="w-10 h-10 items-center justify-center rounded-full bg-gray-50 mr-4"
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-textPrimary">Add Product</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100, paddingTop: 20 }} showsVerticalScrollIndicator={false}>
        
        {/* IMAGE UPLOAD UI */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-textPrimary mb-2">Crop Photo</Text>
          <Text className="text-textSecondary text-sm mb-4">Clear photos get better AI grading and attract buyers faster.</Text>
          
          <TouchableOpacity 
            onPress={pickImage}
            className={`w-full h-48 rounded-2xl border-2 border-dashed items-center justify-center overflow-hidden ${imageUri ? 'border-primary bg-primary-50' : 'border-gray-300 bg-surface'}`}
          >
            {imageUri ? (
              <>
                 <Image source={{ uri: imageUri }} className="w-full h-full absolute"  />
                 <View className="absolute inset-0 bg-black/30 items-center justify-center">
                    <View className="bg-white/90 px-4 py-2 rounded-full flex-row items-center">
                       <Feather name="camera" size={16} color={Colors.textPrimary} />
                       <Text className="ml-2 font-bold text-textPrimary">Change Photo</Text>
                    </View>
                 </View>
              </>
            ) : (
              <View className="items-center">
                <View className="w-14 h-14 bg-gray-100 rounded-full items-center justify-center mb-3">
                   <Feather name="upload-cloud" size={28} color={Colors.textSecondary} />
                </View>
                <Text className="font-bold text-textPrimary text-lg">Tap to Upload Photo</Text>
                <Text className="text-textSecondary mt-1">Supports JPG, PNG</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* AI Banner Context */}
          <View className="mt-4 bg-purple-50 p-4 rounded-xl flex-row border border-purple-100 items-start">
             <View className="bg-purple-100 p-2 rounded-full mr-3 mt-0.5">
                <Feather name="cpu" size={20} color="#9333ea" />
             </View>
             <View className="flex-1">
                <Text className="text-purple-900 font-bold mb-1 pt-1">Automated AI Quality Grading</Text>
                <Text className="text-purple-700 text-xs">When you submit, our system will automatically grade your crop image as Premium, Standard, or Low.</Text>
             </View>
          </View>
        </View>

        {/* DETAILS */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-textPrimary mb-4">Product Details</Text>

          <Controller control={control} name="name" render={({ field: { onChange, value } }) => (
            <View className="mb-4">
              <Text className="text-textSecondary font-medium mb-1">What are you selling?</Text>
              <TextInput 
                className="border border-gray-200 rounded-xl h-14 px-4 bg-white text-lg font-medium" 
                placeholder="e.g. Basmati Rice, Wheat" 
                onChangeText={onChange} 
                value={value} 
              />
              {errors.name && <Text className="text-red-500 text-xs mt-1">{errors.name.message}</Text>}
            </View>
          )} />

          <View className="flex-row justify-between mb-4">
             <View className="w-[48%]">
                <Text className="text-textSecondary font-medium mb-1">Selling Unit</Text>
                <View className="flex-row flex-wrap gap-2">
                   {UNITS.map(u => (
                     <TouchableOpacity 
                       key={u} 
                       onPress={() => setValue('unit', u)} 
                       className={`px-3 py-2 rounded-xl flex-1 items-center border ${selectedUnit === u ? 'bg-primary-50 border-primary' : 'bg-white border-gray-200'}`}
                     >
                       <Text className={`font-bold ${selectedUnit === u ? 'text-primary' : 'text-textSecondary'}`}>{u}</Text>
                     </TouchableOpacity>
                   ))}
                </View>
             </View>

             <Controller control={control} name="price" render={({ field: { onChange, value } }) => (
               <View className="w-[48%]">
                 <Text className="text-textSecondary font-medium mb-1">Price per {selectedUnit}</Text>
                 <View className="flex-row items-center border border-gray-200 rounded-xl h-14 px-4 bg-white">
                    <Text className="text-lg font-bold text-textPrimary mr-2">₨</Text>
                    <TextInput 
                      className="flex-1 text-lg font-bold" 
                      placeholder="0" 
                      keyboardType="numeric" 
                      onChangeText={onChange} 
                      value={value} 
                    />
                 </View>
                 {errors.price && <Text className="text-red-500 text-xs mt-1">{errors.price.message}</Text>}
               </View>
             )} />
          </View>

          <Controller control={control} name="quantity" render={({ field: { onChange, value } }) => (
            <View className="mb-4">
              <Text className="text-textSecondary font-medium mb-1">Available Quantity / Stock (in {selectedUnit})</Text>
              <TextInput 
                className="border border-gray-200 rounded-xl h-14 px-4 bg-white text-lg font-bold" 
                placeholder="e.g. 100" 
                keyboardType="numeric"
                onChangeText={onChange} 
                value={value} 
              />
              {errors.quantity && <Text className="text-red-500 text-xs mt-1">{errors.quantity.message}</Text>}
            </View>
          )} />
        </View>

      </ScrollView>

      {/* FINAL ACTION */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)]">
         <TouchableOpacity 
            onPress={handleSubmit(onSubmit)}
            disabled={isSimulatingAI}
            className={`h-16 rounded-2xl flex-row items-center justify-center w-full ${isSimulatingAI ? 'bg-primary-300' : 'bg-primary'}`}
         >
            {isSimulatingAI ? (
               <>
                  <Feather name="loader" size={24} color="#fff" className="animate-spin mr-2" />
                  <Text className="text-white font-bold text-xl ml-2">Analyzing Image & Posting...</Text>
               </>
            ) : (
               <>
                  <Feather name="check-circle" size={24} color="#fff" />
                  <Text className="text-white font-bold text-xl ml-2">Publish Listing</Text>
               </>
            )}
         </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
