import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import userService, { WalletData } from '@/services/user.service';
import orderService, { Order } from '@/services/order.service';
import { useAuthStore } from '@/store/authStore';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PK', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function LogisticsEarningsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);

  const [wallet, setWallet]           = useState<WalletData | null>(null);
  const [deliveries, setDeliveries]   = useState<Order[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const [walletData, orders] = await Promise.all([
        userService.getWallet(),
        orderService.getMyOrders(),
      ]);
      setWallet(walletData);
      // Logistics sees their own delivered orders
      const done = orders.filter(
        (o) => o.status === 'delivered'
      );
      setDeliveries(done);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load earnings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser?.id]);

  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

  // Stats computed from deliveries
  // Note: order.totalPrice is the agricultural order value, not the delivery fee.
  // Use wallet.totalEarned (credited by the escrow system) for accurate earnings figures.
  const monthlyDeliveries = deliveries.filter(
    (o) => new Date(o.createdAt) >= startOfMonth()
  ).length;

  const totalDeliveries = deliveries.length;

  const avgPerDelivery = totalDeliveries > 0 && wallet?.totalEarned
    ? Math.round(wallet.totalEarned / totalDeliveries)
    : 0;

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading earnings…</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Earnings</Text>
        </View>
        <View style={styles.errorBox}>
          <Feather name="wifi-off" size={40} color={Colors.textSecondary} />
          <Text style={styles.errorTitle}>{error}</Text>
          <TouchableOpacity onPress={() => fetchAll()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Earnings</Text>
        <TouchableOpacity
          onPress={() => fetchAll(true)}
          style={styles.historyBtn}
        >
          <Feather name="refresh-cw" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchAll(true)}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Balance Card */}
        <LinearGradient colors={['#1565C0', '#1976D2']} style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <View style={styles.shieldBadge}>
              <Feather name="shield" size={14} color="rgba(255,255,255,0.7)" />
            </View>
          </View>
          <Text style={styles.balanceAmount}>
            ₨ {(wallet?.availableBalance ?? 0).toLocaleString()}
          </Text>
          <View style={styles.balanceStats}>
            <View style={styles.bStat}>
              <Text style={styles.bStatVal}>₨ {(wallet?.inEscrow ?? 0).toLocaleString()}</Text>
              <Text style={styles.bStatLabel}>In Escrow</Text>
            </View>
            <View style={styles.bDivider} />
            <View style={styles.bStat}>
              <Text style={styles.bStatVal}>₨ {(wallet?.totalEarned ?? 0).toLocaleString()}</Text>
              <Text style={styles.bStatLabel}>Total Earned</Text>
            </View>
          </View>

          {/* Withdraw button */}
          <TouchableOpacity
            style={styles.withdrawBtn}
            onPress={() => router.push('/(logistics)/withdraw')}
            activeOpacity={0.85}
          >
            <Feather name="arrow-up-circle" size={16} color="#1565C0" />
            <Text style={styles.withdrawBtnText}>Withdraw Earnings</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Stat Cards */}
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
              <Feather name="calendar" size={18} color="#2563EB" />
            </View>
            <Text style={styles.statVal}>{monthlyDeliveries}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#ECFDF5' }]}>
              <Feather name="check-circle" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.statVal}>{totalDeliveries}</Text>
            <Text style={styles.statLabel}>Deliveries</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF7ED' }]}>
              <Feather name="trending-up" size={18} color="#D97706" />
            </View>
            <Text style={styles.statVal}>₨ {avgPerDelivery.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Avg / Delivery</Text>
          </View>
        </View>

        {/* Delivery History */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Delivery History</Text>
          {totalDeliveries > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{totalDeliveries}</Text>
            </View>
          )}
        </View>

        {deliveries.length === 0 ? (
          <View style={styles.emptyBox}>
            <Feather name="package" size={44} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No deliveries yet</Text>
            <Text style={styles.emptySub}>
              Completed deliveries will appear here with your earnings.
            </Text>
          </View>
        ) : (
          deliveries
            .slice()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((order) => (
              <View key={order._id} style={styles.deliveryCard}>
                <View style={styles.deliveryLeft}>
                  <View style={styles.deliveryIconBox}>
                    <Feather name="truck" size={18} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deliveryProduct} numberOfLines={1}>
                      {order.product?.title ?? 'Order'}
                    </Text>
                    <Text style={styles.deliveryRoute} numberOfLines={1}>
                      {order.farmer?.location?.address ?? order.farmer?.name ?? 'Pickup'}
                      {'  →  '}
                      {order.shippingAddress?.address ?? 'Drop-off'}
                    </Text>
                    <Text style={styles.deliveryDate}>{formatDate(order.createdAt)}</Text>
                  </View>
                </View>
                <View style={styles.deliveryRight}>
                  <View style={styles.deliveredBadge}>
                    <Feather name="check-circle" size={10} color={Colors.primary} />
                    <Text style={styles.deliveredText}>Delivered</Text>
                  </View>
                </View>
              </View>
            ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: Colors.textPrimary },
  historyBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },

  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  errorTitle: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center' },
  retryBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 12, marginTop: 8,
  },
  retryText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  scrollContent: { padding: 20 },

  balanceCard: {
    borderRadius: 24, padding: 24, marginBottom: 20,
  },
  balanceTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  shieldBadge: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  balanceAmount: { color: '#fff', fontSize: 34, fontWeight: '900', marginBottom: 20 },
  balanceStats: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18, padding: 14, marginBottom: 14,
  },
  withdrawBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12,
  },
  withdrawBtnText: { fontSize: 14, fontWeight: '900', color: '#1565C0' },
  bStat: { flex: 1, alignItems: 'center' },
  bStatVal: { color: '#fff', fontSize: 14, fontWeight: '900' },
  bStatLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '700', marginTop: 2 },
  bDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },

  statRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statVal: { fontSize: 15, fontWeight: '900', color: Colors.textPrimary, textAlign: 'center' },
  statLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '700', marginTop: 2, textAlign: 'center' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { flex: 1, fontSize: 16, fontWeight: '900', color: '#1E293B' },
  countBadge: {
    backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
  },
  countText: { fontSize: 12, fontWeight: '900', color: '#1E40AF' },

  emptyBox: {
    alignItems: 'center', padding: 40, backgroundColor: '#fff',
    borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9', gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#334155', marginTop: 4 },
  emptySub: { fontSize: 12, color: '#94A3B8', fontWeight: '600', textAlign: 'center', lineHeight: 18 },

  deliveryCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#EFF6FF',
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  deliveryLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1, marginRight: 10 },
  deliveryIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  deliveryProduct: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 3 },
  deliveryRoute: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500', marginBottom: 3 },
  deliveryDate: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  deliveryRight: { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  deliveredBadge: {
    flexDirection: 'row', gap: 4, alignItems: 'center',
    backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  deliveredText: { fontSize: 9, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase' },
});
