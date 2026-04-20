import React, { useCallback, useMemo, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, ScrollView, StyleSheet, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { MOCK_CROPS, MOCK_CATEGORIES } from '@/constants/mockData';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { useCartStore } from '@/store/cartStore';
import type { Crop } from '@/constants/mockData';

// ─── Promo config ──────────────────────────────────────────────────────────
const PROMOS = [
  {
    id: 'p1',
    title: 'Farm Fresh\nDirect to You',
    sub: 'No middlemen · Better prices',
    cta: 'Shop Now',
    bg: Colors.primary,
    textColor: '#fff',
    subColor: '#A7F3D0',
    ctaBg: '#fff',
    ctaText: Colors.primary,
    emoji: '🌾',
  },
  {
    id: 'p2',
    title: 'AI Quality\nGraded Crops',
    sub: '100% verified standard produce',
    cta: 'See How',
    bg: Colors.amber[500],
    textColor: '#fff',
    subColor: '#FEF3C7',
    ctaBg: '#fff',
    ctaText: Colors.amber[700],
    emoji: '🤖',
  },
];

// ─── Featured = top 4 Grade A products ─────────────────────────────────────
const FEATURED = MOCK_CROPS.filter((c) => c.quality === 'Grade A').slice(0, 4);

// ─── KeyExtractors (stable references for FlatList perf) ───────────────────
const keyExtractorCrop = (item: Crop) => item.id;

export default function BuyerHome() {
  const router = useRouter();
  const totalItems = useCartStore((s) => s.totalItems);

  const renderPromo = useCallback(
    ({ item }: { item: typeof PROMOS[0] }) => (
      <View style={[styles.promoCard, { backgroundColor: item.bg }]}>
        <View style={styles.promoEmojiCircle}>
          <Text style={styles.promoEmoji}>{item.emoji}</Text>
        </View>
        <Text style={[styles.promoTitle, { color: item.textColor }]}>{item.title}</Text>
        <Text style={[styles.promoSub, { color: item.subColor }]}>{item.sub}</Text>
        <TouchableOpacity style={[styles.promoCta, { backgroundColor: item.ctaBg }]}>
          <Text style={[styles.promoCtaText, { color: item.ctaText }]}>{item.cta}</Text>
        </TouchableOpacity>
      </View>
    ),
    [],
  );

  const renderFeatured = useCallback(
    ({ item }: { item: Crop }) => (
      <View style={styles.featuredWrap}>
        <ProductCard item={item} />
      </View>
    ),
    [],
  );

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.brand}>DigitalKisan</Text>
          </View>
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() => router.push('/(buyer)/cart')}
          >
            <Feather name="shopping-cart" size={22} color={Colors.textPrimary} />
            {totalItems > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── SEARCH BAR ─────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.8}
          onPress={() => router.push('/(buyer)/products/Grains' as any)}
        >
          <Feather name="search" size={18} color={Colors.textSecondary} />
          <Text style={styles.searchPlaceholder}>Search crops, farmers…</Text>
        </TouchableOpacity>

        {/* ── PROMO BANNER ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <FlatList
            data={PROMOS}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(p) => p.id}
            renderItem={renderPromo}
            decelerationRate="fast"
            snapToInterval={300 + 16}
            contentContainerStyle={{ paddingHorizontal: 24 }}
          />
        </View>

        {/* ── CATEGORIES ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Browse Categories</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catRow}
          >
            {MOCK_CATEGORIES.map((cat) => (
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

        {/* ── FEATURED PRODUCTS ──────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⭐ Featured Products</Text>
            <TouchableOpacity onPress={() => router.push('/(buyer)/products/Grains' as any)}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={FEATURED}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={keyExtractorCrop}
            renderItem={renderFeatured}
            contentContainerStyle={{ paddingHorizontal: 24 }}
            // FlatList perf props
            removeClippedSubviews
            initialNumToRender={4}
            maxToRenderPerBatch={4}
            windowSize={5}
          />
        </View>

        {/* ── ALL PRODUCTS GRID ──────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Fresh Produce</Text>
            <TouchableOpacity onPress={() => router.push('/(buyer)/categories' as any)}>
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.grid}>
            {MOCK_CROPS.slice(0, 6).map((crop, i) => (
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

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.background },
  scroll:  { paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 54,
    paddingBottom: 20,
  },
  greeting: { fontSize: 14, color: Colors.textSecondary, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  brand:    { fontSize: 32, fontWeight: '900', color: '#111827', marginTop: 2, letterSpacing: -1 },
  cartBtn:  {
    width: 52, height: 52,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#f8f8f8',
  },
  cartBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: Colors.error,
    paddingHorizontal: 6, minWidth: 20, height: 20,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },

  // Search
  searchBar: {
    marginHorizontal: 24, marginBottom: 32,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 20, height: 58,
    gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06, shadowRadius: 24, elevation: 6,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  searchPlaceholder: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },

  // Section
  section:        { marginBottom: 32 },
  sectionHeader:  {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24, marginBottom: 18,
  },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
  seeAll:       { fontSize: 14, fontWeight: '700', color: Colors.primary },

  // Promo
  promoCard: {
    width: 290, marginRight: 16,
    borderRadius: 28, padding: 24,
    overflow: 'hidden',
    minHeight: 180,
    justifyContent: 'flex-end',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12, shadowRadius: 24, elevation: 5,
  },
  promoEmojiCircle: {
    position: 'absolute', top: -30, right: -20,
    width: 140, height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  promoEmoji:   { fontSize: 72 },
  promoTitle:   { fontSize: 24, fontWeight: '900', lineHeight: 30, marginBottom: 8 },
  promoSub:     { fontSize: 14, marginBottom: 20, fontWeight: '500', opacity: 0.95 },
  promoCta:     { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, alignSelf: 'flex-start' },
  promoCtaText: { fontSize: 15, fontWeight: '800' },

  // Categories
  catRow:    { paddingHorizontal: 24, gap: 20, paddingBottom: 10 },
  catChip:   { alignItems: 'center', gap: 12 },
  catIconWrap: {
    width: 82, height: 82,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 3,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  catEmoji:  { fontSize: 34 },
  catLabel:  { fontSize: 12, fontWeight: '700', color: '#374151' },

  // Featured horizontal card
  featuredWrap: { width: 180, marginRight: 14 },

  // All products grid
  grid:    { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 12 },
  gridItem: { width: '47.5%' },
});
