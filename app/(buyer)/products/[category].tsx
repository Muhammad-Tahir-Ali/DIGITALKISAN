import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, SlidersHorizontal, Leaf } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { SkeletonLoader } from '@/components/ui';
import productService, { Product } from '@/services/product.service';
import { ProductCard } from '@/components/marketplace/ProductCard';

// ─── Filter config ───────────────────────────────────────────────────────────
type SortKey = 'default' | 'price_asc' | 'price_desc' | 'rating';
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'default',    label: 'Recommended' },
  { key: 'price_asc',  label: 'Price ↑' },
  { key: 'price_desc', label: 'Price ↓' },
  { key: 'rating',     label: 'Top Rated' },
];

const keyExtractor = (item: Product) => item._id;

// Defined outside the screen so React never unmounts it on sort state changes
function FilterPanel({ sort, setSort }: { sort: SortKey; setSort: (k: SortKey) => void }) {
  return (
    <View style={styles.filterPanel}>
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
    </View>
  );
}

export default function CategoryProductsScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('default');
  const [showPanel, setShowPanel] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: Record<string, string | number> = {};
      if (category && category !== 'All') {
        filters.category = category;
      }
      const data = await productService.getAll(filters);
      setProducts(data);
    } catch (e: any) {
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (sort === 'price_asc')  list.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
    if (sort === 'price_desc') list.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
    if (sort === 'rating')     list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return list;
  }, [products, sort]);

  const renderItem = useCallback(
    ({ item }: { item: Product }) => <ProductCard item={item} />,
    [],
  );

  return (
    <View style={styles.root}>
      {/* ── HEADER ── */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{category || 'All'} Products</Text>
        <TouchableOpacity onPress={() => setShowPanel(v => !v)} style={[styles.filterBtn, showPanel && styles.filterBtnActive]}>
          <SlidersHorizontal size={18} color={showPanel ? '#fff' : Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ── FILTER PANEL ── */}
      {showPanel && <FilterPanel sort={sort} setSort={setSort} />}

      {/* ── RESULTS COUNT ── */}
      {!loading && (
        <View style={styles.resultsRow}>
          <Text style={styles.resultsText}>{filtered.length} products found</Text>
        </View>
      )}

      {/* ── STATES ── */}
      {loading ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <SkeletonLoader.ProductGrid count={6} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Leaf size={48} color={Colors.textTertiary} strokeWidth={1} />
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptySub}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={fetchProducts}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          numColumns={2}
          renderItem={renderItem}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Leaf size={48} color={Colors.textTertiary} strokeWidth={1} />
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySub}>No listings yet in "{category}". Check back soon!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center',
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
  title: { flex: 1, fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  filterBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.green[100],
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 10,
  },
  filterBtnActive: { backgroundColor: Colors.primary },

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
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },

  resultsRow: { paddingHorizontal: 20, paddingVertical: 10 },
  resultsText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 16 },
  listContent: { paddingTop: 8, paddingBottom: 60, gap: 12 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginTop: 16, marginBottom: 4 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    marginTop: 20, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 12, backgroundColor: Colors.primary,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
