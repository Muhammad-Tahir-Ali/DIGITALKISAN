import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, TouchableOpacity,
  StyleSheet, Alert, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import orderService, { Order } from '@/services/order.service';
import bidService, { Bid } from '@/services/bid.service';
import { StatusBadge } from '@/components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Bid Card ─────────────────────────────────────────────────────────────────
function BidCard({
  bid,
  rank,
  onAccept,
  accepting,
}: {
  bid: Bid;
  rank: number;
  onAccept: (bidId: string) => void;
  accepting: boolean;
}) {
  const isTop = rank === 1;
  return (
    <View style={[styles.bidCard, isTop && styles.bidCardTop]}>
      {isTop && (
        <View style={styles.bestBadge}>
          <Text style={styles.bestBadgeText}>⭐ Best Bid</Text>
        </View>
      )}
      <View style={styles.bidHeader}>
        <View style={styles.bidAvatar}>
          <Text style={styles.bidAvatarText}>{bid.logisticsProvider.name[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bidName}>{bid.logisticsProvider.name}</Text>
          <View style={styles.ratingRow}>
            <Feather name="star" size={11} color="#F59E0B" />
            <Text style={styles.ratingText}>{bid.logisticsProvider.rating?.toFixed(1) ?? '4.5'}</Text>
            <Text style={styles.ratingDot}>·</Text>
            <Feather name="phone" size={11} color={Colors.textSecondary} />
            <Text style={styles.phoneText}>{bid.logisticsProvider.phone ?? 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.bidAmountBox}>
          <Text style={styles.bidAmount}>₨{bid.bidAmount.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.bidMeta}>
        <View style={styles.bidMetaItem}>
          <Feather name="clock" size={12} color={Colors.textSecondary} />
          <Text style={styles.bidMetaText}>{bid.estimatedDeliveryTime}h delivery</Text>
        </View>
        {bid.message ? (
          <View style={styles.bidMetaItem}>
            <Feather name="message-circle" size={12} color={Colors.textSecondary} />
            <Text style={styles.bidMetaText} numberOfLines={1}>{bid.message}</Text>
          </View>
        ) : null}
      </View>

      {bid.status === 'pending' && (
        <TouchableOpacity
          style={[styles.acceptBtn, isTop && styles.acceptBtnTop, accepting && { opacity: 0.7 }]}
          onPress={() => onAccept(bid._id)}
          disabled={accepting}
          activeOpacity={0.85}
        >
          {accepting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Feather name="check-circle" size={15} color="#fff" />
              <Text style={styles.acceptBtnText}>Accept This Bid</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {bid.status === 'accepted' && (
        <View style={styles.acceptedChip}>
          <Feather name="check" size={13} color="#059669" />
          <Text style={styles.acceptedText}>Accepted</Text>
        </View>
      )}
      {bid.status === 'rejected' && (
        <View style={styles.rejectedChip}>
          <Feather name="x" size={13} color="#DC2626" />
          <Text style={styles.rejectedText}>Rejected</Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function FarmerOrderDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [order, setOrder]   = useState<Order | null>(null);
  const [bids, setBids]     = useState<Bid[]>([]);
  const [loading, setLoading]     = useState(true);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [accepting, setAccepting]   = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const data = await orderService.getById(id as string);
      setOrder(data);
      // Auto-fetch bids if order is in bidding state
      if (['bidding', 'in_transit', 'paid'].includes(data.status)) {
        setBidsLoading(true);
        const bidData = await bidService.getForOrder(id as string);
        // Sort: lowest price first (best for farmer = cheapest logistics)
        bidData.sort((a, b) => a.bidAmount - b.bidAmount);
        setBids(bidData);
        setBidsLoading(false);
      }
    } catch (err) {
      console.error('Failed to fetch order/bids', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { if (id) fetchOrder(); }, [id, fetchOrder]);

  const handleAcceptBid = async (bidId: string) => {
    Alert.alert(
      'Accept This Bid?',
      'The selected logistics partner will be assigned to deliver this order. Other bids will be rejected automatically.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept Bid',
          onPress: async () => {
            setAccepting(true);
            try {
              await bidService.accept(bidId);
              Alert.alert('✅ Bid Accepted!', 'The logistics partner has been assigned. Order is now In Transit.');
              fetchOrder();
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message ?? 'Could not accept bid.');
            } finally {
              setAccepting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Feather name="alert-circle" size={48} color={Colors.textSecondary} />
        <Text style={styles.notFoundText}>Order not found</Text>
      </View>
    );
  }

  const pendingBids  = bids.filter(b => b.status === 'pending');
  const acceptedBid  = bids.find(b => b.status === 'accepted');
  const hasBids      = bids.length > 0;
  const isBidding    = order.status === 'bidding';

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFB' }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.replace('/(farmer)/orders')} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Detail</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Order Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.orderId}>#{order._id.slice(-8).toUpperCase()}</Text>
              <Text style={styles.orderDate}>
                {new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
            <StatusBadge status={order.status} size="md" />
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Product</Text>
            <Text style={styles.detailValue}>{order.product?.title ?? '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity</Text>
            <Text style={styles.detailValue}>{order.quantity} units</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Value</Text>
            <Text style={[styles.detailValue, { color: Colors.primary, fontWeight: '900' }]}>
              ₨{order.totalPrice.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Buyer Info Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            <Feather name="user" size={15} color="#374151" />  Buyer Details
          </Text>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name</Text>
            <Text style={styles.detailValue}>{order.buyer?.name ?? '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue}>{order.buyer?.phone ?? 'Not provided'}</Text>
          </View>
          <View style={[styles.detailRow, { alignItems: 'flex-start' }]}>
            <Text style={styles.detailLabel}>Ship To</Text>
            <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]}>
              {order.shippingAddress?.address ?? '—'}
            </Text>
          </View>
        </View>

        {/* Logistics Provider (if assigned) */}
        {order.logisticsProvider && (
          <View style={[styles.card, { borderColor: '#D1FAE5', borderWidth: 1.5 }]}>
            <Text style={styles.sectionTitle}>
              <Feather name="truck" size={15} color="#059669" />  Logistics Partner
            </Text>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Driver</Text>
              <Text style={styles.detailValue}>{(order.logisticsProvider as any).name ?? '—'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>{(order.logisticsProvider as any).phone ?? '—'}</Text>
            </View>
          </View>
        )}

        {/* Bids Section */}
        {(isBidding || hasBids) && (
          <View>
            <View style={styles.bidsSectionHeader}>
              <View>
                <Text style={styles.bidsTitle}>
                  {isBidding ? '📬 Incoming Bids' : '📋 Bid History'}
                </Text>
                {isBidding && pendingBids.length > 0 && (
                  <Text style={styles.bidsSubtitle}>
                    {pendingBids.length} bid{pendingBids.length > 1 ? 's' : ''} waiting — accept the best one
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => {
                  setBidsLoading(true);
                  bidService.getForOrder(id as string)
                    .then(data => { data.sort((a, b) => a.bidAmount - b.bidAmount); setBids(data); })
                    .finally(() => setBidsLoading(false));
                }}
                style={styles.refreshBidsBtn}
              >
                <Feather name="refresh-cw" size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {bidsLoading && (
              <View style={styles.bidsLoading}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.bidsLoadingText}>Loading bids...</Text>
              </View>
            )}

            {!bidsLoading && bids.length === 0 && (
              <View style={styles.noBids}>
                <Text style={styles.noBidsEmoji}>⏳</Text>
                <Text style={styles.noBidsTitle}>Waiting for Bids</Text>
                <Text style={styles.noBidsMsg}>
                  Logistics partners will see this order and submit their bids soon.
                </Text>
              </View>
            )}

            {!bidsLoading && bids.map((bid, index) => (
              <BidCard
                key={bid._id}
                bid={bid}
                rank={index + 1}
                onAccept={handleAcceptBid}
                accepting={accepting}
              />
            ))}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFB' },
  notFoundText: { marginTop: 12, fontSize: 16, fontWeight: '700', color: Colors.textSecondary },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#F8FAFB', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#111827' },

  content: { padding: 16, paddingBottom: 40, gap: 12 },

  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  orderId: { fontSize: 12, fontWeight: '900', color: '#111827', letterSpacing: 0.5, textTransform: 'uppercase' },
  orderDate: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500', marginTop: 3 },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#374151', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 14 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10,
  },
  detailLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  detailValue: { fontSize: 13, color: '#111827', fontWeight: '700' },

  // Bids Section
  bidsSectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 12, marginTop: 4,
  },
  bidsTitle: { fontSize: 17, fontWeight: '900', color: '#111827' },
  bidsSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 3, fontWeight: '500' },
  refreshBidsBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  bidsLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 20, justifyContent: 'center' },
  bidsLoadingText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },

  noBids: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  noBidsEmoji: { fontSize: 40, marginBottom: 12 },
  noBidsTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 6 },
  noBidsMsg: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  // Bid Cards
  bidCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  bidCardTop: {
    borderColor: '#A7F3D0', borderWidth: 1.5,
    shadowColor: Colors.primary, shadowOpacity: 0.08,
  },
  bestBadge: {
    alignSelf: 'flex-start', backgroundColor: '#FEF3C7',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 10,
  },
  bestBadgeText: { fontSize: 10, fontWeight: '900', color: '#92400E', letterSpacing: 0.3 },

  bidHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  bidAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  bidAvatarText: { fontSize: 17, fontWeight: '900', color: Colors.primary },
  bidName: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 11, fontWeight: '700', color: '#92400E' },
  ratingDot: { color: Colors.textSecondary },
  phoneText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  bidAmountBox: {
    backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
  },
  bidAmount: { fontSize: 16, fontWeight: '900', color: Colors.primary },

  bidMeta: { gap: 6, marginBottom: 14 },
  bidMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  bidMetaText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500', flex: 1 },

  acceptBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#111827', borderRadius: 13, paddingVertical: 12,
  },
  acceptBtnTop: { backgroundColor: Colors.primary },
  acceptBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },

  acceptedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#D1FAE5', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start',
  },
  acceptedText: { fontSize: 12, fontWeight: '800', color: '#059669' },
  rejectedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEE2E2', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start',
  },
  rejectedText: { fontSize: 12, fontWeight: '800', color: '#DC2626' },
});
