import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { SkeletonLoader, LazyImage } from '@/components/ui';
import productService, { Product } from '@/services/product.service';
import { useAuthStore } from '@/store/authStore';
import authService from '@/services/auth.service';

const FILTER_TABS = ['All', 'Active', 'Low Stock', 'Out of Stock'];
const CATEGORIES = ['All', 'grains', 'vegetables', 'fruits', 'dairy', 'livestock', 'other'];

export default function MyProductsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [activeTab, setActiveTab] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [statusChecking, setStatusChecking] = useState(false);
  const lastFetchRef = useRef<number>(0);

  const fetchProducts = useCallback(async (isRefresh = false) => {
    const now = Date.now();
    if (!isRefresh && lastFetchRef.current > 0 && now - lastFetchRef.current < 30_000) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await productService.getMyProducts();
      setProducts(data);
      lastFetchRef.current = Date.now();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { fetchProducts(); }, [fetchProducts])
  );

  const handleRetryAI = async (id: string) => {
    setRetryingId(id);
    try {
      const updated = await productService.retryAI(id);
      setProducts(prev => prev.map(p => p._id === id ? { ...p, ...updated } : p));
      Alert.alert('AI Grading Restarted', 'You will be notified when grading is finished.');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Could not retry AI grading. Please try again.';
      Alert.alert('Retry Failed', msg);
    } finally {
      setRetryingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const doDelete = async () => {
      try {
        await productService.delete(id);
        setProducts(prev => prev.filter(p => p._id !== id));
      } catch {
        Alert.alert('Error', 'Could not delete product. Please try again.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure? This will hide the product.')) doDelete();
    } else {
      Alert.alert('Delete Product', 'Are you sure? This will hide the product.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const getFilteredProducts = () => {
    let filtered = products;
    if (activeTab === 'Active') filtered = filtered.filter(p => p.status === 'active' && p.availableQuantity > 0);
    else if (activeTab === 'Low Stock') filtered = filtered.filter(p => p.availableQuantity > 0 && p.availableQuantity <= 50);
    else if (activeTab === 'Out of Stock') filtered = filtered.filter(p => p.availableQuantity === 0 || p.status === 'sold_out');
    if (activeCategory !== 'All') filtered = filtered.filter(p => p.category === activeCategory);
    return filtered;
  };

  const renderProductCard = ({ item }: { item: Product }) => {
    const isOut = item.availableQuantity === 0 || item.status === 'sold_out';
    const isLow = item.availableQuantity > 0 && item.availableQuantity <= 50;
    const isHidden = item.status === 'hidden';
    const isAiFailed = item.status === 'ai_failed';
    const isRetrying = retryingId === item._id;

    return (
      <View style={[styles.card, isHidden && styles.cardHidden, isAiFailed && styles.cardFailed]}>
        <View style={styles.cardRow}>
          <View style={[styles.thumb, isHidden && styles.thumbHidden]}>
            {item.images && item.images.length > 0 ? (
              <LazyImage uri={item.images[0]} style={styles.thumbImage} fallback={<Text style={styles.thumbEmoji}>🌾</Text>} />
            ) : (
              <Text style={styles.thumbEmoji}>🌾</Text>
            )}
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardTitleBlock}>
                <Text style={[styles.productName, isHidden && styles.productNameHidden]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.productPrice}>
                  ₨{item.pricePerUnit}
                  <Text style={styles.productUnit}>/{item.unit}</Text>
                </Text>
              </View>
              {item.status === 'pending_ai' && (
                <View style={styles.badgePending}>
                  <Text style={styles.badgePendingText}>AI ⏳</Text>
                </View>
              )}
              {item.status === 'ai_failed' && (
                <View style={styles.badgeFailed}>
                  <Text style={styles.badgeFailedText}>AI Failed ⚠️</Text>
                </View>
              )}
              {item.status === 'rejected' && (
                <View style={styles.badgeRejected}>
                  <Text style={styles.badgeRejectedText}>Rejected ❌</Text>
                </View>
              )}
              {item.status === 'active' && item.aiGrade && item.aiGrade !== 'N/A' && (
                <View style={[
                  styles.badgeGrade,
                  item.aiGrade === 'Grade A' ? styles.badgeGradeA
                    : item.aiGrade === 'Grade B' ? styles.badgeGradeB
                    : styles.badgeGradeC,
                ]}>
                  <Text style={[
                    styles.badgeGradeText,
                    item.aiGrade === 'Grade A' ? styles.badgeGradeTextA
                      : item.aiGrade === 'Grade B' ? styles.badgeGradeTextB
                      : styles.badgeGradeTextC,
                  ]}>
                    {item.aiGrade === 'Grade A' ? '★ Premium' : item.aiGrade === 'Grade B' ? '★ Standard' : '★ Low'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.tagRow}>
              <View style={[
                styles.stockTag,
                isOut ? styles.stockTagOut : isLow ? styles.stockTagLow : styles.stockTagOk,
              ]}>
                <Text style={[
                  styles.stockTagText,
                  isOut ? styles.stockTagTextOut : isLow ? styles.stockTagTextLow : styles.stockTagTextOk,
                ]}>
                  Stock: {item.availableQuantity} {item.unit}
                </Text>
              </View>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{item.category}</Text>
              </View>
            </View>
          </View>
        </View>

        {isAiFailed && (
          <View style={styles.failedBanner}>
            <View style={styles.failedBannerHeader}>
              <Feather name="alert-triangle" size={14} color="#B45309" />
              <Text style={styles.failedBannerTitle}>AI grading failed — not listed yet</Text>
            </View>
            {item.aiError ? (
              <Text style={styles.failedBannerReason} numberOfLines={2}>
                Reason: {item.aiError}
              </Text>
            ) : null}
            <TouchableOpacity
              style={[styles.retryAiBtn, isRetrying && { opacity: 0.6 }]}
              onPress={() => handleRetryAI(item._id)}
              disabled={isRetrying}
            >
              <Feather name="refresh-cw" size={14} color="#fff" />
              <Text style={styles.retryAiBtnText}>{isRetrying ? 'Retrying…' : 'Try Again'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.ratingRow}>
            <Feather name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingText}>{item.rating} ({item.ratingsQuantity} reviews)</Text>
          </View>
          <View style={styles.actionBtns}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push({ pathname: '/(farmer)/products/add' as any, params: { productId: item._id } })}
            >
              <Feather name="edit-2" size={14} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
              <Feather name="trash-2" size={14} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const filteredProducts = getFilteredProducts();

  // ── Pending / Rejected guard ──────────────────────────────────────────────
  const checkApprovalStatus = async () => {
    setStatusChecking(true);
    try {
      const fresh = await authService.me();
      setUser(fresh);
    } catch {
      Alert.alert('Error', 'Could not refresh status. Please try again.');
    } finally {
      setStatusChecking(false);
    }
  };

  if (user?.docReviewStatus === 'pending_review') {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top }]}>
        <View style={styles.pendingIconWrap}>
          <Feather name="clock" size={48} color="#D97706" />
        </View>
        <Text style={styles.pendingTitle}>Account Under Review</Text>
        <Text style={styles.pendingDesc}>
          Your documents are being reviewed by our team. You'll be able to list products once approved (usually within 24–48 hours).
        </Text>
        <TouchableOpacity
          style={[styles.pendingRefreshBtn, statusChecking && { opacity: 0.6 }]}
          onPress={checkApprovalStatus}
          disabled={statusChecking}
        >
          {statusChecking
            ? <ActivityIndicator color="#fff" size="small" />
            : <><Feather name="refresh-cw" size={16} color="#fff" /><Text style={styles.pendingRefreshBtnText}>Check Status</Text></>
          }
        </TouchableOpacity>
      </View>
    );
  }

  if (user?.docReviewStatus === 'rejected') {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top }]}>
        <View style={[styles.pendingIconWrap, { backgroundColor: '#FEE2E2' }]}>
          <Feather name="x-circle" size={48} color="#DC2626" />
        </View>
        <Text style={[styles.pendingTitle, { color: '#DC2626' }]}>Documents Rejected</Text>
        <Text style={styles.pendingDesc}>
          {user.docReviewNote
            ? `Reason: ${user.docReviewNote}`
            : 'Your documents were rejected. Please re-submit clear, readable photos.'}
        </Text>
        <TouchableOpacity
          style={[styles.pendingRefreshBtn, { backgroundColor: '#DC2626' }]}
          onPress={() => router.push('/(farmer)/resubmit-docs' as any)}
        >
          <Feather name="upload" size={16} color="#fff" />
          <Text style={styles.pendingRefreshBtnText}>Re-submit Documents</Text>
        </TouchableOpacity>
      </View>
    );
  }
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>My Products</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        {FILTER_TABS.map(tab => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tabItem}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Chips */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={c => c}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipList}
        renderItem={({ item: cat }) => (
          <TouchableOpacity
            onPress={() => setActiveCategory(cat)}
            style={[styles.chip, activeCategory === cat && styles.chipActive]}
          >
            <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        )}
        style={styles.chipContainer}
      />

      {loading ? (
        <View style={styles.skeletonWrap}>
          <SkeletonLoader.ProductGrid count={4} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Feather name="wifi-off" size={32} color={Colors.textSecondary} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchProducts()} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item._id}
          renderItem={renderProductCard}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchProducts(true)} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptyDesc}>You haven't listed any items that match this criteria.</Text>
              <TouchableOpacity
                onPress={() => router.push('/(farmer)/products/add' as any)}
                style={styles.emptyBtn}
              >
                <Text style={styles.emptyBtnText}>Add Your First Product</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <TouchableOpacity
        onPress={() => router.push('/(farmer)/products/add' as any)}
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
      >
        <Feather name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  headerRow: {
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4,
  },
  heading: { fontSize: 28, fontWeight: '900', color: Colors.textPrimary },

  tabBar: {
    flexDirection: 'row', paddingHorizontal: 24,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: Colors.surface,
  },
  tabItem: { marginRight: 24, paddingVertical: 12, position: 'relative' },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },
  tabIndicator: {
    position: 'absolute', bottom: -1, left: 0, right: 0,
    height: 2, backgroundColor: Colors.primary, borderRadius: 2,
  },

  chipContainer: { maxHeight: 48, backgroundColor: Colors.surface },
  chipList: { paddingHorizontal: 24, paddingVertical: 8, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, textTransform: 'capitalize' },
  chipTextActive: { color: '#fff' },

  skeletonWrap: { paddingHorizontal: 24, paddingTop: 16 },

  list: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 100 },

  card: {
    backgroundColor: Colors.surface, borderRadius: 20, marginBottom: 12,
    borderWidth: 1, borderColor: '#F1F5F9', padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  cardHidden: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  cardFailed: { borderColor: '#FDBA74', borderWidth: 1.5 },

  failedBanner: {
    marginTop: 12,
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    borderWidth: 1, borderColor: '#FED7AA',
  },
  failedBannerHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  failedBannerTitle: { fontSize: 12, fontWeight: '800', color: '#9A3412' },
  failedBannerReason: { fontSize: 11, color: '#9A3412', marginBottom: 8, lineHeight: 16 },
  retryAiBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#C2410C',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  retryAiBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  cardRow: { flexDirection: 'row', gap: 12 },
  thumb: {
    width: 72, height: 72, borderRadius: 14,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  thumbHidden: { backgroundColor: '#F3F4F6' },
  thumbImage: { width: '100%', height: '100%' },
  thumbEmoji: { fontSize: 32 },

  cardBody: { flex: 1, justifyContent: 'space-between' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitleBlock: { flex: 1, paddingRight: 8 },
  productName: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, marginBottom: 2 },
  productNameHidden: { color: '#9CA3AF' },
  productPrice: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  productUnit: { fontSize: 10, fontWeight: '500', color: Colors.textSecondary },

  badgePending: { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  badgePendingText: { fontSize: 9, fontWeight: '800', color: '#92400E' },
  badgeFailed: { backgroundColor: '#FFEDD5', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  badgeFailedText: { fontSize: 9, fontWeight: '800', color: '#9A3412' },
  badgeRejected: { backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  badgeRejectedText: { fontSize: 9, fontWeight: '800', color: '#991B1B' },
  badgeGrade: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  badgeGradeA: { backgroundColor: '#F3E8FF', borderColor: '#D8B4FE' },
  badgeGradeB: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  badgeGradeC: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' },
  badgeGradeText: { fontSize: 9, fontWeight: '800' },
  badgeGradeTextA: { color: '#7E22CE' },
  badgeGradeTextB: { color: '#15803D' },
  badgeGradeTextC: { color: '#C2410C' },

  tagRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  stockTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  stockTagOk: { backgroundColor: '#F3F4F6' },
  stockTagLow: { backgroundColor: Colors.warningLight },
  stockTagOut: { backgroundColor: Colors.errorLight },
  stockTagText: { fontSize: 10, fontWeight: '700' },
  stockTagTextOk: { color: Colors.textSecondary },
  stockTagTextLow: { color: '#92400E' },
  stockTagTextOut: { color: Colors.error },
  categoryTag: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  categoryTagText: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, textTransform: 'capitalize' },

  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  actionBtns: {
    flexDirection: 'row', borderWidth: 1, borderColor: '#F1F5F9',
    borderRadius: 10, overflow: 'hidden', backgroundColor: '#F9FAFB',
  },
  editBtn: { padding: 8, borderRightWidth: 1, borderRightColor: '#F1F5F9', backgroundColor: Colors.surface },
  deleteBtn: { padding: 8, backgroundColor: Colors.surface },

  pendingIconWrap: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  pendingTitle: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary, marginBottom: 10, textAlign: 'center' },
  pendingDesc: {
    fontSize: 14, color: Colors.textSecondary, textAlign: 'center',
    lineHeight: 21, marginBottom: 28, paddingHorizontal: 32,
  },
  pendingRefreshBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 14,
  },
  pendingRefreshBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  errorText: { color: Colors.textSecondary, fontWeight: '700', textAlign: 'center', marginTop: 12, marginBottom: 16 },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryBtnText: { color: '#fff', fontWeight: '800' },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 56, marginBottom: 16, opacity: 0.5 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  emptyBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  emptyBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  fab: {
    position: 'absolute', right: 24,
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    elevation: 5, shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
});
