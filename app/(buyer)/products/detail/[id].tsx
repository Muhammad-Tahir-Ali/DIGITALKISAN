import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  FlatList, StyleSheet, Platform, Dimensions,
  NativeSyntheticEvent, NativeScrollEvent, Animated, Image, ActivityIndicator, Share, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { AiBadge } from '@/components/marketplace/AiBadge';
import { useCartStore } from '@/store/cartStore';
import productService, { Product } from '@/services/product.service';

const { width: SW } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    productService.getById(id)
      .then(p => {
        setProduct(p);
        setQty(Math.min(5, p.availableQuantity || 1));
      })
      .catch(err => setError('Failed to load product details'))
      .finally(() => setLoading(false));
  }, [id]);

  const addItem     = useCartStore((s) => s.addItem);
  const totalItems  = useCartStore((s) => s.totalItems);

  const [qty,         setQty]         = useState(1);
  const [slideIndex,  setSlideIndex]  = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedAnim]   = useState(new Animated.Value(1));

  // ── Carousel scroll tracking
  const onCarouselScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
      setSlideIndex(idx);
    },
    [],
  );

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    addItem({
      id:          product._id,
      productId:   product._id,
      name:        product.title,
      price:       product.pricePerUnit,
      quantity:    qty,
      unit:        product.unit,
      farmerId:    product.farmer?._id || '',
      farmerName:  product.farmer?.name || 'Farmer',
      maxStock:    product.availableQuantity,
    });
    Animated.sequence([
      Animated.timing(addedAnim, { toValue: 0.9, duration: 80,  useNativeDriver: true }),
      Animated.spring(addedAnim,  { toValue: 1,   friction: 4,   useNativeDriver: true }),
    ]).start();
  }, [product, qty, addItem, addedAnim]);

  // ── Star renderer
  const Stars = ({ rating, count }: { rating: number; count: number }) => (
    <View style={styles.stars}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Feather
          key={i}
          name="star"
          size={12}
          color={i < Math.round(rating) ? Colors.amber[500] : Colors.border}
        />
      ))}
      <Text style={styles.ratingText}>{rating.toFixed(1)} ({count} reviews)</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: Colors.error, fontSize: 16 }}>{error || 'Product not found'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: Colors.primary, fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const productImages: string[] = product.images && product.images.length > 0 
    ? product.images 
    : ['__emoji__'];
    
  const totalPrice = product.pricePerUnit * qty;
  const emoji = '🌾'; // Fallback
  const farmerRating = product.farmer?.rating || 5.0;
  const farmerCity = product.farmer?.location?.address || 'Pakistan';
  const aiScore = 95; 
  const quality = 'Grade A' as any;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── IMAGE CAROUSEL ───────────────────────────────────────── */}
        <View style={styles.carouselWrap}>
          <FlatList
            data={productImages as any[]}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onCarouselScroll}
            scrollEventThrottle={16}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item: img }) => (
              <View style={[styles.slide, { width: SW }]}>
                {img === '__emoji__' ? (
                  <View style={[styles.slideEmojiWrap, { backgroundColor: '#F0FDF4' }]}>
                    <Text style={styles.slideEmoji}>{emoji}</Text>
                  </View>
                ) : (
                  <Image 
                    source={{ uri: img }} 
                    style={styles.fullImage}
                    resizeMode="cover"
                  />
                )}
              </View>
            )}
          />

          {/* Dot indicators */}
          <View style={styles.dots}>
            {productImages.length > 1 && productImages.map((_, i) => (
              <View key={i} style={[styles.dot, i === slideIndex && styles.dotActive]} />
            ))}
          </View>

          {/* Overlay action row */}
          <View style={styles.overlayActions}>
            <TouchableOpacity onPress={() => router.back()} style={styles.overlayBtn}>
              <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.overlayRight}>
              <TouchableOpacity
                onPress={() => setIsWishlisted((v) => !v)}
                style={styles.overlayBtn}
              >
                <Feather
                  name="heart"
                  size={20}
                  color={isWishlisted ? Colors.error : Colors.textPrimary}
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.overlayBtn}
                onPress={() => {
                  Share.share({
                    title: product.title,
                    message: `Check out ${product.title} for ₨${product.pricePerUnit}/${product.unit} on DigitalKisan!`,
                  });
                }}
              >
                <Feather name="share-2" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(buyer)/cart')}
                style={[styles.overlayBtn, { position: 'relative' }]}
              >
                <Feather name="shopping-cart" size={20} color={Colors.textPrimary} />
                {totalItems > 0 && (
                  <View style={styles.overlayBadge}>
                    <Text style={styles.overlayBadgeText}>{totalItems}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── CONTENT CARD ─────────────────────────────────────────── */}
        <View style={styles.contentCard}>

          {/* AI Badge + stock */}
          <View style={styles.rowBetween}>
            <AiBadge grade={quality} score={aiScore} />
            <View style={styles.stockPill}>
              <Feather name="package" size={11} color={Colors.success} />
              <Text style={styles.stockText}>In Stock · {product.availableQuantity} {product.unit}</Text>
            </View>
          </View>

          {/* Title + price */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.productName}>{product.title}</Text>
              <Text style={styles.productSub}>Harvested · {farmerCity}</Text>
            </View>
            <View style={styles.priceBlock}>
              <Text style={styles.bigPrice}>₨{product.pricePerUnit}</Text>
              <Text style={styles.perUnit}>per {product.unit}</Text>
            </View>
          </View>

          {/* ── FARMER CARD ─────────────────────────────────────────── */}
          <View style={styles.farmerCard}>
            <View style={styles.farmerAvatar}>
              <Text style={{ fontSize: 22 }}>👨‍🌾</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.farmerName}>{product.farmer?.name || 'Farmer'}</Text>
              <Stars rating={farmerRating} count={product.ratingsQuantity || 0} />
              <Text style={styles.farmerLocation}>
                <Feather name="map-pin" size={10} color={Colors.textSecondary} />
                {' '}{farmerCity}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.viewProfileBtn}
              onPress={() => Alert.alert(
                product.farmer?.name || 'Farmer',
                `📍 ${farmerCity}\n⭐ ${farmerRating.toFixed(1)} rating`,
                [{ text: 'Close' }]
              )}
            >
              <Text style={styles.viewProfileText}>Profile</Text>
              <Feather name="chevron-right" size={14} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* ── AI QUALITY DETAIL ───────────────────────────────────── */}
          <View style={styles.aiPanel}>
            <View style={styles.aiPanelHeader}>
              <Feather name="cpu" size={16} color="#9333EA" />
              <Text style={styles.aiPanelTitle}>AI Quality Analysis</Text>
            </View>
            <View style={styles.aiMetrics}>
              {[
                { label: 'Size Uniformity',  val: aiScore - 2 },
                { label: 'Freshness',        val: aiScore     },
                { label: 'Blemish-Free',     val: aiScore + 1 },
              ].map((m) => (
                <View key={m.label} style={styles.aiMetric}>
                  <View style={styles.aiMetricRow}>
                    <Text style={styles.aiMetricLabel}>{m.label}</Text>
                    <Text style={styles.aiMetricVal}>{Math.min(m.val, 99)}%</Text>
                  </View>
                  <View style={styles.aiBar}>
                    <View style={[styles.aiBarFill, { width: `${Math.min(m.val, 99)}%` }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* ── DESCRIPTION ─────────────────────────────────────────── */}
          <View style={styles.descSection}>
            <Text style={styles.descTitle}>About this product</Text>
            <Text style={styles.descText}>{product.description}</Text>
          </View>

        </View>
      </ScrollView>

      {/* ── FLOATING BOTTOM BAR ──────────────────────────────────── */}
      <View style={styles.bottomBar}>
        {/* Modern Quantity Stepper */}
        <View style={styles.stepper}>
          <TouchableOpacity
            onPress={() => setQty((q) => Math.max(1, q - 1))}
            style={[styles.stepBtn, qty <= 1 && styles.stepBtnDisabled]}
            activeOpacity={0.7}
          >
            <Feather name="minus" size={16} color={qty > 1 ? '#111827' : '#9CA3AF'} />
          </TouchableOpacity>
          
          <Text style={styles.stepQty}>
            {qty}<Text style={styles.stepUnit}>{product.unit}</Text>
          </Text>
          
          <TouchableOpacity
            onPress={() => setQty((q) => Math.min(product.availableQuantity, q + 1))}
            style={styles.stepBtn}
            activeOpacity={0.7}
          >
            <Feather name="plus" size={16} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Premium Add to Cart */}
        <Animated.View style={{ transform: [{ scale: addedAnim }], flex: 1 }}>
          <TouchableOpacity onPress={handleAddToCart} style={styles.addBtn} activeOpacity={0.88}>
            <View style={styles.addBtnLeft}>
              <Feather name="shopping-bag" size={16} color="#fff" />
              <Text style={styles.addBtnText}>Add</Text>
            </View>
            <View style={styles.addBtnRight}>
              <Text style={styles.addBtnPrice}>₨{totalPrice.toLocaleString()}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#fff' },
  scroll: { paddingBottom: 110 },

  // Carousel
  carouselWrap: { position: 'relative' },
  slide: { height: 320, alignItems: 'center', justifyContent: 'center' },
  fullImage: { width: '100%', height: '100%' },
  slideEmojiWrap: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  slideEmoji: { fontSize: 120 },
  dots: {
    position: 'absolute', bottom: 14,
    flexDirection: 'row', alignSelf: 'center', gap: 6,
  },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.2)' },
  dotActive: { width: 18, backgroundColor: Colors.primary },

  overlayActions: {
    position: 'absolute', top: Platform.OS === 'ios' ? 54 : 40,
    left: 16, right: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  overlayRight: { flexDirection: 'row', gap: 8 },
  overlayBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12, shadowRadius: 4, elevation: 3,
  },
  overlayBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: Colors.error,
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  overlayBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  // Content card
  contentCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    marginTop: -24,
    paddingHorizontal: 20, paddingTop: 26,
  },
  rowBetween: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  stockPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
  },
  stockText: { fontSize: 11, fontWeight: '700', color: Colors.success },

  // Title
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'flex-start' },
  productName: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, lineHeight: 28 },
  productSub:  { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  priceBlock:  { alignItems: 'flex-end' },
  bigPrice:    { fontSize: 26, fontWeight: '900', color: Colors.primary },
  perUnit:     { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },

  // Farmer
  farmerCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 18, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border, gap: 12,
  },
  farmerAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  farmerName:     { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 3 },
  farmerLocation: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
  stars:          { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText:     { fontSize: 11, color: Colors.textSecondary, marginLeft: 4 },
  viewProfileBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewProfileText:{ fontSize: 12, fontWeight: '700', color: Colors.primary },

  // AI Panel
  aiPanel: {
    backgroundColor: '#FAF5FF',
    borderRadius: 16, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: '#E9D5FF',
  },
  aiPanelHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  aiPanelTitle:  { fontSize: 14, fontWeight: '800', color: '#6B21A8' },
  aiMetrics: { gap: 10 },
  aiMetric:  {},
  aiMetricRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  aiMetricLabel: { fontSize: 12, color: '#7E22CE', fontWeight: '600' },
  aiMetricVal:   { fontSize: 12, color: '#7E22CE', fontWeight: '800' },
  aiBar: { height: 6, backgroundColor: '#E9D5FF', borderRadius: 3 },
  aiBarFill: { height: '100%', backgroundColor: '#9333EA', borderRadius: 3 },

  // Description
  descSection: { marginBottom: 10 },
  descTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  descText:  { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 36 : 18,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 10,
  },
  stepper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFB',
    borderWidth: 1, borderColor: '#F1F5F9',
    borderRadius: 16, height: 54, paddingHorizontal: 6,
  },
  stepBtn:  { 
    width: 36, height: 36, borderRadius: 12, 
    backgroundColor: '#fff', 
    alignItems: 'center', justifyContent: 'center', 
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 
  },
  stepBtnDisabled: { backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 },
  stepQty:  { width: 48, textAlign: 'center', fontSize: 17, fontWeight: '900', color: '#111827' },
  stepUnit: { fontSize: 11, fontWeight: '600', color: '#9CA3AF' },
  
  addBtn: {
    flex: 1, height: 54, borderRadius: 16,
    backgroundColor: '#059669', // Emerald green
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', 
    paddingHorizontal: 6, paddingLeft: 20,
    shadowColor: '#059669', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  addBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  addBtnRight: { 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: 12, paddingVertical: 10, 
    borderRadius: 12 
  },
  addBtnPrice: { color: '#fff', fontSize: 14, fontWeight: '900' },
});
