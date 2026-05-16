import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { SkeletonLoader } from '@/components/ui';
import orderService, { Order, OrderStatus as ApiOrderStatus } from '@/services/order.service';

type TabKey = 'Active' | 'Delivered' | 'Cancelled';

// User-friendly label + colour for every backend status
const STATUS_CONFIG: Record<ApiOrderStatus, { label: string; text: string; bg: string; dot: string }> = {
  pending:    { label: 'Pending',        text: '#92400E', bg: '#FEF3C7', dot: '#F59E0B' },
  paid:       { label: 'Confirmed',      text: '#1E40AF', bg: '#DBEAFE', dot: '#3B82F6' },
  bidding:    { label: 'Finding Rider',  text: '#6B21A8', bg: '#F3E8FF', dot: '#A855F7' },
  in_transit: { label: 'On the Way',    text: '#065F46', bg: '#D1FAE5', dot: '#10B981' },
  delivered:  { label: 'Delivered',      text: '#065F46', bg: '#D1FAE5', dot: '#10B981' },
  disputed:   { label: 'Disputed',       text: '#991B1B', bg: '#FEE2E2', dot: '#EF4444' },
  cancelled:  { label: 'Cancelled',      text: '#6B7280', bg: '#F3F4F6', dot: '#9CA3AF' },
};

const toTab = (status: ApiOrderStatus): TabKey => {
  if (status === 'delivered') return 'Delivered';
  if (status === 'cancelled') return 'Cancelled';
  return 'Active';
};

function EmptyOrders({ tab }: { tab: TabKey }) {
  const config: Record<TabKey, { icon: string; msg: string }> = {
    Active:    { icon: '📦', msg: 'No active orders right now.\nBrowse fresh produce and place your first order!' },
    Delivered: { icon: '✅', msg: 'No delivered orders yet.\nYour completed orders will appear here.' },
    Cancelled: { icon: '❌', msg: 'No cancelled orders. Great news!' },
  };
  const { icon, msg } = config[tab];
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Text style={{ fontSize: 44 }}>{icon}</Text>
      </View>
      <Text style={styles.emptyTitle}>Nothing here yet</Text>
      <Text style={styles.emptyMsg}>{msg}</Text>
    </View>
  );
}

export default function BuyerOrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab]     = useState<TabKey>('Active');
  const [orders, setOrders]           = useState<Order[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

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

  const handleCancel = useCallback((order: Order) => {
    const doCancel = async () => {
      setCancellingId(order._id);
      try {
        await orderService.cancel(order._id);
        // Optimistic update — move to Cancelled tab immediately
        setOrders(prev =>
          prev.map(o => o._id === order._id ? { ...o, status: 'cancelled' } : o)
        );
      } catch (e: any) {
        const msg = e?.response?.data?.message ?? 'Could not cancel this order. Please try again.';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Cancel Failed', msg);
      } finally {
        setCancellingId(null);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Cancel this order? Your wallet balance will be refunded.')) doCancel();
    } else {
      Alert.alert(
        'Cancel Order',
        'Are you sure you want to cancel? Your wallet balance will be refunded.',
        [
          { text: 'Keep Order', style: 'cancel' },
          { text: 'Cancel Order', style: 'destructive', onPress: doCancel },
        ],
      );
    }
  }, []);

  const counts = {
    Active:    orders.filter(o => toTab(o.status) === 'Active').length,
    Delivered: orders.filter(o => toTab(o.status) === 'Delivered').length,
    Cancelled: orders.filter(o => toTab(o.status) === 'Cancelled').length,
  };

  const filtered = orders.filter(o => toTab(o.status) === activeTab);

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
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

      {/* ── Tab bar ── */}
      <View style={styles.tabBar}>
        {(['Active', 'Delivered', 'Cancelled'] as TabKey[]).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
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

      {/* ── Loading skeleton ── */}
      {loading && (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <SkeletonLoader.OrderList count={5} />
        </View>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <View style={styles.errorState}>
          <Feather name="wifi-off" size={32} color={Colors.textSecondary} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchOrders()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── List ── */}
      {!loading && !error && (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyOrders tab={activeTab} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchOrders(true)}
              colors={[Colors.primary]}
            />
          }
          renderItem={({ item }) => {
            const cfg = STATUS_CONFIG[item.status];
            const isCancelling = cancellingId === item._id;
            const canCancel = item.status === 'pending' || item.status === 'paid';
            const canTrack  = item.status === 'in_transit';
            const isDelivered = item.status === 'delivered';
            const canRate   = isDelivered; // rate screen handles pre-fill/disable if already rated

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/(buyer)/orders/${item._id}` as any)}
                activeOpacity={0.88}
              >
                {/* Order ID + status */}
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.orderId}>#{item._id.slice(-8).toUpperCase()}</Text>
                    <Text style={styles.orderDate}>
                      {new Date(item.createdAt).toLocaleDateString('en-PK', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: cfg.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
                    <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
                  </View>
                </View>

                {/* Product + farmer */}
                <View style={styles.farmRow}>
                  <View style={styles.farmAvatar}>
                    <Text style={{ fontSize: 16 }}>🌾</Text>
                  </View>
                  <View style={styles.farmInfo}>
                    <Text style={styles.farmName} numberOfLines={1}>
                      {item.product?.title ?? 'Product'}
                    </Text>
                    <Text style={styles.farmerName}>
                      <Feather name="user" size={10} color={Colors.textSecondary} />{' '}
                      {item.farmer?.name ?? 'Farmer'} · Qty: {item.quantity}
                    </Text>
                  </View>
                  <Text style={styles.orderTotal}>₨{item.totalPrice.toLocaleString()}</Text>
                </View>

                {/* Escrow banner */}
                <View style={styles.escrowBanner}>
                  <Feather name="shield" size={12} color="#2563EB" />
                  <Text style={styles.escrowText}>Escrow Protection Active</Text>
                </View>

                {/* Actions */}
                <View style={styles.actionRow}>
                  {canCancel && (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleCancel(item)}
                      disabled={isCancelling}
                    >
                      {isCancelling
                        ? <ActivityIndicator size="small" color={Colors.error} />
                        : <Text style={styles.cancelBtnText}>Cancel</Text>
                      }
                    </TouchableOpacity>
                  )}

                  {canTrack && (
                    <TouchableOpacity
                      style={styles.trackBtn}
                      onPress={() => router.push(`/(buyer)/orders/tracking/${item._id}` as any)}
                    >
                      <Feather name="map-pin" size={13} color={Colors.primary} />
                      <Text style={styles.trackBtnText}>Track</Text>
                    </TouchableOpacity>
                  )}

                  {canRate && (
                    <TouchableOpacity
                      style={styles.rateBtn}
                      onPress={() => router.push(`/(buyer)/orders/rate/${item._id}` as any)}
                    >
                      <Feather name="star" size={13} color="#D97706" />
                      <Text style={styles.rateBtnText}>Rate</Text>
                    </TouchableOpacity>
                  )}

                  {isDelivered && (
                    <TouchableOpacity
                      style={styles.reportBtn}
                      onPress={() => {
                        if (Platform.OS === 'web') {
                          window.alert('To report an issue, contact us at support@digitalkisan.pk or WhatsApp +92-300-0000000');
                        } else {
                          Alert.alert(
                            'Report Issue',
                            'Contact our support team to report a problem with this order.',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Contact Support', onPress: () => {} },
                            ],
                          );
                        }
                      }}
                    >
                      <Feather name="alert-circle" size={13} color="#DC2626" />
                      <Text style={styles.reportBtnText}>Report</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.detailBtn}
                    onPress={() => router.push(`/(buyer)/orders/${item._id}` as any)}
                  >
                    <Text style={styles.detailBtnText}>View Details</Text>
                    <Feather name="arrow-right" size={13} color="#fff" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFB' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  heading:    { fontSize: 24, fontWeight: '900', color: '#111827', letterSpacing: -0.5 },
  subheading: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500', marginTop: 2 },
  notifBtn: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: '#F8FAFB', borderWidth: 1, borderColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 9, right: 9,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#fff',
  },

  tabBar: {
    flexDirection: 'row', backgroundColor: '#fff',
    paddingHorizontal: 16, gap: 4,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14,
    borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  tabActive:         { borderBottomColor: Colors.primary },
  tabText:           { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  tabTextActive:     { color: Colors.primary },
  tabBadge:          { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  tabBadgeActive:    { backgroundColor: `${Colors.primary}18` },
  tabBadgeText:      { fontSize: 10, fontWeight: '800', color: Colors.textSecondary },
  tabBadgeTextActive:{ color: Colors.primary },

  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },

  card: {
    backgroundColor: '#fff', borderRadius: 20, marginBottom: 12, padding: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderId:   { fontSize: 10, fontWeight: '800', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  orderDate: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 2 },

  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '800' },

  farmRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  farmAvatar:{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  farmInfo:  { flex: 1 },
  farmName:  { fontSize: 13, fontWeight: '700', color: '#111827' },
  farmerName:{ fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  orderTotal:{ fontSize: 17, fontWeight: '900', color: Colors.primary },

  escrowBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EFF6FF', borderRadius: 10, padding: 8, marginBottom: 10,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  escrowText: { fontSize: 11, fontWeight: '600', color: '#2563EB', flex: 1 },

  actionRow: {
    flexDirection: 'row', gap: 8, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#F8FAFB', alignItems: 'center',
  },
  cancelBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FEF2F2',
    minWidth: 68, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 12, fontWeight: '700', color: Colors.error },

  trackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: `${Colors.primary}10`, borderWidth: 1, borderColor: `${Colors.primary}25`,
  },
  trackBtnText: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  rateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A',
  },
  rateBtnText: { fontSize: 12, fontWeight: '700', color: '#D97706' },

  reportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
  },
  reportBtnText: { fontSize: 12, fontWeight: '700', color: '#DC2626' },

  detailBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#111827', borderRadius: 10, paddingVertical: 9,
  },
  detailBtnText: { fontSize: 12, fontWeight: '800', color: '#fff' },

  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText:  { marginTop: 12, fontSize: 15, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },
  retryBtn:   { marginTop: 16, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryText:  { color: '#fff', fontWeight: '800' },

  emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  emptyIcon:  {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: '#F8FAFB', borderWidth: 1, borderColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 },
  emptyMsg:   { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
