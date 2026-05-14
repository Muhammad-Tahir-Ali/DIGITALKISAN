import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { SkeletonLoader } from '@/components/ui';
import userService, { WalletData } from '@/services/user.service';
import orderService, { Order } from '@/services/order.service';

const ESCROW_STATUSES: Order['status'][] = ['paid', 'bidding', 'in_transit'];

const STATUS_LABEL: Record<string, string> = {
  paid:       'Awaiting Farmer',
  bidding:    'Finding Rider',
  in_transit: 'On the Way',
};

export default function BuyerWalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [escrowOrders, setEscrowOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const [walletData, orders] = await Promise.all([
        userService.getWallet(),
        orderService.getMyOrders(),
      ]);
      setWallet(walletData);
      setEscrowOrders(orders.filter(o => ESCROW_STATUSES.includes(o.status)));
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load wallet');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DigitalKisan Wallet</Text>
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 12 }}>
          <SkeletonLoader.Box height={180} borderRadius={28} />
          <SkeletonLoader.Box height={80} borderRadius={16} />
          <SkeletonLoader.OrderList count={3} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Feather name="wifi-off" size={32} color={Colors.textSecondary} />
          <Text style={styles.errorTitle}>{error}</Text>
          <TouchableOpacity onPress={() => fetchAll()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchAll(true)}
              colors={[Colors.agri.sabz]}
              tintColor={Colors.agri.sabz}
            />
          }
        >
          {/* Balance Card */}
          <LinearGradient colors={[Colors.agri.sabz, '#059669']} style={styles.balanceCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Feather name="shield" size={20} color="rgba(255,255,255,0.4)" />
            </View>
            <Text style={styles.balanceAmount}>
              ₨ {wallet?.availableBalance.toLocaleString() ?? '0'}
            </Text>

            <View style={styles.cardStats}>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>₨ {wallet?.inEscrow.toLocaleString() ?? '0'}</Text>
                <Text style={styles.statLabel}>Held in Escrow</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statVal}>₨ {wallet?.totalEarned.toLocaleString() ?? '0'}</Text>
                <Text style={styles.statLabel}>Total Spent</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/(buyer)/wallet/topup' as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}>
                <Feather name="plus" size={20} color={Colors.agri.sabz} />
              </View>
              <Text style={styles.actionText}>Add Money</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/(buyer)/wallet/withdraw' as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#F0F9FF' }]}>
                <Feather name="arrow-up-right" size={20} color="#0EA5E9" />
              </View>
              <Text style={styles.actionText}>Withdraw</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/(buyer)/wallet/history' as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#F1F5F9' }]}>
                <Feather name="list" size={20} color="#64748B" />
              </View>
              <Text style={styles.actionText}>History</Text>
            </TouchableOpacity>
          </View>

          {/* Escrow Info */}
          <View style={styles.infoBox}>
            <View style={styles.infoIcon}>
              <Feather name="info" size={16} color="#059669" />
            </View>
            <Text style={styles.infoText}>
              Your funds are protected by our Escrow system. When you buy produce, the money is held
              safely and only released to the farmer after you confirm delivery.
            </Text>
          </View>

          {/* Active Escrow Orders */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Funds in Escrow</Text>
            {escrowOrders.length > 0 && (
              <View style={styles.escrowCountBadge}>
                <Text style={styles.escrowCountText}>{escrowOrders.length}</Text>
              </View>
            )}
          </View>

          {escrowOrders.length === 0 ? (
            <View style={styles.emptyActivity}>
              <Feather name="shield" size={32} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No active escrow</Text>
              <Text style={styles.emptyText}>Orders you place will appear here while funds are locked</Text>
            </View>
          ) : (
            escrowOrders.map(order => (
              <TouchableOpacity
                key={order._id}
                style={styles.escrowCard}
                onPress={() => router.push(`/(buyer)/orders/${order._id}` as any)}
                activeOpacity={0.85}
              >
                <View style={styles.escrowCardLeft}>
                  <View style={styles.escrowIconWrap}>
                    <Feather name="lock" size={16} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.escrowProduct} numberOfLines={1}>
                      {order.product?.title ?? 'Order'}
                    </Text>
                    <Text style={styles.escrowDate}>
                      {new Date(order.createdAt).toLocaleDateString('en-PK', {
                        day: 'numeric', month: 'short',
                      })} · {order.quantity} units
                    </Text>
                  </View>
                </View>
                <View style={styles.escrowRight}>
                  <Text style={styles.escrowAmount}>₨ {order.totalPrice.toLocaleString()}</Text>
                  <View style={styles.escrowStatusChip}>
                    <Text style={styles.escrowStatusText}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingBottom: 20, paddingHorizontal: 24,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },

  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorTitle: { marginTop: 12, fontSize: 15, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: { marginTop: 16, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '800' },

  scrollContent: { padding: 20, paddingBottom: 60 },

  balanceCard: { borderRadius: 28, padding: 24, marginBottom: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  balanceAmount: { color: '#fff', fontSize: 36, fontWeight: '900', marginBottom: 24 },
  cardStats: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { color: '#fff', fontSize: 15, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  actionBtn: { alignItems: 'center', gap: 8 },
  actionIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 12, fontWeight: '800', color: '#1E293B' },

  infoBox: {
    flexDirection: 'row', backgroundColor: '#ECFDF5', borderRadius: 20,
    padding: 16, gap: 12, marginBottom: 24, borderWidth: 1, borderColor: '#D1FAE5',
  },
  infoIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  infoText: { flex: 1, fontSize: 12, color: '#065F46', lineHeight: 18, fontWeight: '600' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B', flex: 1 },
  escrowCountBadge: {
    backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 10,
  },
  escrowCountText: { fontSize: 12, fontWeight: '900', color: '#1E40AF' },

  emptyActivity: {
    alignItems: 'center', padding: 36, backgroundColor: '#fff',
    borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9',
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#334155', marginTop: 12, marginBottom: 4 },
  emptyText: { color: '#94A3B8', fontSize: 12, fontWeight: '600', textAlign: 'center' },

  escrowCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#DBEAFE',
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  escrowCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 12 },
  escrowIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  escrowProduct: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  escrowDate: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  escrowRight: { alignItems: 'flex-end', gap: 4 },
  escrowAmount: { fontSize: 15, fontWeight: '900', color: '#1E40AF' },
  escrowStatusChip: {
    backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  escrowStatusText: { fontSize: 9, fontWeight: '800', color: '#2563EB', textTransform: 'uppercase' },
});
