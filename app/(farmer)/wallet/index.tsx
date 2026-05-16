import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { SkeletonLoader } from '@/components/ui';
import userService, { WalletData, WalletTransaction } from '@/services/user.service';

export default function FarmerWalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [recentEarnings, setRecentEarnings] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const [walletData, history] = await Promise.all([
        userService.getWallet(),
        userService.getWalletHistory(),
      ]);
      setWallet(walletData);
      // Only show actual payments received (escrow_release credits to availableBalance)
      const earnings = history
        .filter(tx => tx.type === 'escrow_release' && tx.direction === 'credit')
        .slice(0, 10);
      setRecentEarnings(earnings);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load wallet. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { fetchAll(); }, [fetchAll])
  );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
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
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.heading}>My Wallet</Text>
        <Text style={styles.subheading}>Escrow-protected earnings</Text>
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 12 }}>
          <SkeletonLoader.Box height={180} borderRadius={24} />
          <SkeletonLoader.Box height={80} borderRadius={16} />
          <SkeletonLoader.OrderList count={3} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Feather name="wifi-off" size={40} color={Colors.textSecondary} />
          <Text style={styles.errorTitle}>Could not load wallet</Text>
          <Text style={styles.errorDesc}>{error}</Text>
          <TouchableOpacity onPress={() => fetchAll()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Balance Card */}
          <LinearGradient
            colors={[Colors.primary, Colors.primaryMid]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>
              ₨ {wallet?.availableBalance.toLocaleString('en-PK', { minimumFractionDigits: 0 }) ?? '0'}
            </Text>
            <Text style={styles.balanceSub}>After 5% platform fee</Text>

            <View style={styles.miniStats}>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatVal}>₨ {wallet?.inEscrow.toLocaleString() ?? '0'}</Text>
                <Text style={styles.miniStatLabel}>Pending{'\n'}Delivery</Text>
              </View>
              <View style={styles.miniDivider} />
              <View style={styles.miniStat}>
                <Text style={styles.miniStatVal}>{wallet?.totalSales ?? 0}</Text>
                <Text style={styles.miniStatLabel}>Completed{'\n'}Sales</Text>
              </View>
              <View style={styles.miniDivider} />
              <View style={styles.miniStat}>
                <Text style={styles.miniStatVal}>₨ {wallet?.totalEarned.toLocaleString() ?? '0'}</Text>
                <Text style={styles.miniStatLabel}>Total{'\n'}Earned</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/(farmer)/wallet/withdraw' as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.primaryLight }]}>
                <Feather name="download" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.actionText}>Withdraw</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/(farmer)/wallet/history' as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#F1F5F9' }]}>
                <Feather name="list" size={20} color="#64748B" />
              </View>
              <Text style={styles.actionText}>History</Text>
            </TouchableOpacity>
          </View>

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

          {/* Platform Fee Info */}
          <View style={styles.feeInfoCard}>
            <Text style={styles.feeInfoText}>
              Platform fee: 5% is deducted from each sale. Shown amounts reflect your net earnings.
            </Text>
          </View>

          {/* Recent Earnings */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Earnings</Text>
            <TouchableOpacity onPress={() => router.push('/(farmer)/wallet/history' as any)}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentEarnings.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>💰</Text>
              <Text style={styles.emptyTitle}>No completed sales yet</Text>
              <Text style={styles.emptyDesc}>Earnings from delivered orders will appear here.</Text>
            </View>
          ) : (
            recentEarnings.map(tx => (
              <View key={tx._id} style={styles.txCard}>
                <View style={styles.txLeft}>
                  <View style={styles.txIcon}>
                    <Feather name="check-circle" size={16} color={Colors.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txTitle} numberOfLines={1}>
                      {tx.description?.replace(/^Payment released for order #?/i, 'Order #') ?? 'Sale Payment'}
                    </Text>
                    <Text style={styles.txDate}>
                      Received · {new Date(tx.createdAt).toLocaleDateString('en-PK', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
                <Text style={styles.txAmount}>+₨ {tx.amount.toLocaleString()}</Text>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFB' },
  content: { paddingBottom: 80 },

  header: {
    paddingHorizontal: 20, paddingBottom: 20,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  heading: { fontSize: 24, fontWeight: '900', color: '#111827', letterSpacing: -0.5 },
  subheading: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  errorContainer: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  errorTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginTop: 16, marginBottom: 8 },
  errorDesc: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    marginTop: 20, backgroundColor: Colors.primary,
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14,
  },
  retryText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  balanceCard: { margin: 20, borderRadius: 24, padding: 24 },
  balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '700', marginBottom: 6 },
  balanceAmount: { fontSize: 40, fontWeight: '900', color: '#fff', letterSpacing: -1.5 },
  balanceSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2, marginBottom: 24 },
  miniStats: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16, padding: 14,
  },
  miniStat: { flex: 1, alignItems: 'center' },
  miniStatVal: { fontSize: 14, fontWeight: '900', color: '#fff' },
  miniStatLabel: {
    fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '700',
    marginTop: 2, textAlign: 'center',
  },
  miniDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },

  actionRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 32,
    marginHorizontal: 20, marginBottom: 16,
  },
  actionBtn: { alignItems: 'center', gap: 8 },
  actionIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 12, fontWeight: '800', color: '#1E293B' },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    marginHorizontal: 20, marginBottom: 20,
    backgroundColor: '#EFF6FF', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  infoTitle: { fontSize: 13, fontWeight: '800', color: '#1E40AF', marginBottom: 4 },
  infoDesc: { fontSize: 12, color: '#3B82F6', lineHeight: 18, fontWeight: '500' },

  feeInfoCard: {
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#FCD34D',
  },
  feeInfoText: {
    fontSize: 12, color: '#92400E', fontWeight: '600', lineHeight: 18,
  },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 20, marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  seeAll: { fontSize: 13, fontWeight: '800', color: Colors.primary },

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
  txAmount: { fontSize: 15, fontWeight: '900', color: Colors.success },
});
