import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { SkeletonLoader } from '@/components/ui';
import userService from '@/services/user.service';

export default function BuyerWalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [wallet, setWallet] = useState<{
    availableBalance: number;
    inEscrow: number;
    totalEarned: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const data = await userService.getWallet();
      setWallet(data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load wallet');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

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
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Feather name="wifi-off" size={32} color={Colors.textSecondary} />
          <Text style={{ marginTop: 12, fontSize: 15, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' }}>{error}</Text>
          <TouchableOpacity onPress={() => fetchWallet()} style={{ marginTop: 16, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchWallet(true)} colors={[Colors.agri.sabz]} />
        }
      >
        <LinearGradient
          colors={[Colors.agri.sabz, '#059669']}
          style={styles.balanceCard}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Feather name="shield" size={20} color="rgba(255,255,255,0.4)" />
          </View>
          <Text style={styles.balanceAmount}>₨ {wallet?.availableBalance.toLocaleString() ?? '0'}</Text>
          
          <View style={styles.cardStats}>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>₨ {wallet?.inEscrow.toLocaleString() ?? '0'}</Text>
              <Text style={styles.statLabel}>Held in Escrow</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>₨ {wallet?.totalEarned.toLocaleString() ?? '0'}</Text>
              <Text style={styles.statLabel}>Total Spend</Text>
            </View>
          </View>
        </LinearGradient>

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
            onPress={() => Alert.alert('Coming Soon', 'Withdrawals for buyers will be available soon.')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F0F9FF' }]}>
              <Feather name="arrow-up-right" size={20} color="#0EA5E9" />
            </View>
            <Text style={styles.actionText}>Withdraw</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => router.push('/(buyer)/wallet/history')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F1F5F9' }]}>
              <Feather name="list" size={20} color="#64748B" />
            </View>
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoIcon}>
            <Feather name="info" size={16} color="#059669" />
          </View>
          <Text style={styles.infoText}>
            Your funds are protected by our Escrow system. When you buy produce, the money is held safely and only released to the farmer after you confirm delivery.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Escrow Activities</Text>
        <View style={styles.emptyActivity}>
          <Feather name="activity" size={32} color="#CBD5E1" />
          <Text style={styles.emptyText}>No active escrow transactions</Text>
        </View>

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
  scrollContent: { padding: 20 },
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
  infoBox: { flexDirection: 'row', backgroundColor: '#ECFDF5', borderRadius: 20, padding: 16, gap: 12, marginBottom: 24, borderWidth: 1, borderColor: '#D1FAE5' },
  infoIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  infoText: { flex: 1, fontSize: 12, color: '#065F46', lineHeight: 18, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B', marginBottom: 12 },
  emptyActivity: { alignItems: 'center', padding: 40, backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  emptyText: { color: '#94A3B8', fontSize: 13, fontWeight: '600', marginTop: 12 },
});
