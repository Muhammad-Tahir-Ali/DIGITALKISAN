import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Platform, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import orderService, { Order, OrderStatus } from '@/services/order.service';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending:    { label: 'Pending',    bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  paid:       { label: 'New Order',  bg: '#DCFCE7', text: '#065F46', dot: '#10B981' },
  bidding:    { label: 'Bidding',    bg: '#EDE9FE', text: '#5B21B6', dot: '#7C3AED' },
  in_transit: { label: 'In Transit', bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  delivered:  { label: 'Delivered',  bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  disputed:   { label: 'Disputed',   bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
  cancelled:  { label: 'Cancelled',  bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
};

type TabKey = 'new' | 'active' | 'done';
const TABS: { key: TabKey; label: string; statuses: OrderStatus[] }[] = [
  { key: 'new',    label: 'New',     statuses: ['pending', 'paid'] },
  { key: 'active', label: 'Active',  statuses: ['bidding', 'in_transit'] },
  { key: 'done',   label: 'Done',    statuses: ['delivered', 'cancelled', 'disputed'] },
];

export default function FarmerOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders]     = useState<Order[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('new');

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
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

  const tabOrders = (tab: TabKey) =>
    orders.filter(o => TABS.find(t => t.key === tab)!.statuses.includes(o.status));

  const handleReviewBids = (order: Order) => {
    router.push(`/(farmer)/orders/${order._id}` as any);
  };

  const handleUpdateStatus = (order: Order, newStatus: OrderStatus) => {
    Alert.alert(
      'Update Order Status',
      `Mark this order as "${STATUS_CONFIG[newStatus]?.label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await orderService.updateStatus(order._id, newStatus);
              fetchOrders(true);
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message ?? 'Failed to update status.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Order }) => {
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
    const canAcceptBids = item.status === 'bidding';
    const canMarkPickup = item.status === 'in_transit';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(farmer)/orders/${item._id}` as any)}
        activeOpacity={0.9}
      >
        {/* Top row */}
        <View style={styles.cardTop}>
          <Text style={styles.orderId}>#{item._id.slice(-8).toUpperCase()}</Text>
          <View style={[styles.statusChip, { backgroundColor: cfg.bg }]}>
            <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
            <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* Product row */}
        <View style={styles.productRow}>
          <View style={styles.productEmoji}><Text style={{ fontSize: 24 }}>🌾</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName}>{item.product?.title ?? 'Product'}</Text>
            <Text style={styles.productMeta}>
              Qty: {item.quantity} units · ₨{item.totalPrice.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Buyer info */}
        <View style={styles.infoRow}>
          <Feather name="user" size={12} color={Colors.textSecondary} />
          <Text style={styles.infoText}>{item.buyer?.name ?? 'Buyer'} · {item.buyer?.phone ?? '—'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="map-pin" size={12} color={Colors.textSecondary} />
          <Text style={styles.infoText} numberOfLines={1}>{item.shippingAddress?.address ?? '—'}</Text>
        </View>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          {canAcceptBids && (
            <TouchableOpacity style={styles.acceptBtn} onPress={() => handleReviewBids(item)}>
              <Feather name="check-circle" size={14} color="#fff" />
              <Text style={styles.acceptBtnText}>Review Bids</Text>
            </TouchableOpacity>
          )}
          {canMarkPickup && (
            <TouchableOpacity style={styles.transitBtn} onPress={() => handleUpdateStatus(item, 'delivered')}>
              <Feather name="truck" size={14} color="#fff" />
              <Text style={styles.acceptBtnText}>Mark Delivered</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.detailBtn} onPress={() => router.push(`/(farmer)/orders/${item._id}` as any)}>
            <Text style={styles.detailBtnText}>Details</Text>
            <Feather name="arrow-right" size={13} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const filtered = tabOrders(activeTab);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>My Orders</Text>
          <Text style={styles.subheading}>Manage incoming orders</Text>
        </View>
        <TouchableOpacity onPress={() => fetchOrders(true)} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map(tab => {
          const count = tabOrders(tab.key).length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchOrders()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders(true)} colors={[Colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>📦</Text>
              <Text style={styles.emptyTitle}>No {TABS.find(t => t.key === activeTab)?.label} Orders</Text>
              <Text style={styles.emptyMsg}>Orders from buyers will appear here.</Text>
            </View>
          }
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
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  heading: { fontSize: 24, fontWeight: '900', color: '#111827', letterSpacing: -0.5 },
  subheading: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, fontWeight: '500' },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row', backgroundColor: '#fff',
    paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
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
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  tabBadgeActive: { backgroundColor: Colors.primaryLight },
  tabBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.textSecondary },
  tabBadgeTextActive: { color: Colors.primary },
  list: { padding: 16, paddingBottom: 60 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderId: { fontSize: 10, fontWeight: '900', color: Colors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase' },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '800' },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  productEmoji: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  productName: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 2 },
  productMeta: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  infoText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500', flex: 1 },
  date: { fontSize: 11, color: Colors.textTertiary, fontWeight: '600', marginTop: 6, marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F8FAFB' },
  acceptBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 10,
  },
  transitBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 10,
  },
  acceptBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  detailBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryLight, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  detailBtnText: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  errorText: { color: Colors.error, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '800' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 6 },
  emptyMsg: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});
