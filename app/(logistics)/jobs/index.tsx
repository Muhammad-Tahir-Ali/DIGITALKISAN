import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Platform, ActivityIndicator,
  RefreshControl, Modal, TextInput, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import orderService, { Order } from '@/services/order.service';
import bidService from '@/services/bid.service';

// ─── Bid Modal ────────────────────────────────────────────────────────────────

function PlaceBidModal({
  order,
  visible,
  onClose,
  onSuccess,
}: {
  order: Order | null;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [bidAmount, setBidAmount] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!order) return;
    const amount = parseFloat(bidAmount);
    const hours = parseInt(estimatedHours);

    if (!amount || amount <= 0) return Alert.alert('Invalid Bid', 'Please enter a valid bid amount.');
    if (!hours || hours <= 0) return Alert.alert('Invalid Time', 'Please enter estimated delivery hours.');

    setSubmitting(true);
    try {
      await bidService.place(order._id, {
        bidAmount: amount,
        estimatedDeliveryTime: hours,
        message,
      });
      Alert.alert('Bid Placed! ✅', `Your bid of ₨${amount} has been submitted. The farmer will review it.`);
      setBidAmount('');
      setEstimatedHours('');
      setMessage('');
      onSuccess();
      onClose();
    } catch (e: any) {
      Alert.alert('Bid Failed', e?.response?.data?.message ?? 'Could not place bid. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modal.backdrop}>
        <View style={modal.sheet}>
          <View style={modal.handle} />
          <View style={modal.header}>
            <Text style={modal.title}>Place Your Bid 💼</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {order && (
            <View style={modal.orderPreview}>
              <Text style={modal.previewLabel}>Order</Text>
              <Text style={modal.previewVal} numberOfLines={1}>
                {order.product?.title} · {order.quantity} units
              </Text>
              <Text style={modal.previewAddr} numberOfLines={2}>
                📍 {order.shippingAddress?.address}
              </Text>
            </View>
          )}

          <View style={modal.field}>
            <Text style={modal.label}>Your Bid Amount (₨)</Text>
            <TextInput
              style={modal.input}
              placeholder="e.g. 500"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={bidAmount}
              onChangeText={setBidAmount}
            />
          </View>
          <View style={modal.field}>
            <Text style={modal.label}>Estimated Delivery (hours)</Text>
            <TextInput
              style={modal.input}
              placeholder="e.g. 24"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={estimatedHours}
              onChangeText={setEstimatedHours}
            />
          </View>
          <View style={modal.field}>
            <Text style={modal.label}>Message (optional)</Text>
            <TextInput
              style={[modal.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Tell the farmer why you're the best driver..."
              placeholderTextColor="#94A3B8"
              multiline
              value={message}
              onChangeText={setMessage}
            />
          </View>

          <TouchableOpacity
            style={[modal.submitBtn, submitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="send" size={16} color="#fff" />
                <Text style={modal.submitText}>Submit Bid</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Job Card ────────────────────────────────────────────────────────────────

function JobCard({ item, onBid }: { item: Order; onBid: (order: Order) => void }) {
  const distance = '~' + (Math.floor(Math.random() * 40) + 5) + ' km'; // Placeholder until GeoJSON distance added

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.orderIdBadge}>
          <Text style={styles.orderIdText}>#{item._id.slice(-6).toUpperCase()}</Text>
        </View>
        <View style={styles.statusChip}>
          <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.statusText}>Open for Bids</Text>
        </View>
      </View>

      {/* Product Info */}
      <View style={styles.productRow}>
        <View style={styles.productEmoji}><Text style={{ fontSize: 28 }}>🌾</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.productName}>{item.product?.title ?? 'Agricultural Product'}</Text>
          <Text style={styles.productMeta}>
            {item.quantity} units · Farmer: {item.farmer?.name ?? 'N/A'}
          </Text>
        </View>
        <Text style={styles.productValue}>₨{item.totalPrice?.toLocaleString()}</Text>
      </View>

      {/* Delivery Info */}
      <View style={styles.deliveryRow}>
        <View style={styles.deliveryItem}>
          <Feather name="map-pin" size={12} color={Colors.primary} />
          <Text style={styles.deliveryText} numberOfLines={1}>
            {item.shippingAddress?.address ?? 'Address not specified'}
          </Text>
        </View>
        <View style={styles.deliveryItem}>
          <Feather name="navigation" size={12} color="#7C3AED" />
          <Text style={[styles.deliveryText, { color: '#7C3AED' }]}>{distance}</Text>
        </View>
      </View>

      {/* Action */}
      <TouchableOpacity style={styles.bidBtn} onPress={() => onBid(item)} activeOpacity={0.85}>
        <Feather name="trending-up" size={15} color="#fff" />
        <Text style={styles.bidBtnText}>Place Bid</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function LogisticsJobs() {
  const [jobs, setJobs] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchJobs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      // Use the dedicated /available endpoint — getMyOrders() returns empty for logistics users
      const available = await orderService.getAvailableOrders();
      setJobs(available);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load jobs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleBid = (order: Order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Available Jobs</Text>
          <Text style={styles.subheading}>Find deliveries near you</Text>
        </View>
        <View style={styles.badgeRow}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Open', value: jobs.length, icon: 'package', color: '#059669', bg: '#D1FAE5' },
          { label: 'Avg. Pay', value: '₨450', icon: 'trending-up', color: '#7C3AED', bg: '#EDE9FE' },
          { label: 'My Bids', value: '—', icon: 'send', color: '#2563EB', bg: '#DBEAFE' },
        ].map(s => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
            <Feather name={s.icon as any} size={14} color={s.color} />
            <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: s.color }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Loading */}
      {loading && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: 12, color: Colors.textSecondary, fontWeight: '600' }}>
            Finding jobs near you...
          </Text>
        </View>
      )}

      {/* Error */}
      {!loading && error && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Feather name="wifi-off" size={32} color={Colors.textSecondary} />
          <Text style={{ marginTop: 12, color: Colors.textSecondary, fontWeight: '700', textAlign: 'center' }}>
            {error}
          </Text>
          <TouchableOpacity
            style={{ marginTop: 16, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 }}
            onPress={() => fetchJobs()}
          >
            <Text style={{ color: '#fff', fontWeight: '800' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Job List */}
      {!loading && !error && (
        <FlatList
          data={jobs}
          keyExtractor={item => item._id}
          renderItem={({ item }) => <JobCard item={item} onBid={handleBid} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchJobs(true)} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 52, marginBottom: 16 }}>🚚</Text>
              <Text style={styles.emptyTitle}>No Jobs Available</Text>
              <Text style={styles.emptyMsg}>
                New delivery jobs appear here as farmers list products. Check back soon!
              </Text>
            </View>
          }
        />
      )}

      {/* Bid Modal */}
      <PlaceBidModal
        order={selectedOrder}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={() => fetchJobs(true)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  subheading: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500', marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF3C7', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#F59E0B' },
  liveText: { fontSize: 10, fontWeight: '900', color: '#92400E', letterSpacing: 1 },

  statsRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 20, paddingVertical: 16,
  },
  statCard: {
    flex: 1, borderRadius: 16, paddingVertical: 14,
    alignItems: 'center', gap: 4,
  },
  statVal: { fontSize: 17, fontWeight: '900' },
  statLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  list: { paddingHorizontal: 16, paddingVertical: 8, paddingBottom: 80 },

  // Job Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  orderIdBadge: {
    backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  orderIdText: { fontSize: 10, fontWeight: '900', color: '#475569', letterSpacing: 0.5 },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '800', color: '#92400E' },

  productRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  productEmoji: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
  },
  productName: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 3 },
  productMeta: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  productValue: { fontSize: 17, fontWeight: '900', color: Colors.primary },

  deliveryRow: { gap: 6, marginBottom: 14 },
  deliveryItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deliveryText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, flex: 1 },

  bidBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#111827', borderRadius: 14,
    paddingVertical: 13,
  },
  bidBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },

  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 8 },
  emptyMsg: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});

const modal = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 28,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 20,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: '900', color: '#111827' },
  orderPreview: {
    backgroundColor: '#F8FAFB', borderRadius: 16,
    padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  previewLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 },
  previewVal: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 4 },
  previewAddr: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500', lineHeight: 18 },
  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '800', color: '#475569', marginBottom: 8, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#F8FAFB', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: '#E2E8F0',
    fontSize: 15, fontWeight: '600', color: '#1E293B',
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: Colors.primary,
    borderRadius: 16, paddingVertical: 16, marginTop: 4,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
