import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { SkeletonLoader } from '@/components/ui';
import orderService, { Order, OrderStatus as ApiOrderStatus } from '@/services/order.service';

type OrderStatus = 'Active' | 'Delivered' | 'Cancelled';

const STATUS_CONFIG = {
  Active: { text: '#92400E', bg: '#FEF3C7', dot: '#F59E0B', icon: 'clock' },
  Delivered: { text: '#065F46', bg: '#D1FAE5', dot: '#10B981', icon: 'check-circle' },
  Cancelled: { text: '#991B1B', bg: '#FEE2E2', dot: '#EF4444', icon: 'x-circle' },
};



function EmptyOrders({ tab }: { tab: string }) {
  const icons = { Active: '📦', Delivered: '✅', Cancelled: '❌' };
  const msgs = {
    Active: "No active orders right now.\nBrowse fresh produce and place your first order!",
    Delivered: "No delivered orders yet.\nYour completed orders will appear here.",
    Cancelled: "No cancelled orders. Great news!",
  };

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Text style={{ fontSize: 44 }}>{icons[tab as keyof typeof icons] ?? '📭'}</Text>
      </View>
      <Text style={styles.emptyTitle}>Nothing here yet</Text>
      <Text style={styles.emptyMsg}>{msgs[tab as keyof typeof msgs] ?? ''}</Text>
    </View>
  );
}

// Map backend status → UI tab
const toUiStatus = (status: ApiOrderStatus): OrderStatus => {
  if (status === 'delivered') return 'Delivered';
  if (status === 'cancelled') return 'Cancelled';
  return 'Active'; // pending, paid, bidding, in_transit, disputed
};

export default function BuyerOrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<OrderStatus>('Active');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const counts = {
    Active: orders.filter(o => toUiStatus(o.status) === 'Active').length,
    Delivered: orders.filter(o => toUiStatus(o.status) === 'Delivered').length,
    Cancelled: orders.filter(o => toUiStatus(o.status) === 'Cancelled').length,
  };

  const filtered = orders.filter(o => toUiStatus(o.status) === activeTab);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.heading}>My Orders</Text>
          <Text style={styles.subheading}>Track and manage your purchases</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Feather name="bell" size={18} color={Colors.textPrimary} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['Active', 'Delivered', 'Cancelled'] as OrderStatus[]).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
            {counts[tab] > 0 && (
              <View style={[styles.tabBadge, activeTab === tab && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === tab && styles.tabBadgeTextActive]}>
                  {counts[tab]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Loading */}
      {loading && (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <SkeletonLoader.OrderList count={5} />
        </View>
      )}

      {/* Error */}
      {!loading && error && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Feather name="wifi-off" size={32} color={Colors.textSecondary} />
          <Text style={{ marginTop: 12, fontSize: 15, fontWeight: '700', color: Colors.textSecondary }}>{error}</Text>
          <TouchableOpacity onPress={() => fetchOrders()} style={{ marginTop: 16, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      {!loading && !error && (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/(buyer)/orders/${item._id}` as any)} activeOpacity={0.88}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.orderId}>Order #{item._id.slice(-8).toUpperCase()}</Text>
                  <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                </View>
                <View style={[styles.statusChip, { backgroundColor: STATUS_CONFIG[toUiStatus(item.status)].bg }]}>
                  <View style={[styles.statusDot, { backgroundColor: STATUS_CONFIG[toUiStatus(item.status)].dot }]} />
                  <Text style={[styles.statusText, { color: STATUS_CONFIG[toUiStatus(item.status)].text }]}>{item.status.replace('_', ' ')}</Text>
                </View>
              </View>
              <View style={styles.farmRow}>
                <View style={styles.farmAvatar}><Text style={{ fontSize: 16 }}>🌾</Text></View>
                <View style={styles.farmInfo}>
                  <Text style={styles.farmName}>{item.product?.title ?? 'Product'}</Text>
                  <Text style={styles.farmerName}><Feather name="user" size={10} color={Colors.textSecondary} /> {item.farmer?.name ?? 'Farmer'}</Text>
                </View>
                <Text style={styles.orderTotal}>₨{item.totalPrice.toLocaleString()}</Text>
              </View>
              <View style={styles.escrowBanner}>
                <Feather name="shield" size={12} color="#2563EB" />
                <Text style={styles.escrowText}>Escrow Protection Active · Qty: {item.quantity} units</Text>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.detailBtn} onPress={() => router.push(`/(buyer)/orders/${item._id}` as any)}>
                  <Text style={styles.detailBtnText}>View Details</Text>
                  <Feather name="arrow-right" size={13} color="#fff" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyOrders tab={activeTab} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders(true)} colors={[Colors.primary]} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFB' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  heading: { fontSize: 24, fontWeight: '900', color: '#111827', letterSpacing: -0.5 },
  subheading: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500', marginTop: 2 },
  notifBtn: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: '#F8FAFB',
    borderWidth: 1, borderColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 9, right: 9,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5, borderColor: '#fff',
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 0,
    gap: 4,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14,
    borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },
  tabBadge: {
    minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  tabBadgeActive: { backgroundColor: `${Colors.primary}18` },
  tabBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.textSecondary },
  tabBadgeTextActive: { color: Colors.primary },

  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20, marginBottom: 12, padding: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderId: { fontSize: 10, fontWeight: '800', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  orderDate: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 2 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '800' },

  farmRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  farmAvatar: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center',
  },
  farmInfo: { flex: 1 },
  farmName: { fontSize: 13, fontWeight: '700', color: '#111827' },
  farmerName: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  orderTotal: { fontSize: 17, fontWeight: '900', color: Colors.primary },

  itemsRow: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  itemChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F8FAFB', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9',
  },
  itemEmoji: { fontSize: 12 },
  itemName: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  moreChip: {
    backgroundColor: `${Colors.primary}12`,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
  },
  moreText: { fontSize: 11, fontWeight: '800', color: Colors.primary },

  escrowBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EFF6FF', borderRadius: 10, padding: 8, marginBottom: 10,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  escrowText: { fontSize: 11, fontWeight: '600', color: '#2563EB', flex: 1 },

  progressSection: { marginBottom: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  progressPct: { fontSize: 10, fontWeight: '800', color: Colors.primary },
  progressTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 99, overflow: 'hidden' },
  progressFill: { flex: 1, backgroundColor: Colors.primary, borderRadius: 99 },

  actionRow: { flexDirection: 'row', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F8FAFB', alignItems: 'center' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: '#F8FAFB', borderRadius: 10,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  trackBtn: { backgroundColor: `${Colors.primary}10`, borderColor: `${Colors.primary}20` },
  rateBtn: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  actionBtnText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  rateStar: { fontSize: 11 },
  detailBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#111827', borderRadius: 10, paddingVertical: 9,
  },
  detailBtnText: { fontSize: 12, fontWeight: '800', color: '#fff' },

  emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: '#F8FAFB', borderWidth: 1, borderColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 },
  emptyMsg: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
