import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, Platform, 
  ToastAndroid, Alert, Image, KeyboardAvoidingView, StyleSheet, Dimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import aiService from '@/services/ai.service';
import productService from '@/services/product.service';

const { width } = Dimensions.get('window');

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

  const onSubmit = async (data: ProductForm) => {
    if (!imageUri) {
      if (Platform.OS === 'android') ToastAndroid.show('Please upload a product photo.', ToastAndroid.SHORT);
      else Alert.alert('Error', 'Please upload a product photo.');
      return;
    }

    setIsSimulatingAI(true);
    
    try {
      // 1. Analyze image with Gemini via our backend
      const aiResult = await aiService.classifyCrop(imageUri);
      
      // If it's not a crop, warn the user and stop
      if (aiResult.digit === '0') {
        Alert.alert('Invalid Image', 'The AI detected this is not a crop. Please upload a valid crop photo.');
        setIsSimulatingAI(false);
        return;
      }

      // 2. Create the product via API
      await productService.create({
        title: data.name,
        description: `AI Verified: ${aiResult.label}. Quality Grade: ${aiResult.grade}.`,
        category: 'grains', // Hardcoded to grains for now, but real app might have a picker
        pricePerUnit: parseFloat(data.price),
        unit: data.unit,
        availableQuantity: parseInt(data.quantity, 10),
      });

      Alert.alert(
        'Listing Created! ✅', 
        `AI graded your crop as ${aiResult.label} (${aiResult.grade}). It is now live on the marketplace.`, 
        [{ text: 'Awesome', onPress: () => router.back() }]
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Failed to analyze or list product.';
      Alert.alert('Error', msg);
    } finally {
      setIsSimulatingAI(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Listing</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* IMAGE UPLOAD UI */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Crop Photography</Text>
          <Text style={styles.sectionDesc}>High quality photos get 3x more buyer interest.</Text>
          
          <TouchableOpacity 
            onPress={pickImage}
            activeOpacity={0.8}
            style={[styles.imagePlate, imageUri ? styles.imagePlateActive : null]}
          >
            {imageUri ? (
              <>
                 <Image source={{ uri: imageUri }} style={styles.fullImage}  />
                 <View style={styles.imageOverlay}>
                    <View style={styles.changeBadge}>
                       <Feather name="camera" size={14} color={Colors.textPrimary} />
                       <Text style={styles.changeText}>Update Photo</Text>
                    </View>
                 </View>
              </>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <View style={styles.uploadCircle}>
                   <Feather name="upload" size={24} color={Colors.agri.sabz} />
                </View>
                <Text style={styles.uploadTitle}>Tap to Upload</Text>
                <Text style={styles.uploadSubtitle}>JPG or PNG (Max 5MB)</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.aiAlert}>
             <LinearGradient
               colors={['#F5F3FF', '#EDE9FE']}
               style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
             />
             <View style={styles.aiIconWrap}>
                <Feather name="cpu" size={18} color="#7C3AED" />
             </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.aiTitle}>AI Quality Analysis</Text>
                <Text style={styles.aiDesc}>Upon upload, our AI will automatically grade your crop as Premium, Standard, or Fair.</Text>
              </View>
          </View>
        </View>

        {/* DETAILS */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Listing Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Crop Name</Text>
            <Controller control={control} name="name" render={({ field: { onChange, value } }) => (
              <View style={[styles.inputField, errors.name && styles.inputError]}>
                <TextInput 
                  style={styles.textInput}
                  placeholder="e.g. Basmati Rice, Desi Wheat" 
                  placeholderTextColor="#94A3B8"
                  onChangeText={onChange} 
                  value={value} 
                />
              </View>
            )} />
            {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
          </View>

          <View style={styles.row}>
             <View style={{ flex: 1.2, marginRight: 12 }}>
                <Text style={styles.label}>Unit</Text>
                <View style={styles.unitGrid}>
                   {UNITS.map(u => (
                     <TouchableOpacity 
                       key={u} 
                       onPress={() => setValue('unit', u)} 
                       style={[styles.unitBtn, selectedUnit === u ? styles.unitBtnActive : null]}
                     >
                       <Text style={[styles.unitBtnText, selectedUnit === u ? styles.unitBtnTextActive : null]}>{u}</Text>
                     </TouchableOpacity>
                   ))}
                </View>
             </View>

             <View style={{ flex: 1 }}>
               <Text style={styles.label}>Price / {selectedUnit}</Text>
               <Controller control={control} name="price" render={({ field: { onChange, value } }) => (
                 <View style={[styles.inputField, errors.price && styles.inputError]}>
                    <Text style={styles.pricePrefix}>₨</Text>
                    <TextInput 
                      style={[styles.textInput, { fontWeight: '900' }]} 
                      placeholder="0" 
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric" 
                      onChangeText={onChange} 
                      value={value} 
                    />
                 </View>
               )} />
               {errors.price && <Text style={styles.errorText}>{errors.price.message}</Text>}
             </View>
          </View>

          <View style={[styles.inputGroup, { marginTop: 12 }]}>
            <Text style={styles.label}>Stock Quantity (in {selectedUnit})</Text>
            <Controller control={control} name="quantity" render={({ field: { onChange, value } }) => (
              <View style={[styles.inputField, errors.quantity && styles.inputError]}>
                <TextInput 
                  style={[styles.textInput, { fontWeight: '700' }]} 
                  placeholder="e.g. 500" 
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  onChangeText={onChange} 
                  value={value} 
                />
              </View>
            )} />
            {errors.quantity && <Text style={styles.errorText}>{errors.quantity.message}</Text>}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* FINAL ACTION */}
      <View style={styles.footer}>
         <TouchableOpacity 
            onPress={handleSubmit(onSubmit)}
            disabled={isSimulatingAI}
            activeOpacity={0.8}
            style={[styles.submitBtn, isSimulatingAI && { opacity: 0.7 }]}
         >
            {isSimulatingAI ? (
               <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.submitBtnText}>Analyzing & Publishing...</Text>
               </View>
            ) : (
               <Text style={styles.submitBtnText}>Confirm Listing</Text>
            )}
         </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: Colors.textPrimary },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 120 },
  
  section: { marginBottom: 32 },
  sectionLabel: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: '#64748B', fontWeight: '500', marginBottom: 20 },

  imagePlate: {
    height: 220, borderRadius: 24, borderWidth: 2, borderStyle: 'dashed',
    borderColor: '#E2E8F0', backgroundColor: '#F1F5F9',
    overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
  },
  imagePlateActive: { borderStyle: 'solid', borderColor: Colors.agri.sabz, backgroundColor: '#fff' },
  uploadPlaceholder: { alignItems: 'center' },
  uploadCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 5,
  },
  uploadTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  uploadSubtitle: { fontSize: 12, color: '#94A3B8', fontWeight: '500', marginTop: 4 },
  fullImage: { width: '100%', height: '100%' },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  changeBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6,
  },
  changeText: { fontSize: 12, fontWeight: '800', color: Colors.textPrimary },

  aiAlert: {
    flexDirection: 'row', padding: 16, borderRadius: 16, marginTop: 16,
    alignItems: 'center', gap: 12, overflow: 'hidden',
  },
  aiIconWrap: {
    width: 36, height: 36, borderRadius: 11, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  aiTitle: { fontSize: 14, fontWeight: '800', color: '#5B21B6' },
  aiDesc: { fontSize: 11, color: '#7C3AED', fontWeight: '500', marginTop: 2, lineHeight: 16 },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputField: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, height: 56, borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  inputError: { borderColor: Colors.error },
  textInput: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  pricePrefix: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary, marginRight: 8 },
  errorText: { color: Colors.error, fontSize: 11, marginTop: 4, fontWeight: '600' },
  
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  unitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  unitBtn: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0',
  },
  unitBtnActive: { backgroundColor: Colors.agri.sabz, borderColor: Colors.agri.sabz },
  unitBtnText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  unitBtnTextActive: { color: '#fff' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', padding: 24, borderTopWidth: 1, borderTopColor: '#F1F5F9',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  submitBtn: {
    backgroundColor: Colors.agri.sabz, height: 60, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', shadowColor: Colors.agri.sabz,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

