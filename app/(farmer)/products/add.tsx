import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, Platform, 
  ToastAndroid, Alert, Image, KeyboardAvoidingView, StyleSheet, Dimensions, ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui';
import { LinearGradient } from 'expo-linear-gradient';

import aiService from '@/services/ai.service';
import productService from '@/services/product.service';

const { width } = Dimensions.get('window');

const productSchema = z.object({
  name: z.string().min(2, 'Crop name is required'),
  price: z.string().min(1, 'Price is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  unit: z.string().min(1, 'Unit is required'),
  category: z.string().min(1, 'Category is required'),
});

type ProductForm = z.infer<typeof productSchema>;

const UNITS = ['kg', 'ton', 'liter', 'piece', 'dozen'];
const CATEGORIES = ['grains', 'vegetables', 'fruits', 'dairy', 'livestock', 'other'];

export default function AddProductScreen() {
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const isEditing = !!productId;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSimulatingAI, setIsSimulatingAI] = useState(false);
  const [prefilling, setPrefilling] = useState(isEditing);
  const [submissionStatus, setSubmissionStatus] = useState<{ type: 'success' | 'error' | 'pending'; title: string; message: string; productId?: string } | null>(null);

  const { control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', price: '', quantity: '', unit: 'kg', category: 'grains' },
  });

  const selectedUnit = watch('unit');
  const selectedCategory = watch('category');

  // Polling for AI status
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (submissionStatus?.type === 'pending' && submissionStatus.productId) {
      interval = setInterval(async () => {
        try {
          const p = await productService.getById(submissionStatus.productId!);
          if (p.status === 'active') {
            setSubmissionStatus({
              type: 'success',
              title: 'Listing Approved! ✅',
              message: 'Your product has been approved by AI and is now live.',
            });
            clearInterval(interval);
          } else if (p.status === 'rejected') {
            setSubmissionStatus({
              type: 'error',
              title: 'Listing Rejected ❌',
              message: p.rejectionReason || 'Your product was rejected by our AI.',
            });
            clearInterval(interval);
          }
        } catch (e) {
          console.error("Error polling product status", e);
        }
      }, 3000); // Poll every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [submissionStatus]);

  // Pre-fill form when editing
  useEffect(() => {
    if (!productId) return;
    productService.getById(productId).then(p => {
      reset({
        name:     p.title,
        price:    String(p.pricePerUnit),
        quantity: String(p.availableQuantity),
        unit:     p.unit,
        category: p.category,
      });
      if (p.images && p.images.length > 0) setImageUri(p.images[0]);
    }).catch(() => {
      Alert.alert('Error', 'Could not load product details.');
    }).finally(() => setPrefilling(false));
  }, [productId]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });


    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const onSubmit = async (data: ProductForm) => {
    if (!imageUri) {
      Alert.alert('Photo Required', 'Please upload a photo of your crop before listing.');
      return;
    }

    setIsSimulatingAI(true);

    try {
      // 1. Prepare base64 image data
      let base64Data: string | undefined;
      let mimeType: string = 'image/jpeg';

      if (!isEditing && imageUri) {
        if (Platform.OS === 'web') {
          // On web, imageUri is a blob URL — fetch it to get the actual binary + real MIME type
          const response = await fetch(imageUri);
          const blob = await response.blob();
          // Use the actual blob MIME type (not guessed from filename)
          mimeType = blob.type || 'image/jpeg';
          base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              // result is: "data:image/jpeg;base64,/9j/..."
              // Strip the prefix to get raw base64
              resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } else {
          // Native: read file as base64 directly
          const filename = imageUri.split('/').pop() ?? 'crop.jpg';
          mimeType = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
          const FileSystem = require('expo-file-system/legacy');
          base64Data = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
        }
      }

      // 2. Prepare payload
      const payload: any = {
        title: data.name,
        description: `Fresh ${data.category} listed by farmer.`,
        category: data.category,
        pricePerUnit: parseFloat(data.price.replace(/[^0-9.]/g, '')),
        unit: data.unit,
        availableQuantity: parseInt(data.quantity.replace(/[^0-9]/g, ''), 10),
      };

      if (isEditing && productId) {
        await productService.update(productId, payload);
        setSubmissionStatus({
          type: 'success',
          title: 'Listing Updated! ✅',
          message: 'Your product listing has been updated successfully.'
        });
      } else {
        if (base64Data) {
          payload.imageData = base64Data;
          payload.mimeType = mimeType;
        }

        const createdProduct = await productService.create(payload);
        
        setSubmissionStatus({
          type: createdProduct.status === 'pending_ai' ? 'pending' : 'success',
          title: createdProduct.status === 'pending_ai' ? 'AI Analyzing Listing ⏳' : 'Listing Submitted! ✅',
          message: createdProduct.status === 'pending_ai' ? 'Your product is currently being reviewed by our AI. Please wait...' : 'Your product has been listed successfully.',
          productId: createdProduct._id,
        });
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to list product. Please try again.';
      setSubmissionStatus({
        type: 'error',
        title: 'Error',
        message: msg
      });
    } finally {
      setIsSimulatingAI(false);
    }
  };

  if (prefilling) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFB' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 12, color: Colors.textSecondary, fontWeight: '600' }}>Loading product...</Text>
      </View>
    );
  }

  if (submissionStatus) {
    const isSuccess = submissionStatus.type === 'success';
    const isError = submissionStatus.type === 'error';
    const isPending = submissionStatus.type === 'pending';
    
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' }]}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: isSuccess ? '#DCFCE7' : isError ? '#FEE2E2' : '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          {isPending ? (
            <ActivityIndicator size="large" color="#3B82F6" />
          ) : (
            <Feather name={isSuccess ? "check" : "x"} size={40} color={isSuccess ? "#16A34A" : isError ? "#DC2626" : "#3B82F6"} />
          )}
        </View>
        <Text style={{ fontSize: 24, fontWeight: '900', color: Colors.textPrimary, marginBottom: 12, textAlign: 'center' }}>
          {submissionStatus.title}
        </Text>
        <Text style={{ fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 40, lineHeight: 24 }}>
          {submissionStatus.message}
        </Text>
        {!isPending && (
          <TouchableOpacity 
            style={[styles.submitBtn, { width: '100%', backgroundColor: isSuccess ? Colors.agri.sabz : '#1E293B' }]}
            onPress={() => {
              if (isSuccess) {
                router.back();
              } else {
                setSubmissionStatus(null);
              }
            }}
          >
            <Text style={styles.submitBtnText}>{isSuccess ? 'Go to My Products' : 'Try Again'}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Listing' : 'Add New Listing'}</Text>
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.unitGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setValue('category', cat)}
                  style={[styles.unitBtn, selectedCategory === cat ? styles.unitBtnActive : null]}
                >
                  <Text style={[styles.unitBtnText, selectedCategory === cat ? styles.unitBtnTextActive : null, { textTransform: 'capitalize' }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.category && <Text style={styles.errorText}>{errors.category.message}</Text>}
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
         <Button 
            label={isSimulatingAI ? 'Analyzing & Publishing...' : 'Confirm Listing'}
            onPress={handleSubmit(onSubmit)}
            loading={isSimulatingAI}
            size="xl"
            fullWidth
            rightIcon={!isSimulatingAI && <Feather name="plus-circle" size={20} color="#fff" />}
            style={{ backgroundColor: Colors.agri.sabz }}
         />

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

