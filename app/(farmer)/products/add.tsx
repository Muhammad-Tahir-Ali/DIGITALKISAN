import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Platform,
  Alert, Image, KeyboardAvoidingView, StyleSheet, ActivityIndicator,
  InteractionManager,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui';
import { LinearGradient } from 'expo-linear-gradient';

import productService from '@/services/product.service';

const MAX_IMAGES = 5;

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
  const insets = useSafeAreaInsets();
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const isEditing = !!productId;

  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSimulatingAI, setIsSimulatingAI] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [prefilling, setPrefilling] = useState(isEditing);
  const [submissionStatus, setSubmissionStatus] = useState<{
    type: 'success' | 'error' | 'pending';
    title: string;
    message: string;
    productId?: string;
  } | null>(null);

  const { control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', price: '', quantity: '', unit: 'kg', category: 'grains' },
  });

  const selectedUnit = watch('unit');
  const selectedCategory = watch('category');

  // Poll for AI status after submission
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
          console.error('Error polling product status', e);
        }
      }, 3000);
    }

    return () => { if (interval) clearInterval(interval); };
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
      if (p.images && p.images.length > 0) setSelectedImages(p.images);
    }).catch(() => {
      Alert.alert('Error', 'Could not load product details.');
    }).finally(() => setPrefilling(false));
  }, [productId]);

  // Recover pending image picker result if Android killed the activity while gallery was open
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    (async () => {
      try {
        const pending = await ImagePicker.getPendingResultAsync() as any;
        if (pending && !pending.errorCode && !pending.canceled && pending.assets?.length) {
          const newUris = (pending.assets as { uri: string }[]).map(a => a.uri);
          setSelectedImages(prev => [...prev, ...newUris].slice(0, MAX_IMAGES));
        }
      } catch {
        // No pending result — that's fine
      }
    })();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library in Settings to upload crop photos.',
      );
      return;
    }

    const remaining = MAX_IMAGES - selectedImages.length;
    if (remaining <= 0) return;

    setIsPickingImage(true);
    InteractionManager.runAfterInteractions(async () => {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          allowsMultipleSelection: true,
          selectionLimit: remaining,
          quality: 0.7,
        });

        if (!result.canceled && result.assets?.length) {
          const newUris = result.assets.map(a => a.uri);
          setSelectedImages(prev => [...prev, ...newUris].slice(0, MAX_IMAGES));
        }
      } catch (e) {
        Alert.alert('Error', 'Could not open photo library. Please try again.');
      } finally {
        setIsPickingImage(false);
      }
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductForm) => {
    if (selectedImages.length === 0) {
      Alert.alert('Photo Required', 'Please upload at least one photo of your crop before listing.');
      return;
    }

    setIsSimulatingAI(true);

    try {
      // Encode any local URIs to base64 data URIs; pass through data:/http: as-is
      const finalImages: string[] = [];

      for (const uri of selectedImages) {
        if (uri.startsWith('data:') || uri.startsWith('http:') || uri.startsWith('https:')) {
          finalImages.push(uri);
        } else {
          // Local file:// or blob: — encode to base64 data URI
          let b64: string;
          let mime = 'image/jpeg';

          if (Platform.OS === 'web') {
            const response = await fetch(uri);
            const blob = await response.blob();
            mime = blob.type || 'image/jpeg';
            b64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } else {
            const filename = uri.split('/').pop() ?? 'crop.jpg';
            mime = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
            const FileSystem = require('expo-file-system/legacy');
            b64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
          }

          finalImages.push(`data:${mime};base64,${b64}`);
        }
      }

      const payload: any = {
        title: data.name,
        description: `Fresh ${data.category} listed by farmer.`,
        category: data.category,
        pricePerUnit: parseFloat(data.price.replace(/[^0-9.]/g, '')),
        unit: data.unit,
        availableQuantity: parseInt(data.quantity.replace(/[^0-9]/g, ''), 10),
      };

      if (isEditing && productId) {
        // Send full updated images array — update endpoint does findByIdAndUpdate(req.body)
        await productService.update(productId, { ...payload, images: finalImages });
        setSubmissionStatus({
          type: 'success',
          title: 'Listing Updated! ✅',
          message: 'Your product listing has been updated successfully.',
        });
      } else {
        // Extract imageDatas + mimeTypes from the data URIs for AI grading
        const imageDatas: string[] = [];
        const mimeTypes: string[] = [];
        for (const uri of finalImages) {
          if (uri.startsWith('data:')) {
            const commaIdx = uri.indexOf(',');
            const mime = uri.substring(5, uri.indexOf(';'));
            imageDatas.push(uri.substring(commaIdx + 1));
            mimeTypes.push(mime);
          }
        }

        if (imageDatas.length > 0) {
          payload.imageDatas = imageDatas;
          payload.mimeTypes = mimeTypes;
        }

        const createdProduct = await productService.create(payload);
        setSubmissionStatus({
          type: createdProduct.status === 'pending_ai' ? 'pending' : 'success',
          title: createdProduct.status === 'pending_ai' ? 'AI Analyzing Listing ⏳' : 'Listing Submitted! ✅',
          message: createdProduct.status === 'pending_ai'
            ? 'Your product is currently being reviewed by our AI. Please wait...'
            : 'Your product has been listed successfully.',
          productId: createdProduct._id,
        });
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to list product. Please try again.';
      setSubmissionStatus({ type: 'error', title: 'Error', message: msg });
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
        <View style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: isSuccess ? '#DCFCE7' : isError ? '#FEE2E2' : '#EFF6FF',
          alignItems: 'center', justifyContent: 'center', marginBottom: 24,
        }}>
          {isPending ? (
            <ActivityIndicator size="large" color="#3B82F6" />
          ) : (
            <Feather
              name={isSuccess ? 'check' : 'x'}
              size={40}
              color={isSuccess ? '#16A34A' : isError ? '#DC2626' : '#3B82F6'}
            />
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
            onPress={() => { if (isSuccess) router.replace('/(farmer)/products'); else setSubmissionStatus(null); }}
          >
            <Text style={styles.submitBtnText}>{isSuccess ? 'Go to My Products' : 'Try Again'}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(farmer)/products')}>
          <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Listing' : 'Add New Listing'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* IMAGE UPLOAD */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Crop Photography</Text>
          <Text style={styles.sectionDesc}>High quality photos get 3x more buyer interest.</Text>

          {/* Thumbnail strip */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbStripContent}
            style={styles.thumbStrip}
          >
            {selectedImages.map((uri, index) => (
              <View key={`img-${index}`} style={styles.thumbWrapper}>
                <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
                {index === 0 && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Main</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeImage(index)}
                  disabled={isSimulatingAI}
                  hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                >
                  <Feather name="x" size={10} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}

            {selectedImages.length < MAX_IMAGES && (
              <TouchableOpacity
                style={[styles.addThumb, (isPickingImage || isSimulatingAI) && { opacity: 0.5 }]}
                onPress={pickImage}
                disabled={isPickingImage || isSimulatingAI}
                activeOpacity={0.7}
              >
                {isPickingImage ? (
                  <ActivityIndicator size="small" color={Colors.agri.sabz} />
                ) : (
                  <>
                    <Feather name="camera" size={22} color={Colors.agri.sabz} />
                    <Text style={styles.addThumbText}>Add</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>

          <Text style={styles.imageHint}>
            {selectedImages.length === 0
              ? `Tap "Add" to upload crop photos · Max ${MAX_IMAGES} images`
              : `${selectedImages.length}/${MAX_IMAGES} photos · First image is the main photo`}
          </Text>

          <View style={styles.aiAlert}>
            <LinearGradient colors={['#F5F3FF', '#EDE9FE']} style={[StyleSheet.absoluteFill, { borderRadius: 16 }]} />
            <View style={styles.aiIconWrap}>
              <Feather name="cpu" size={18} color="#7C3AED" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiTitle}>AI Quality Analysis</Text>
              <Text style={styles.aiDesc}>Upon upload, our AI will automatically grade your crop as Premium, Standard, or Fair.</Text>
            </View>
          </View>
        </View>

        {/* LISTING DETAILS */}
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
                  <Text style={[styles.unitBtnText, selectedCategory === cat ? styles.unitBtnTextActive : null, { textTransform: 'capitalize' }]}>
                    {cat}
                  </Text>
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

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          label={isSimulatingAI ? 'Analyzing & Publishing...' : 'Confirm Listing'}
          onPress={handleSubmit(onSubmit)}
          loading={isSimulatingAI}
          disabled={isSimulatingAI || isPickingImage}
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
    paddingBottom: 20, paddingHorizontal: 24,
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

  thumbStrip: { marginBottom: 12 },
  thumbStripContent: { gap: 10, paddingBottom: 4 },
  thumbWrapper: { position: 'relative' },
  thumb: {
    width: 90, height: 90, borderRadius: 14, backgroundColor: '#E2E8F0',
  },
  primaryBadge: {
    position: 'absolute', bottom: 5, left: 5,
    backgroundColor: Colors.agri.sabz, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  primaryBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  removeBtn: {
    position: 'absolute', top: -6, right: -6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25, shadowRadius: 2, elevation: 3,
  },
  addThumb: {
    width: 90, height: 90, borderRadius: 14,
    borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.agri.sabz,
    backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addThumbText: { fontSize: 11, fontWeight: '700', color: Colors.agri.sabz },
  imageHint: { fontSize: 12, color: '#94A3B8', fontWeight: '500', marginBottom: 16 },

  aiAlert: {
    flexDirection: 'row', padding: 16, borderRadius: 16,
    alignItems: 'center', gap: 12, overflow: 'hidden',
  },
  aiIconWrap: {
    width: 36, height: 36, borderRadius: 11, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  aiTitle: { fontSize: 14, fontWeight: '800', color: '#5B21B6' },
  aiDesc: { fontSize: 11, color: '#7C3AED', fontWeight: '500', marginTop: 2, lineHeight: 16 },

  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 13, fontWeight: '800', color: Colors.textPrimary,
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
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
    backgroundColor: '#fff', paddingHorizontal: 24, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  submitBtn: {
    backgroundColor: Colors.agri.sabz, height: 60, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', shadowColor: Colors.agri.sabz,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
