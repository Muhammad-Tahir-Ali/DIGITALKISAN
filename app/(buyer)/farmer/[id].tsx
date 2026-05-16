import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { SkeletonLoader } from '@/components/ui';
import { ProductCard } from '@/components/marketplace/ProductCard';
import userService, { Farmer } from '@/services/user.service';
import productService, { Product } from '@/services/product.service';

export default function FarmerProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const [farmerData, productsData] = await Promise.all([
        userService.getUserProfile(id),
        productService.getAll({ farmer: id }),
      ]);
      setFarmer(farmerData);
      setProducts(productsData);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Star renderer
  const Stars = ({ rating, count }: { rating: number; count: number }) => (
    <View style={styles.stars}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Feather
          key={i}
          name="star"
          size={14}
          color={i < Math.round(rating) ? Colors.amber[500] : Colors.border}
        />
      ))}
      <Text style={styles.ratingText}>{rating.toFixed(1)} ({count} reviews)</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Farmer Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 12 }}>
          <SkeletonLoader.Box height={100} borderRadius={16} />
          <SkeletonLoader.ProductGrid count={4} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Feather name="wifi-off" size={40} color={Colors.textSecondary} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchAll()} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchAll(true)}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                <Text style={{ fontSize: 32 }}>👨‍🌾</Text>
              </View>
              <Text style={styles.farmerName}>{farmer?.name || 'Farmer'}</Text>
              <Stars rating={farmer?.rating || 5.0} count={farmer?.ratingsQuantity || 0} />
              <View style={styles.locationRow}>
                <Feather name="map-pin" size={14} color={Colors.textSecondary} />
                <Text style={styles.locationText}>{farmer?.location?.address || 'Pakistan'}</Text>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{products.length}</Text>
                  <Text style={styles.statLabel}>Active Listings</Text>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No active listings from this farmer right now.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <ProductCard item={item} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },

  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { marginTop: 12, fontSize: 15, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: { marginTop: 16, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryBtnText: { color: '#fff', fontWeight: '800' },

  listContent: { padding: 20, paddingBottom: 60 },
  row: { gap: 12, marginBottom: 12 },
  cardWrapper: { flex: 1, maxWidth: '48%' },

  profileCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24, marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#F8FAFB',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  farmerName: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary, marginBottom: 8 },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  ratingText: { fontSize: 13, color: Colors.textSecondary, marginLeft: 4, fontWeight: '600' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  locationText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  
  statsRow: { flexDirection: 'row', width: '100%', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16 },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '900', color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', marginTop: 4 },

  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' },
});
