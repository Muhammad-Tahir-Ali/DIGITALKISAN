import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import bidService, { BidWithOrder } from '@/services/bid.service';

type FilterKey = 'all' | 'pending' | 'accepted' | 'rejected';

const STATUS_CFG = {
  pending:  { label: 'Pending',  bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', icon: 'clock' },
  accepted: { label: 'Accepted', bg: '#D1FAE5', text: '#065F46', dot: '#10B981', icon: 'check-circle' },
  rejected: { label: 'Rejected', bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444', icon: 'x-circle' },
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'pending',  label: 'Pending' },
  { key: 'accepted', label: 'Won' },
  { key: 'rejected', label: 'Lost' },
];

function BidCard({ bid }: { bid: BidWithOrder }) {
  const cfg = STATUS_CFG[bid.status];
  const order = bid.order;

  return (
    <View style={[styles.card, bid.status === 'accepted' && styles.cardAccepted]}>
      {bid.status === 'accepted' && (
        <View style={styles.wonBanner}>
          <Feather name="award" size={12} color="#059669" />
          <Text style={styles.wonText}>You won this bid!</Text>
        </View>
      )}

      {/* Top row */}
      <View style={styles.cardTop}>
        <View style={styles.orderIdBox}>
          <Text style={styles.orderIdText}>
            {order ? `#${order._id?.slice(-6).toUpperCase()}` : 'Order'}
          </Text>
        </View>
        <View style={[styles.statusChip, { backgroundColor: cfg.bg }]}>
          <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
          <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Product */}
      <View style={styles.productRow}>
        <View style={styles.productIconBox}>
          <Text style={{ fontSize: 22 }}>🌾</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.productName} numberOfLines={1}>
            {order?.product?.title ?? 'Agricultural Product'}
          </Text>
          <Text style={styles.productSub} numberOfLines={1}>
            {order?.farmer?.location?.address ?? order?.farmer?.name ?? 'Pickup location'}
            {'  →  '}
            {order?.shippingAddress?.address ?? 'Delivery address'}
          </Text>
        </View>
      </View>

      {/* Bid details */}
      <View style={styles.detailRow}>
        <View style={styles.detailItem}>
          <Feather name="tag" size={12} color={Colors.textSecondary} />
          <Text style={styles.detailLabel}>Your Bid</Text>
          <Text style={styles.detailVal}>₨ {bid.bidAmount.toLocaleString()}</Text>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailItem}>
          <Feather name="clock" size={12} color={Colors.textSecondary} />
          <Text style={styles.detailLabel}>ETA</Text>
          <Text style={styles.detailVal}>{bid.estimatedDeliveryTime}h</Text>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailItem}>
          <Feather name="shopping-bag" size={12} color={Colors.textSecondary} />
          <Text style={styles.detailLabel}>Order Value</Text>
          <Text style={styles.detailVal}>₨ {(order?.totalPrice ?? 0).toLocaleString()}</Text>
        </View>
      </View>

      {/* Message */}
      {bid.message ? (
        <View style={styles.msgBox}>
          <Feather name="message-circle" size={12} color={Colors.textSecondary} />
          <Text style={styles.msgText} numberOfLines={2}>{bid.message}</Text>
        </View>
      ) : null}

      {/* Date */}
      <Text style={styles.dateText}>
        {new Date(bid.createdAt).toLocaleDateString('en-PK', {
          day: 'numeric', month: 'short', year: 'numeric',
        })}
      </Text>
    </View>
  );
}

export default function MyBidsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [bids, setBids]         = useState<BidWithOrder[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [filter, setFilter]     = useState<FilterKey>('all');

  const fetchBids = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const data = await bidService.getMyBids();
      setBids(data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load bids');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchBids(); }, [fetchBids]));

  const filtered = filter === 'all' ? bids : bids.filter(b => b.status === filter);
  const counts = {
    all: bids.length,
    pending: bids.filter(b => b.status === 'pending').length,
    accepted: bids.filter(b => b.status === 'accepted').length,
    rejected: bids.filter(b => b.status === 'rejected').length,
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#111827" />
        </TouchableOpacity>
        <View>
          <Text style={styles.heading}>My Bids</Text>
          <Text style={styles.subheading}>{bids.length} bids submitted</Text>
        </View>
        <TouchableOpacity onPress={() => fetchBids(true)} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterBar}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          const count = counts[f.key];
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterBtn, active && styles.filterBtnActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{f.label}</Text>
              {count > 0 && (
                <View style={[styles.filterBadge, active && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, active && styles.filterBadgeTextActive]}>{count}</Text>
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
          <Feather name="wifi-off" size={36} color={Colors.textSecondary} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchBids()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={({ item }) => <BidCard bid={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchBids(true)} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
              <Text style={styles.emptyTitle}>
                {filter === 'all' ? 'No Bids Yet' : `No ${FILTERS.find(f => f.key === filter)?.label} Bids`}
              </Text>
              <Text style={styles.emptyMsg}>
                {filter === 'all'
                  ? 'Go to Jobs tab to place bids on available orders.'
                  : 'Bids with this status will appear here.'}
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14, paddingTop: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#F8FAFB', alignItems: 'center', justifyContent: 'center',
  },
  heading: { fontSize: 20, fontWeight: '900', color: '#111827' },
  subheading: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500', marginTop: 2 },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },

  filterBar: {
    flexDirection: 'row', backgroundColor: '#fff',
    paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  filterBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 12, borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  filterBtnActive: { borderBottomColor: Colors.primary },
  filterText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  filterTextActive: { color: Colors.primary },
  filterBadge: {
    minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  filterBadgeActive: { backgroundColor: Colors.primaryLight },
  filterBadgeText: { fontSize: 9, fontWeight: '800', color: Colors.textSecondary },
  filterBadgeTextActive: { color: Colors.primary },

  list: { padding: 16, paddingBottom: 80 },

  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardAccepted: { borderColor: '#A7F3D0', borderWidth: 1.5 },

  wonBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#ECFDF5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    alignSelf: 'flex-start', marginBottom: 12,
  },
  wonText: { fontSize: 11, fontWeight: '800', color: '#059669' },

  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderIdBox: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  orderIdText: { fontSize: 10, fontWeight: '900', color: '#475569', letterSpacing: 0.5 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '800' },

  productRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  productIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
  },
  productName: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 2 },
  productSub: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },

  detailRow: {
    flexDirection: 'row', backgroundColor: '#F8FAFB', borderRadius: 14,
    padding: 12, marginBottom: 10,
  },
  detailItem: { flex: 1, alignItems: 'center', gap: 3 },
  detailDivider: { width: 1, backgroundColor: '#E5E7EB', marginHorizontal: 6 },
  detailLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },
  detailVal: { fontSize: 13, fontWeight: '900', color: '#111827' },

  msgBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: '#F8FAFB', borderRadius: 10, padding: 10, marginBottom: 8,
  },
  msgText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500', flex: 1 },

  dateText: { fontSize: 11, color: Colors.textTertiary, fontWeight: '600' },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  errorText: { color: Colors.error, fontWeight: '700', textAlign: 'center', marginVertical: 12 },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '800' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8, textAlign: 'center' },
  emptyMsg: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, paddingHorizontal: 24 },
});
