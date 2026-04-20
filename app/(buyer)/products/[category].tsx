import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  ScrollView, StyleSheet, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { MOCK_CROPS } from '@/constants/mockData';
import { ProductCard } from '@/components/marketplace/ProductCard';
import type { Crop, AIGrade } from '@/constants/mockData';

// ─── Filter config ──────────────────────────────────────────────────────────
type SortKey = 'default' | 'price_asc' | 'price_desc' | 'rating';
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'default',    label: 'Recommended' },
  { key: 'price_asc',  label: 'Price ↑' },
  { key: 'price_desc', label: 'Price ↓' },
  { key: 'rating',     label: 'Top Rated' },
];
const GRADE_OPTIONS: { grade: AIGrade | 'All'; label: string }[] = [
  { grade: 'All',     label: 'All Grades' },
  { grade: 'Grade A', label: '🟣 Premium' },
  { grade: 'Grade B', label: '🟢 Standard' },
  { grade: 'Grade C', label: '🟠 Low' },
];
const MAX_PRICE = 400;
const MAX_DIST  = 200;

// ─── Key extractor (stable) ─────────────────────────────────────────────────
const keyExtractor = (item: Crop, idx: number) => `${item.id}-${idx}`;

export default function CategoryProductsScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();

  // ── Filter state
  const [sort,      setSort]      = useState<SortKey>('default');
  const [grade,     setGrade]     = useState<AIGrade | 'All'>('All');
  const [maxPrice,  setMaxPrice]  = useState(MAX_PRICE);
  const [maxDist,   setMaxDist]   = useState(MAX_DIST);
  const [showPanel, setShowPanel] = useState(false);

  // ── Derived list (memoised for perf)
  const filtered = useMemo(() => {
    let list = [...MOCK_CROPS];

    // Category filter
    if (category && category !== 'All') {
      list = list.filter((c) => c.category === category);
    }
    // Grade filter
    if (grade !== 'All') {
      list = list.filter((c) => c.quality === grade);
    }
    // Price filter
    list = list.filter((c) => c.price <= maxPrice);
    // Distance filter
    list = list.filter((c) => c.distanceKm <= maxDist);
    // Sort
    if (sort === 'price_asc')  list.sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') list.sort((a, b) => b.price - a.price);
    if (sort === 'rating')     list.sort((a, b) => b.farmerRating - a.farmerRating);

    return list;
  }, [category, grade, maxPrice, maxDist, sort]);

  const renderItem = useCallback(
    ({ item }: { item: Crop }) => <ProductCard item={item} />,
    [],
  );

  // ─── Filter panel ─────────────────────────────────────────────────────────
  const FilterPanel = () => (
    <View style={styles.filterPanel}>
      {/* Sort */}
      <Text style={styles.filterLabel}>Sort by</Text>
      <View style={styles.chipRow}>
        {SORT_OPTIONS.map((o) => (
          <TouchableOpacity
            key={o.key}
            onPress={() => setSort(o.key)}
            style={[styles.chip, sort === o.key && styles.chipActive]}
          >
            <Text style={[styles.chipText, sort === o.key && styles.chipTextActive]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Grade */}
      <Text style={[styles.filterLabel, { marginTop: 14 }]}>AI Quality Grade</Text>
      <View style={styles.chipRow}>
        {GRADE_OPTIONS.map((o) => (
          <TouchableOpacity
            key={o.grade}
            onPress={() => setGrade(o.grade)}
            style={[styles.chip, grade === o.grade && styles.chipActive]}
          >
            <Text style={[styles.chipText, grade === o.grade && styles.chipTextActive]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Price range */}
      <View style={styles.sliderRow}>
        <Text style={styles.filterLabel}>Max Price</Text>
        <Text style={styles.sliderValue}>₨{maxPrice}/kg</Text>
      </View>
      <View style={styles.sliderTrack}>
        <View style={[styles.sliderFill, { width: `${(maxPrice / MAX_PRICE) * 100}%` }]} />
        <View style={[styles.sliderThumb, { left: `${(maxPrice / MAX_PRICE) * 95}%` as any }]} />
      </View>
      <View style={styles.sliderSteps}>
        {[80, 150, 250, 400].map((v) => (
          <TouchableOpacity key={v} onPress={() => setMaxPrice(v)} style={styles.sliderStep}>
            <Text style={[styles.sliderStepText, maxPrice === v && { color: Colors.primary, fontWeight: '700' }]}>
              ₨{v}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Distance */}
      <View style={styles.sliderRow}>
        <Text style={styles.filterLabel}>Max Distance</Text>
        <Text style={styles.sliderValue}>{maxDist} km</Text>
      </View>
      <View style={styles.sliderTrack}>
        <View style={[styles.sliderFill, { width: `${(maxDist / MAX_DIST) * 100}%` }]} />
        <View style={[styles.sliderThumb, { left: `${(maxDist / MAX_DIST) * 95}%` as any }]} />
      </View>
      <View style={styles.sliderSteps}>
        {[25, 50, 100, 200].map((v) => (
          <TouchableOpacity key={v} onPress={() => setMaxDist(v)} style={styles.sliderStep}>
            <Text style={[styles.sliderStepText, maxDist === v && { color: Colors.primary, fontWeight: '700' }]}>
              {v}km
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={() => { setGrade('All'); setSort('default'); setMaxPrice(MAX_PRICE); setMaxDist(MAX_DIST); }}
        style={styles.resetBtn}
      >
        <Text style={styles.resetText}>Reset Filters</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.root}>
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{category || 'All'} Products</Text>
        <TouchableOpacity onPress={() => setShowPanel((v) => !v)} style={styles.filterBtn}>
          <Feather name="sliders" size={18} color={showPanel ? '#fff' : Colors.textPrimary} />
          {(grade !== 'All' || sort !== 'default' || maxPrice < MAX_PRICE || maxDist < MAX_DIST) && (
            <View style={styles.filterDot} />
          )}
        </TouchableOpacity>
      </View>

      {/* ── FILTER PANEL (collapsible) ──────────────────────────────── */}
      {showPanel && <FilterPanel />}

      {/* ── RESULTS COUNT ──────────────────────────────────────────── */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>{filtered.length} products found</Text>
      </View>

      {/* ── PRODUCT GRID ───────────────────────────────────────────── */}
      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        numColumns={2}
        renderItem={renderItem}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        // ── Perf props
        removeClippedSubviews
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
        getItemLayout={(_, index) => ({
          length: 240,
          offset: 240 * Math.floor(index / 2),
          index,
        })}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 60, marginBottom: 12 }}>🌱</Text>
            <Text style={styles.emptyTitle}>No products match</Text>
            <Text style={styles.emptySub}>Try adjusting your filters</Text>
          </View>
        }
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingHorizontal: 20, paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    flex: 1, fontSize: 18, fontWeight: '800', color: Colors.textPrimary,
  },
  filterBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.green[100],
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 10,
  },
  filterDot: {
    position: 'absolute', top: 5, right: 5,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.error,
  },

  // Filter panel
  filterPanel: {
    backgroundColor: '#fff',
    paddingHorizontal: 20, paddingVertical: 18,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  filterLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:   { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },

  sliderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 8 },
  sliderValue: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  sliderTrack: {
    height: 6, backgroundColor: Colors.border,
    borderRadius: 3, position: 'relative',
    justifyContent: 'center',
  },
  sliderFill:  { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  sliderThumb: {
    position: 'absolute',
    width: 20, height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 3, borderColor: Colors.primary,
    top: -7,
  },
  sliderSteps:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  sliderStep:     { alignItems: 'center' },
  sliderStepText: { fontSize: 11, color: Colors.textSecondary },
  resetBtn: {
    marginTop: 16, padding: 10,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.error,
    alignItems: 'center',
  },
  resetText: { color: Colors.error, fontWeight: '700', fontSize: 13 },

  // List
  resultsRow: { paddingHorizontal: 20, paddingVertical: 10 },
  resultsText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 16 },
  listContent: { paddingTop: 8, paddingBottom: 60, gap: 12 },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  emptySub:   { fontSize: 14, color: Colors.textSecondary },
});
