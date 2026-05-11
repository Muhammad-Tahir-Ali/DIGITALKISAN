import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import orderService, { Order, OrderStatus } from '@/services/order.service';
import { socketService } from '@/services/socket.service';

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  in_transit: { label: 'In Transit',  bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  delivered:  { label: 'Delivered',   bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  cancelled:  { label: 'Cancelled',   bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
};

function ActiveJobCard({ order, onMarkDelivered }: { order: Order; onMarkDelivered: (o: Order) => void }) {
  const cfg = STATUS_LABELS[order.status] ?? STATUS_LABELS.in_transit;
  const isActive = order.status === 'in_transit';

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardTop}>
        <View style={styles.orderIdBox}>
          <Text style={styles.orderIdText}>#{order._id.slice(-6).toUpperCase()}</Text>
        </View>
        <View style={[styles.statusChip, { backgroundColor: cfg.bg }]}>
          <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
          <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Product */}
      <View style={styles.productRow}>
        <View style={styles.productEmoji}>
          <Text style={{ fontSize: 24 }}>🌾</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.productName}>{order.product?.title ?? 'Agricultural Product'}</Text>
          <Text style={styles.productMeta}>{order.quantity} units · ₨{order.totalPrice?.toLocaleString()}</Text>
        </View>
      </View>

      {/* Route */}
      <View style={styles.routeBox}>
        <View style={styles.routeRow}>
          <View style={[styles.bullet, { backgroundColor: Colors.primary }]} />
          <Text style={styles.routeText} numberOfLines={1}>
            {order.farmer?.location?.address ?? `Farmer: ${order.farmer?.name ?? '—'}`}
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeRow}>
          <View style={[styles.bullet, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.routeText} numberOfLines={1}>
            {order.shippingAddress?.address ?? 'Delivery address'}
          </Text>
        </View>
      </View>

      {/* Buyer */}
      <View style={styles.infoRow}>
        <Feather name="user" size={12} color={Colors.textSecondary} />
        <Text style={styles.infoText}>Buyer: {order.buyer?.name ?? '—'} · {order.buyer?.phone ?? '—'}</Text>
      </View>

      {/* Actions */}
      {isActive && (
        <TouchableOpacity style={styles.deliveredBtn} onPress={() => onMarkDelivered(order)} activeOpacity={0.85}>
          <Feather name="check-circle" size={16} color="#fff" />
          <Text style={styles.deliveredText}>Mark as Delivered</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ActiveDeliveries() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'done'>('active');
  const locationWatcher = useRef<Location.LocationSubscription | null>(null);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load deliveries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Start broadcasting GPS for all in_transit orders
  useEffect(() => {
    const inTransitOrders = orders.filter(o => o.status === 'in_transit');
    if (inTransitOrders.length === 0) {
      locationWatcher.current?.remove();
      locationWatcher.current = null;
      socketService.disconnect();
      return;
    }

    let active = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || !active) return;

      socketService.connect();
      inTransitOrders.forEach(o => socketService.joinOrder(o._id));

      locationWatcher.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        ({ coords }) => {
          inTransitOrders.forEach(o =>
            socketService.emitLocation(o._id, coords.latitude, coords.longitude)
          );
        }
      );
    })();

    return () => {
      active = false;
      locationWatcher.current?.remove();
      locationWatcher.current = null;
      socketService.disconnect();
    };
  }, [orders]);

  const handleMarkDelivered = (order: Order) => {
    Alert.alert(
      'Confirm Delivery',
      `Mark this order as Delivered?\n\nOrder: ${order.product?.title}\nBuyer: ${order.buyer?.name}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '✅ Mark Delivered',
          onPress: async () => {
            try {
              await orderService.updateStatus(order._id, 'delivered' as OrderStatus);
              Alert.alert('Done! 🎉', 'Order marked as delivered. Payment will be released to the farmer.');
              fetchOrders(true);
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message ?? 'Failed to update status.');
            }
          },
        },
      ]
    );
  };

  const activeOrders = orders.filter(o => o.status === 'in_transit');
  const doneOrders   = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));
  const displayed    = activeTab === 'active' ? activeOrders : doneOrders;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>My Deliveries</Text>
          <Text style={styles.subheading}>Track your active jobs</Text>
        </View>
        <TouchableOpacity onPress={() => fetchOrders(true)} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={[styles.summaryCard, { backgroundColor: '#DBEAFE' }]}>
          <Text style={[styles.summaryVal, { color: '#1E40AF' }]}>{activeOrders.length}</Text>
          <Text style={[styles.summaryLabel, { color: '#1E40AF' }]}>Active</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#D1FAE5' }]}>
          <Text style={[styles.summaryVal, { color: '#065F46' }]}>{doneOrders.length}</Text>
          <Text style={[styles.summaryLabel, { color: '#065F46' }]}>Completed</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['active', 'done'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'active' ? 'In Transit' : 'Completed'}
            </Text>
            {(tab === 'active' ? activeOrders : doneOrders).length > 0 && (
              <View style={[styles.tabBadge, activeTab === tab && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === tab && styles.tabBadgeTextActive]}>
                  {(tab === 'active' ? activeOrders : doneOrders).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Feather name="wifi-off" size={32} color={Colors.textSecondary} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchOrders()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <ActiveJobCard order={item} onMarkDelivered={handleMarkDelivered} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders(true)} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>
                {activeTab === 'active' ? '🚚' : '✅'}
              </Text>
              <Text style={styles.emptyTitle}>
                {activeTab === 'active' ? 'No Active Deliveries' : 'No Completed Jobs Yet'}
              </Text>
              <Text style={styles.emptyMsg}>
                {activeTab === 'active'
                  ? 'Accept a bid from the Map or Jobs tab to see your active deliveries here.'
                  : 'Completed deliveries will appear here.'}
              </Text>
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

  summaryBar: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  summaryCard: {
    flex: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  summaryVal: { fontSize: 22, fontWeight: '900' },
  summaryLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  tabBar: {
    flexDirection: 'row', backgroundColor: '#fff',
    paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderBottomWidth: 2.5, borderBottomColor: 'transparent',
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
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  orderIdBox: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  orderIdText: { fontSize: 10, fontWeight: '900', color: '#475569', letterSpacing: 0.5 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '800' },

  productRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  productEmoji: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  productName: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 2 },
  productMeta: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },

  routeBox: { backgroundColor: '#F8FAFB', borderRadius: 14, padding: 12, marginBottom: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bullet: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#fff' },
  routeText: { fontSize: 12, fontWeight: '600', color: '#374151', flex: 1 },
  routeLine: { height: 14, width: 1.5, backgroundColor: '#E5E7EB', marginLeft: 4, marginVertical: 3 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  infoText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500', flex: 1 },

  deliveredBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#059669', borderRadius: 14, paddingVertical: 13,
  },
  deliveredText: { color: '#fff', fontSize: 14, fontWeight: '900' },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  errorText: { color: Colors.error, fontWeight: '700', textAlign: 'center', marginVertical: 12 },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '800' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8, textAlign: 'center' },
  emptyMsg: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 16 },
});
