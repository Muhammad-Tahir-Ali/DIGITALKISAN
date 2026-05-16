import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Platform,
  Alert, KeyboardAvoidingView, StyleSheet, ActivityIndicator,
  InteractionManager, Animated, Image, Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Button, LazyImage } from '@/components/ui';
import { LinearGradient } from 'expo-linear-gradient';

import productService from '@/services/product.service';

const MAX_IMAGES = 5;

const productSchema = z.object({
  name: z.string().min(2, 'Crop name is required'),
  description: z.string().optional(),
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
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
    grade?: string;
  } | null>(null);

  // Scan animation refs
  const glowAnim    = useRef(new Animated.Value(0.4)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  const { control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', price: '', quantity: '', unit: 'kg', category: 'grains' },
  });

  const selectedUnit = watch('unit');
  const selectedCategory = watch('category');

  // Poll DB every 3s while backend AI is processing — updates scanning → result screen
  useEffect(() => {
    if (!pendingProductId) return;
    const interval = setInterval(async () => {
      try {
        const p = await productService.getById(pendingProductId);
        if (p.status === 'active') {
          clearInterval(interval);
          setPendingProductId(null);
          const grade = (p.aiGrade && p.aiGrade !== 'N/A') ? p.aiGrade : null;
          setSubmissionStatus({
            type: 'success',
            title: grade ? `AI Result: ${grade} ✅` : 'Listing Published! ✅',
            message: grade
              ? `Your crop was scanned and graded as ${grade}. It is now live on the marketplace.`
              : 'Your product has been listed on the marketplace.',
            grade: grade ?? undefined,
          });
          setIsSimulatingAI(false);
        } else if (p.status === 'rejected') {
          clearInterval(interval);
          setPendingProductId(null);
          setSubmissionStatus({
            type: 'error',
            title: 'Listing Rejected ❌',
            message: p.rejectionReason || 'Your product was rejected — please use clear crop photos.',
          });
          setIsSimulatingAI(false);
        }
      } catch {
        // network blip — keep polling
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [pendingProductId]);

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

  // Drive scanning animations while the AI API call is in flight
  useEffect(() => {
    if (!isSimulatingAI) {
      glowAnim.setValue(0.4);
      progressAnim.setValue(0);
      scanLineAnim.setValue(0);
      return;
    }
    const screenW = Dimensions.get('window').width - 48;

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim,     { toValue: 1,       duration: 900,  useNativeDriver: true }),
        Animated.timing(glowAnim,     { toValue: 0.3,     duration: 900,  useNativeDriver: true }),
      ])
    );
    const progress = Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, { toValue: screenW, duration: 2200, useNativeDriver: false }),
        Animated.timing(progressAnim, { toValue: 0,       duration: 400,  useNativeDriver: false }),
      ])
    );
    const scanLine = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1,       duration: 1800, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0,       duration: 600,  useNativeDriver: true }),
      ])
    );
    glow.start();
    progress.start();
    scanLine.start();
    return () => { glow.stop(); progress.stop(); scanLine.stop(); };
  }, [isSimulatingAI]);

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
          quality: 0.4,
          exif: false,
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
            b64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
          }

          finalImages.push(`data:${mime};base64,${b64}`);
        }
      }

      const payload: any = {
        title: data.name,
        description: data.description || `Fresh ${data.category} listed by farmer.`,
        category: data.category,
        pricePerUnit: parseFloat(data.price.replace(/[^0-9.]/g, '')),
        unit: data.unit,
        availableQuantity: parseInt(data.quantity.replace(/[^0-9]/g, ''), 10),
        images: finalImages,
      };

      if (isEditing && productId) {
        await productService.update(productId, payload);
        setIsSimulatingAI(false);
        setSubmissionStatus({
          type: 'success',
          title: 'Listing Updated! ✅',
          message: 'Your product listing has been updated successfully.',
        });
      } else {
        // Backend saves product immediately (pending_ai) and runs AI in background.
        // We keep the scanning screen up and poll until status changes to active/rejected.
        const createdProduct = await productService.create(payload);
        if (createdProduct.status === 'pending_ai') {
          // Scanning screen stays visible — polling effect takes over
          setPendingProductId(createdProduct._id);
        } else {
          // No images uploaded, went straight to active
          setIsSimulatingAI(false);
          setSubmissionStatus({
            type: 'success',
            title: 'Listing Published! ✅',
            message: 'Your product has been listed on the marketplace.',
          });
        }
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to list product. Please try again.';
      setIsSimulatingAI(false);
      setSubmissionStatus({ type: 'error', title: 'Upload Failed ❌', message: msg });
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

  // ── AI SCANNING SCREEN — shown while API call is in-flight ───────────────
  if (isSimulatingAI) {
    const scanX = scanLineAnim.interpolate({ inputRange: [0, 1], outputRange: ['-100%', '110%'] });
    return (
      <View style={[styles.container, { backgroundColor: '#0F172A' }]}>
        {/* Header */}
        <View style={[styles.scanHeader, { paddingTop: insets.top + 24 }]}>
          <Text style={styles.scanTitle}>🤖 AI Quality Scanner</Text>
          <Text style={styles.scanSubtitle}>Inspecting your crop photos for quality...</Text>
        </View>

        {/* Image strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scanImgStrip}
          style={{ marginTop: 32 }}
        >
          {selectedImages.map((uri, i) => (
            <Animated.View
              key={i}
              style={[styles.scanThumbWrap, { opacity: glowAnim, borderColor: '#22D3EE' }]}
            >
              <Image source={{ uri }} style={styles.scanThumb} resizeMode="cover" />
              {/* Moving scan line overlay */}
              <Animated.View
                pointerEvents="none"
                style={[styles.scanLineOverlay, { transform: [{ translateX: scanX }] }]}
              />
            </Animated.View>
          ))}
        </ScrollView>

        {/* Sweeping progress bar */}
        <View style={styles.scanBarTrack}>
          <Animated.View style={[styles.scanBarFill, { width: progressAnim }]} />
        </View>
        <Text style={styles.scanBarLabel}>Scanning...</Text>

        {/* Step list */}
        <View style={styles.scanSteps}>
          {/* Step 1 — done */}
          <View style={styles.scanStep}>
            <View style={[styles.scanStepDot, { backgroundColor: '#10B981' }]}>
              <Feather name="check" size={14} color="#fff" />
            </View>
            <View>
              <Text style={styles.scanStepTitle}>Images Uploaded</Text>
              <Text style={styles.scanStepDesc}>{selectedImages.length} photo{selectedImages.length !== 1 ? 's' : ''} received by server</Text>
            </View>
          </View>

          {/* Step 2 — active */}
          <View style={styles.scanStep}>
            <View style={[styles.scanStepDot, { backgroundColor: '#22D3EE' }]}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
            <View>
              <Text style={[styles.scanStepTitle, { color: '#22D3EE' }]}>AI Crop Analysis</Text>
              <Text style={styles.scanStepDesc}>Detecting defects, grade &amp; freshness...</Text>
            </View>
          </View>

          {/* Step 3 — pending */}
          <View style={styles.scanStep}>
            <View style={[styles.scanStepDot, { backgroundColor: '#1E293B', borderWidth: 2, borderColor: '#334155' }]}>
              <Feather name="award" size={12} color="#475569" />
            </View>
            <View>
              <Text style={[styles.scanStepTitle, { color: '#475569' }]}>Quality Report</Text>
              <Text style={styles.scanStepDesc}>Waiting for analysis to complete...</Text>
            </View>
          </View>
        </View>

        <Text style={styles.scanNote}>Usually takes 10–30 seconds · Do not close this screen</Text>
      </View>
    );
  }

  // ── RESULT SCREEN ─────────────────────────────────────────────────────────
  if (submissionStatus) {
    const isSuccess = submissionStatus.type === 'success';
    const grade = submissionStatus.grade;

    const GRADE_COLOR: Record<string, string> = {
      'Grade A': '#7E22CE',
      'Grade B': '#15803D',
      'Grade C': '#C2410C',
    };
    const GRADE_LABEL: Record<string, string> = {
      'Grade A': 'AI Premium',
      'Grade B': 'AI Standard',
      'Grade C': 'AI Low Grade',
    };
    const GRADE_SCORE: Record<string, number> = { 'Grade A': 95, 'Grade B': 72, 'Grade C': 50 };
    const gradeColor = grade ? GRADE_COLOR[grade] : '#16A34A';
    const gradeScore = grade ? GRADE_SCORE[grade] : null;

    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' }]}>
        {/* Icon */}
        <View style={{
          width: 88, height: 88, borderRadius: 44,
          backgroundColor: isSuccess ? '#DCFCE7' : '#FEE2E2',
          alignItems: 'center', justifyContent: 'center', marginBottom: 20,
        }}>
          <Feather name={isSuccess ? 'check-circle' : 'x-circle'} size={48} color={isSuccess ? '#16A34A' : '#DC2626'} />
        </View>

        <Text style={{ fontSize: 22, fontWeight: '900', color: Colors.textPrimary, marginBottom: 8, textAlign: 'center' }}>
          {submissionStatus.title}
        </Text>
        <Text style={{ fontSize: 15, color: '#64748B', textAlign: 'center', marginBottom: grade ? 28 : 40, lineHeight: 22 }}>
          {submissionStatus.message}
        </Text>

        {/* AI Grade card — only shown when a grade came back */}
        {grade && (
          <View style={{
            width: '100%', borderRadius: 20, padding: 20, marginBottom: 32,
            backgroundColor: '#FAF5FF', borderWidth: 1, borderColor: '#E9D5FF',
            alignItems: 'center', gap: 12,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="cpu" size={18} color={gradeColor} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: gradeColor, textTransform: 'uppercase', letterSpacing: 1 }}>
                AI Quality Report
              </Text>
            </View>

            <View style={{
              paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30,
              backgroundColor: gradeColor,
            }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>
                {GRADE_LABEL[grade] ?? grade}
              </Text>
            </View>

            {gradeScore && (
              <>
                <View style={{ width: '100%', height: 10, backgroundColor: '#E9D5FF', borderRadius: 5, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${gradeScore}%`, backgroundColor: gradeColor, borderRadius: 5 }} />
                </View>
                <Text style={{ fontSize: 13, color: gradeColor, fontWeight: '700' }}>
                  Quality Score: {gradeScore}/100
                </Text>
              </>
            )}

            {[
              { label: 'Size Uniformity', val: (gradeScore ?? 75) - 2 },
              { label: 'Freshness',       val: (gradeScore ?? 75) },
              { label: 'Blemish-Free',    val: (gradeScore ?? 75) + 1 },
            ].map(m => (
              <View key={m.label} style={{ width: '100%' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: '#7E22CE', fontWeight: '600' }}>{m.label}</Text>
                  <Text style={{ fontSize: 12, color: '#7E22CE', fontWeight: '800' }}>{Math.min(m.val, 99)}%</Text>
                </View>
                <View style={{ height: 6, backgroundColor: '#E9D5FF', borderRadius: 3 }}>
                  <View style={{ height: '100%', width: `${Math.min(m.val, 99)}%`, backgroundColor: gradeColor, borderRadius: 3 }} />
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, { width: '100%', backgroundColor: isSuccess ? Colors.agri.sabz : '#1E293B' }]}
          onPress={() => { if (isSuccess) router.replace('/(farmer)/products'); else setSubmissionStatus(null); }}
        >
          <Text style={styles.submitBtnText}>{isSuccess ? 'View My Listings' : 'Try Again'}</Text>
        </TouchableOpacity>
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
                <LazyImage uri={uri} style={styles.thumb} />
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

  // ── AI Scanning Screen ────────────────────────────────────────────────────
  scanHeader: { paddingHorizontal: 24, alignItems: 'center' },
  scanTitle: { fontSize: 24, fontWeight: '900', color: '#F1F5F9', textAlign: 'center', marginBottom: 8 },
  scanSubtitle: { fontSize: 14, color: '#94A3B8', fontWeight: '500', textAlign: 'center' },

  scanImgStrip: { paddingHorizontal: 24, gap: 12 },
  scanThumbWrap: {
    width: 110, height: 110, borderRadius: 16, overflow: 'hidden',
    borderWidth: 2, borderColor: '#22D3EE',
  },
  scanThumb: { width: '100%', height: '100%' },
  scanLineOverlay: {
    position: 'absolute', top: 0, bottom: 0, width: 40,
    backgroundColor: 'rgba(34, 211, 238, 0.35)',
  },

  scanBarTrack: {
    marginHorizontal: 24, marginTop: 32, height: 6,
    backgroundColor: '#1E293B', borderRadius: 3, overflow: 'hidden',
  },
  scanBarFill: { height: '100%', backgroundColor: '#22D3EE', borderRadius: 3 },
  scanBarLabel: {
    textAlign: 'center', marginTop: 8,
    fontSize: 12, fontWeight: '700', color: '#22D3EE', letterSpacing: 1.5,
  },

  scanSteps: { marginTop: 36, paddingHorizontal: 24, gap: 24 },
  scanStep: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  scanStepDot: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  scanStepTitle: { fontSize: 14, fontWeight: '800', color: '#E2E8F0', marginBottom: 2 },
  scanStepDesc: { fontSize: 12, color: '#64748B', fontWeight: '500' },

  scanNote: {
    position: 'absolute', bottom: 40, left: 0, right: 0,
    textAlign: 'center', fontSize: 12, color: '#475569', fontWeight: '600',
  },
});
