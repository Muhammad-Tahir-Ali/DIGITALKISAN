import React, { useCallback, useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  FlatList, ScrollView, StyleSheet, Platform,
  StatusBar, Dimensions, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { MOCK_CATEGORIES } from '@/constants/mockData';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { useCartStore } from '@/store/cartStore';
import productService, { Product } from '@/services/product.service';
import { useAuthStore } from '@/store/authStore';

const PROMOS = [
  {
    id: 'p1',
    title: 'Farm Fresh\nDirect to You',
    sub: 'No middlemen · Best market prices',
    cta: 'Shop Now',
    emoji: '🌾',
    gradientStart: '#114232', // Darker forest green
    gradientEnd: '#1e5128',
    tag: 'UP TO 30% OFF',
  },
  {
    id: 'p2',
    title: 'AI Quality\nGraded Crops',
    sub: '100% verified premium produce',
    cta: 'See How It Works',
    emoji: '🤖',
    gradientStart: '#451A03', // More premium amber/brown
    gradientEnd: '#78350F',
    tag: 'AI VERIFIED',
  },
  {
    id: 'p3',
    title: 'Secure Escrow\nPayments',
    sub: 'Your money is safe until delivery',
    cta: 'Learn More',
    emoji: '🔒',
    gradientStart: '#1E3A5F',
    gradientEnd: '#2D336B',
    tag: '100% SECURED',
  },
];

const RECENT_SEARCHES = ['Basmati Rice', 'Organic Wheat', 'Yellow Corn'];

export default function BuyerHome() {
  const router = useRouter();
  const totalItems = useCartStore(s => s.totalItems);
  const user = useAuthStore(s => s.user);
  const [promoIndex, setPromoIndex] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productService.getAll().then(data => {
      setProducts(data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const featured = products.slice(0, 6); // top 6 from API
  const freshlyListed = products.slice(0, 6);
  const keyExtractorProduct = (item: Product) => item._id;

  const renderPromo = useCallback(({ item }: { item: typeof PROMOS[0] }) => (
    <TouchableOpacity activeOpacity={0.92} style={styles.promoCard}>
      <LinearGradient
        colors={[item.gradientStart, item.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Decorative circles */}
      <View style={styles.promoCircle1} />
      <View style={styles.promoCircle2} />

      {/* Large emoji watermark in the background */}
      <View style={styles.promoEmojiWrap}>
        <Text style={{ fontSize: 90 }}>{item.emoji}</Text>
      </View>

      {/* Content on top */}
      <View style={styles.promoContent}>
        <View style={styles.promoTag}>
          <Text style={styles.promoTagText}>{item.tag}</Text>
        </View>
        <Text style={styles.promoTitle}>{item.title}</Text>
        <Text style={styles.promoSub}>{item.sub}</Text>
        <TouchableOpacity style={styles.promoCta}>
          <Text style={styles.promoCtaText}>{item.cta}</Text>
          <Feather name="arrow-right" size={13} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  ), []);

  const renderFeatured = useCallback(({ item }: { item: Product }) => (
    <View style={styles.featuredWrap}>
      <TouchableOpacity
        style={styles.apiProductCard}
        onPress={() => router.push(`/(buyer)/products/detail/${item._id}` as any)}
        activeOpacity={0.85}
      >
        <View style={styles.apiProductEmoji}><Text style={{ fontSize: 36 }}>🌾</Text></View>
        <Text style={styles.apiProductTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.apiProductPrice}>₨{item.pricePerUnit}/{item.unit}</Text>
        <Text style={styles.apiProductStock}>{item.availableQuantity} {item.unit} available</Text>
      </TouchableOpacity>
    </View>
  ), [router]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAF8" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ─────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarWrap}>
              <Text style={{ fontSize: 20 }}>👤</Text>
              <View style={styles.verifiedDot} />
            </View>
            <View>
              <Text style={styles.greeting}>Salaam 👋 {user?.name?.split(' ')[0] ?? ''}</Text>
              <Text style={styles.brand}>DigitalKisan</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerBtn}>
              <Feather name="bell" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerBtn, styles.cartBtn]}
              onPress={() => router.push('/(buyer)/cart')}
              activeOpacity={0.8}
            >
              <Feather name="shopping-bag" size={20} color={Colors.textPrimary} />
              {totalItems > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{totalItems}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SEARCH BAR ─────────────────────────────────────────── */}
        <View style={styles.searchSection}>
          <TouchableOpacity
            style={styles.searchBar}
            activeOpacity={0.8}
            onPress={() => router.push('/(buyer)/categories' as any)}
          >
            <Feather name="search" size={18} color={Colors.agri.sabz} />
            <Text style={styles.searchPlaceholder}>Search crops, farmers or cities…</Text>
            <View style={styles.searchFilter}>
              <Feather name="sliders" size={16} color={Colors.textPrimary} />
            </View>
          </TouchableOpacity>

          {/* Recent Searches Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
            <Text style={styles.recentLabel}>Trends:</Text>
            {RECENT_SEARCHES.map((txt) => (
              <TouchableOpacity key={txt} style={styles.recentChip}>
                <Text style={styles.recentText}>{txt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── PROMO BANNERS ───────────────────────────────────────── */}
        <View style={styles.promoSection}>
          <FlatList
            data={PROMOS}
            horizontal
            pagingEnabled={false}
            showsHorizontalScrollIndicator={false}
            keyExtractor={p => p.id}
            renderItem={renderPromo}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            decelerationRate="fast"
            snapToInterval={PROMO_WIDTH + 14}
            onMomentumScrollEnd={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (PROMO_WIDTH + 14));
              setPromoIndex(idx);
            }}
          />
          {/* Pagination dots */}
          <View style={styles.promoDots}>
            {PROMOS.map((_, i) => (
              <View key={i} style={[styles.promoDot, i === promoIndex && styles.promoDotActive]} />
            ))}
          </View>
        </View>

        {/* ── TRUST BADGES ───────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trustRow}
        >
          {[
            { icon: 'shield', label: 'Escrow Safe', color: '#059669', bg: '#D1FAE5' },
            { icon: 'cpu', label: 'AI Graded', color: '#7C3AED', bg: '#EDE9FE' },
            { icon: 'truck', label: 'Fast Delivery', color: '#2563EB', bg: '#DBEAFE' },
            { icon: 'star', label: 'Farmer Rated', color: '#D97706', bg: '#FEF3C7' },
          ].map(badge => (
            <View key={badge.label} style={[styles.trustBadge, { backgroundColor: badge.bg }]}>
              <Feather name={badge.icon as any} size={14} color={badge.color} />
              <Text style={[styles.trustLabel, { color: badge.color }]}>{badge.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* ── CATEGORIES ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Essential Categories</Text>
            <TouchableOpacity onPress={() => router.push('/(buyer)/categories' as any)}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catRow}
          >
            {MOCK_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={styles.catChip}
                onPress={() => router.push(`/(buyer)/products/${cat.name}` as any)}
                activeOpacity={0.75}
              >
                <View style={styles.catIconWrap}>
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                </View>
                <Text style={styles.catLabel}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── FEATURED PRODUCTS ──────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Featured Quality</Text>
              <Text style={styles.sectionSub}>Live Market · Real Farmers</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(buyer)/categories' as any)}
              style={styles.seeAllBtn}
            >
              <Text style={styles.seeAll}>See All</Text>
              <Feather name="arrow-right" size={13} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : (
            <FlatList
              data={featured}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={keyExtractorProduct}
              renderItem={renderFeatured}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              ListEmptyComponent={
                <Text style={{ paddingHorizontal: 24, color: Colors.textSecondary }}>No products yet.</Text>
              }
            />
          )}
        </View>

        {/* ── RECENTLY LISTED ──────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Freshly Listed</Text>
              <Text style={styles.sectionSub}>Available from nearby districts</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(buyer)/categories' as any)}
              style={styles.seeAllBtn}
            >
              <Text style={styles.seeAll}>View All</Text>
              <Feather name="arrow-right" size={13} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : (
            <View style={styles.grid}>
              {freshlyListed.map(item => (
                <TouchableOpacity
                  key={item._id}
                  style={styles.gridItem}
                  onPress={() => router.push(`/(buyer)/products/detail/${item._id}` as any)}
                  activeOpacity={0.85}
                >
                  <View style={styles.apiProductCard}>
                    <View style={styles.apiProductEmoji}><Text style={{ fontSize: 36 }}>🌾</Text></View>
                    <Text style={styles.apiProductTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.apiProductPrice}>₨{item.pricePerUnit}/{item.unit}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Text style={{ fontSize: 10, color: '#F59E0B' }}>★</Text>
                      <Text style={{ fontSize: 10, color: Colors.textSecondary }}>{item.rating} · {item.availableQuantity} {item.unit}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              {freshlyListed.length === 0 && (
                <Text style={{ paddingLeft: 4, color: Colors.textSecondary }}>No products available.</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const SCREEN_W = Dimensions.get('window').width;
const PROMO_WIDTH = Math.min(SCREEN_W - 60, 320);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFB' },
  scroll: { paddingBottom: 60 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    backgroundColor: '#F8FAFB',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#F1F5F9',
    position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 5, elevation: 1,
  },
  verifiedDot: {
    position: 'absolute', bottom: -2, right: -2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#10B981', borderWidth: 2, borderColor: '#F8FAFB',
  },
  greeting: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  brand: { fontSize: 24, fontWeight: '900', color: '#111827', letterSpacing: -1 },

  headerRight: { flexDirection: 'row', gap: 10 },
  headerBtn: {
    width: 46, height: 46, borderRadius: 15,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cartBtn: { position: 'relative' },
  cartBadge: {
    position: 'absolute', top: -5, right: -5,
    backgroundColor: Colors.error, minWidth: 18, height: 18,
    paddingHorizontal: 4, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#F8FAFB',
  },
  cartBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },

  // Search Section
  searchSection: { paddingHorizontal: 24, marginBottom: 28 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: 16, height: 58, gap: 12,
    borderWidth: 1, borderColor: '#EEF2F7',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 3,
  },
  searchPlaceholder: { flex: 1, fontSize: 14, color: '#9CA3AF', fontWeight: '500' },
  searchFilter: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center',
  },
  recentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 8 },
  recentLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginRight: 4 },
  recentChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    backgroundColor: '#E2E8F0', marginRight: 8,
  },
  recentText: { fontSize: 12, fontWeight: '700', color: '#475569' },

  // Promo
  promoSection: { marginBottom: 28 },
  promoCard: {
    width: PROMO_WIDTH, height: 200, borderRadius: 24,
    marginRight: 14, overflow: 'hidden', position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 6,
  },
  promoCircle1: {
    position: 'absolute', top: -40, right: -30,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  promoCircle2: {
    position: 'absolute', top: 30, right: 50,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  promoContent: { padding: 20, flex: 1, justifyContent: 'flex-end' },
  promoEmojiWrap: {
    position: 'absolute', right: -10, bottom: -10,
    width: 110, height: 110, alignItems: 'center', justifyContent: 'center',
    opacity: 0.18,
  },
  promoTag: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start', marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  promoTagText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  promoTitle: { fontSize: 21, fontWeight: '900', color: '#fff', lineHeight: 26, marginBottom: 6 },
  promoSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginBottom: 16 },
  promoCta: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 12, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  promoCtaText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  promoDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 14 },
  promoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' },
  promoDotActive: { width: 22, backgroundColor: Colors.agri.sabz },

  // Trust Badges
  trustRow: { paddingHorizontal: 24, gap: 10, paddingBottom: 4, marginBottom: 32 },
  trustBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14,
  },
  trustLabel: { fontSize: 12, fontWeight: '800' },

  // Section
  section: { marginBottom: 32 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingHorizontal: 24, marginBottom: 18,
  },
  sectionTitle: { fontSize: 19, fontWeight: '900', color: '#111827', letterSpacing: -0.5 },
  sectionSub: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500', marginTop: 2 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  seeAll: { fontSize: 13, fontWeight: '800', color: Colors.agri.sabz },

  // Categories
  catRow: { paddingHorizontal: 24, gap: 16, paddingBottom: 4 },
  catChip: { alignItems: 'center', gap: 10 },
  catIconWrap: {
    width: 74, height: 74, borderRadius: 24, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  catEmoji: { fontSize: 32 },
  catLabel: { fontSize: 12, fontWeight: '800', color: '#475569' },

  // Featured / Grid
  featuredWrap: { width: 180, marginRight: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 14 },
  gridItem: { width: (SCREEN_W - 62) / 2 },

  // API Product Cards
  apiProductCard: {
    backgroundColor: '#fff',
    borderRadius: 20, padding: 14,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  apiProductEmoji: {
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  apiProductTitle: { fontSize: 13, fontWeight: '800', color: '#111827', marginBottom: 4 },
  apiProductPrice: { fontSize: 15, fontWeight: '900', color: Colors.primary, marginBottom: 2 },
  apiProductStock: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary },
});
