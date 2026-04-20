import React, { useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  FlatList, ScrollView, StyleSheet, Platform,
  StatusBar, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { MOCK_CROPS, MOCK_CATEGORIES } from '@/constants/mockData';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { useCartStore } from '@/store/cartStore';
import type { Crop } from '@/constants/mockData';

const PROMOS = [
  {
    id: 'p1',
    title: 'Farm Fresh\nDirect to You',
    sub: 'No middlemen · Best market prices',
    cta: 'Shop Now',
    emoji: '🌾',
    gradientStart: '#14532D',
    gradientEnd: '#166534',
    tag: 'UP TO 30% OFF',
  },
  {
    id: 'p2',
    title: 'AI Quality\nGraded Crops',
    sub: '100% verified premium produce',
    cta: 'See How It Works',
    emoji: '🤖',
    gradientStart: '#78350F',
    gradientEnd: '#92400E',
    tag: 'AI VERIFIED',
  },
  {
    id: 'p3',
    title: 'Secure Escrow\nPayments',
    sub: 'Your money is safe until delivery',
    cta: 'Learn More',
    emoji: '🔒',
    gradientStart: '#1E3A5F',
    gradientEnd: '#1e40af',
    tag: '100% SECURED',
  },
];

const FEATURES = MOCK_CROPS.filter(c => c.quality === 'Grade A').slice(0, 6);
const keyExtractorCrop = (item: Crop) => item.id;

export default function BuyerHome() {
  const router = useRouter();
  const totalItems = useCartStore(s => s.totalItems);
  const [promoIndex, setPromoIndex] = useState(0);

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

  const renderFeatured = useCallback(({ item }: { item: Crop }) => (
    <View style={styles.featuredWrap}>
      <ProductCard item={item} />
    </View>
  ), []);

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
            </View>
            <View>
              <Text style={styles.greeting}>Good morning 👋</Text>
              <Text style={styles.brand}>DigitalKisan</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() => router.push('/(buyer)/cart')}
            activeOpacity={0.8}
          >
            <Feather name="shopping-cart" size={20} color={Colors.textPrimary} />
            {totalItems > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── SEARCH BAR ─────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.8}
          onPress={() => router.push('/(buyer)/products/Grains' as any)}
        >
          <View style={styles.searchIcon}>
            <Feather name="search" size={16} color={Colors.primary} />
          </View>
          <Text style={styles.searchPlaceholder}>Search crops, farmers, cities…</Text>
          <View style={styles.searchFilter}>
            <Feather name="sliders" size={15} color={Colors.textSecondary} />
          </View>
        </TouchableOpacity>

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
            snapToInterval={styles.promoCard.width + 12}
            onMomentumScrollEnd={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (styles.promoCard.width + 12));
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

        {/* ── CATEGORIES ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Browse Categories</Text>
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

        {/* ── FEATURED PRODUCTS ──────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Featured Picks</Text>
              <Text style={styles.sectionSub}>Grade A · AI Verified</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(buyer)/products/Grains' as any)}
              style={styles.seeAllBtn}
            >
              <Text style={styles.seeAll}>See All</Text>
              <Feather name="arrow-right" size={13} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={FEATURES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={keyExtractorCrop}
            renderItem={renderFeatured}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            removeClippedSubviews
            initialNumToRender={4}
            maxToRenderPerBatch={4}
          />
        </View>

        {/* ── ALL PRODUCTS GRID ──────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>All Fresh Produce</Text>
              <Text style={styles.sectionSub}>Sourced from local farmers</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(buyer)/categories' as any)}
              style={styles.seeAllBtn}
            >
              <Text style={styles.seeAll}>View All</Text>
              <Feather name="arrow-right" size={13} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.grid}>
            {MOCK_CROPS.slice(0, 6).map(crop => (
              <View key={crop.id} style={styles.gridItem}>
                <ProductCard item={crop} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const SCREEN_W = Dimensions.get('window').width;
const PROMO_WIDTH = Math.min(SCREEN_W - 56, 300);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFB' },
  scroll: { paddingBottom: 48 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 16,
    backgroundColor: '#F8FAFB',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: {
    width: 44, height: 44, borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#C8E6C9',
  },
  greeting: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  brand: { fontSize: 22, fontWeight: '900', color: '#111827', letterSpacing: -0.8 },

  cartBtn: {
    width: 46, height: 46, borderRadius: 15,
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 4,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  cartBadge: {
    position: 'absolute', top: -5, right: -5,
    backgroundColor: Colors.error,
    minWidth: 18, height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#F8FAFB',
  },
  cartBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },

  // Search
  searchBar: {
    marginHorizontal: 20, marginBottom: 24, marginTop: 4,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 16, height: 54,
    gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 16, elevation: 4,
    borderWidth: 1, borderColor: '#EEF2F7',
  },
  searchIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center', justifyContent: 'center',
  },
  searchPlaceholder: { flex: 1, fontSize: 14, color: '#9CA3AF', fontWeight: '500' },
  searchFilter: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },

  // Promo
  promoSection: { marginBottom: 28 },
  promoCard: {
    width: PROMO_WIDTH,
    height: 190,
    borderRadius: 22,
    marginRight: 12,
    overflow: 'hidden',
    position: 'relative',
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
  promoContent: { padding: 18, flex: 1, justifyContent: 'flex-end' },
  promoEmojiWrap: {
    position: 'absolute', right: -10, bottom: -10,
    width: 110, height: 110,
    alignItems: 'center', justifyContent: 'center',
    opacity: 0.18,
  },
  promoTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start', marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  promoTagText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  promoTitle: { fontSize: 19, fontWeight: '900', color: '#fff', lineHeight: 24, marginBottom: 5 },
  promoSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginBottom: 14 },
  promoCta: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  promoCtaText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  promoDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 14 },
  promoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' },
  promoDotActive: { width: 20, backgroundColor: Colors.primary },

  // Section
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20, marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
  sectionSub: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500', marginTop: 2 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  seeAll: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  // Trust Badges
  trustRow: { paddingHorizontal: 20, gap: 10, paddingBottom: 4, marginBottom: 28 },
  trustBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 14,
  },
  trustLabel: { fontSize: 12, fontWeight: '700' },

  // Categories
  catRow: { paddingHorizontal: 20, gap: 16, paddingBottom: 4 },
  catChip: { alignItems: 'center', gap: 8 },
  catIconWrap: {
    width: 70, height: 70, borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  catEmoji: { fontSize: 30 },
  catLabel: { fontSize: 11, fontWeight: '700', color: '#374151', letterSpacing: 0.1 },

  // Featured / Grid
  featuredWrap: { width: 175, marginRight: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12 },
  gridItem: { width: '47.5%' },
});
