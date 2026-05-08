import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Platform,
  ActivityIndicator, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import userService from '@/services/user.service';
import orderService, { Order } from '@/services/order.service';

export default function FarmerWalletScreen() {
  const [wallet, setWallet] = useState<{
    availableBalance: number;
    totalEarned: number;
    inEscrow: number;
    totalSales: number;
  } | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [walletData, orders] = await Promise.all([
        userService.getWallet(),
        orderService.getMyOrders(),
      ]);
      setWallet(walletData);
      setRecentOrders(orders.filter(o => o.status === 'delivered').slice(0, 10));
    } catch {
      // silently fail — show zeros
      setWallet({ availableBalance: 0, totalEarned: 0, inEscrow: 0, totalSales: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFB' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} colors={[Colors.primary]} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>My Wallet</Text>
        <Text style={styles.subheading}>Escrow-protected earnings</Text>
      </View>

      {/* Balance Card */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryMid]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>₨ {wallet?.availableBalance.toLocaleString('en-PK', { minimumFractionDigits: 0 }) ?? '0'}</Text>
        <Text style={styles.balanceSub}>After 5% platform fee</Text>

        <View style={styles.miniStats}>
          <View style={styles.miniStat}>
            <Text style={styles.miniStatVal}>₨ {wallet?.inEscrow.toLocaleString() ?? '0'}</Text>
            <Text style={styles.miniStatLabel}>In Escrow</Text>
          </View>
          <View style={styles.miniDivider} />
          <View style={styles.miniStat}>
            <Text style={styles.miniStatVal}>{wallet?.totalSales ?? 0}</Text>
            <Text style={styles.miniStatLabel}>Completed Sales</Text>
          </View>
          <View style={styles.miniDivider} />
          <View style={styles.miniStat}>
            <Text style={styles.miniStatVal}>₨ {wallet?.totalEarned.toLocaleString() ?? '0'}</Text>
            <Text style={styles.miniStatLabel}>Total Earned</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Escrow Info */}
      <View style={styles.infoCard}>
        <Feather name="shield" size={20} color="#2563EB" />
        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitle}>Escrow Protection Active</Text>
          <Text style={styles.infoDesc}>
            Your earnings are held securely until delivery is confirmed by the buyer.
            Funds are released automatically within 24 hours of delivery confirmation.
          </Text>
        </View>
      </View>

      {/* Withdrawal Notice */}
      <View style={styles.withdrawCard}>
        <View style={styles.withdrawRow}>
          <Feather name="download" size={18} color={Colors.primary} />
          <Text style={styles.withdrawTitle}>Withdraw Funds</Text>
        </View>
        <Text style={styles.withdrawDesc}>
          JazzCash / Easypaisa payouts are being integrated. You'll receive payments
          directly to your registered mobile wallet after each confirmed delivery.
        </Text>
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </View>
      </View>

      {/* Recent Transactions */}
      <Text style={styles.sectionTitle}>Recent Earnings</Text>
      {recentOrders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 36, marginBottom: 8 }}>💰</Text>
          <Text style={styles.emptyTitle}>No completed sales yet</Text>
          <Text style={styles.emptyDesc}>Earnings from delivered orders will appear here.</Text>
        </View>
      ) : (
        recentOrders.map(order => (
          <View key={order._id} style={styles.txCard}>
            <View style={styles.txLeft}>
              <View style={styles.txIcon}>
                <Feather name="check-circle" size={16} color={Colors.success} />
              </View>
              <View>
                <Text style={styles.txTitle}>{order.product?.title ?? 'Order'}</Text>
                <Text style={styles.txDate}>
                  {new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            </View>
            <Text style={styles.txAmount}>+₨{(order.totalPrice * 0.95).toLocaleString()}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFB' },
  content: { paddingBottom: 80 },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  heading: { fontSize: 24, fontWeight: '900', color: '#111827', letterSpacing: -0.5 },
  subheading: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  balanceCard: {
    margin: 20, borderRadius: 24, padding: 24,
  },
  balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '700', marginBottom: 6 },
  balanceAmount: { fontSize: 40, fontWeight: '900', color: '#fff', letterSpacing: -1.5 },
  balanceSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2, marginBottom: 24 },
  miniStats: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 14 },
  miniStat: { flex: 1, alignItems: 'center' },
  miniStatVal: { fontSize: 14, fontWeight: '900', color: '#fff' },
  miniStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '700', marginTop: 2, textAlign: 'center' },
  miniDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: '#EFF6FF', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  infoTitle: { fontSize: 13, fontWeight: '800', color: '#1E40AF', marginBottom: 4 },
  infoDesc: { fontSize: 12, color: '#3B82F6', lineHeight: 18, fontWeight: '500' },

  withdrawCard: {
    marginHorizontal: 20, marginBottom: 20,
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  withdrawRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  withdrawTitle: { fontSize: 15, fontWeight: '800', color: '#111827' },
  withdrawDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  comingSoonBadge: {
    alignSelf: 'flex-start', marginTop: 10,
    backgroundColor: Colors.primaryLight, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  comingSoonText: { fontSize: 11, fontWeight: '800', color: Colors.primary },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginHorizontal: 20, marginBottom: 12 },
  emptyCard: {
    marginHorizontal: 20, alignItems: 'center', padding: 32,
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },

  txCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 20, marginBottom: 10,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  txIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center',
  },
  txTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 2 },
  txDate: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  txAmount: { fontSize: 16, fontWeight: '900', color: Colors.success },
});
