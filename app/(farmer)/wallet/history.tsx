import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { SkeletonLoader } from '@/components/ui';
import userService, { WalletTransaction } from '@/services/user.service';

// ── Human-friendly labels ─────────────────────────────────────────────────────
function getLabel(type: WalletTransaction['type'], direction: WalletTransaction['direction']): string {
  if (type === 'escrow_release' && direction === 'credit')  return 'Sale Payment Received';
  if (type === 'escrow_release' && direction === 'debit')   return 'Escrow Released to Balance';
  if (type === 'escrow_lock'    && direction === 'credit')  return 'Order Placed — Escrow Held';
  if (type === 'escrow_lock'    && direction === 'debit')   return 'Escrow Deducted';
  if (type === 'order_refund'   && direction === 'credit')  return 'Order Refund Received';
  if (type === 'order_refund'   && direction === 'debit')   return 'Order Cancelled — Escrow';
  if (type === 'deposit')   return 'Wallet Top-up';
  if (type === 'withdrawal') return 'Withdrawal';
  if (type === 'payout')    return 'Delivery Fee Earned';
  if (type === 'order_payment') return 'Order Payment';
  return type.replace(/_/g, ' ');
}

const ICON_MAP: Record<WalletTransaction['type'], React.ComponentProps<typeof Feather>['name']> = {
  deposit:         'plus-circle',
  withdrawal:      'arrow-up-circle',
  order_payment:   'shopping-cart',
  order_refund:    'rotate-ccw',
  payout:          'award',
  escrow_lock:     'lock',
  escrow_release:  'unlock',
};

// ── Single transaction row ────────────────────────────────────────────────────
function TransactionItem({ item }: { item: WalletTransaction }) {
  const isCredit = item.direction === 'credit';

  return (
    <View style={styles.itemContainer}>
      <View style={[styles.iconWrap, isCredit ? styles.creditBg : styles.debitBg]}>
        <Feather
          name={ICON_MAP[item.type] ?? 'activity'}
          size={18}
          color={isCredit ? Colors.success : Colors.error}
        />
      </View>

      <View style={styles.itemDetails}>
        <Text style={styles.itemLabel}>{getLabel(item.type, item.direction)}</Text>
        <Text style={styles.itemDate} numberOfLines={1}>
          {new Date(item.createdAt).toLocaleString('en-PK', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: 'numeric', minute: '2-digit',
          })}
        </Text>
        <Text style={styles.balanceAfter}>
          Balance after: ₨ {item.balanceAfter.toLocaleString()}
        </Text>
      </View>

      <Text style={[styles.itemAmount, isCredit ? styles.creditText : styles.debitText]}>
        {isCredit ? '+' : '-'}₨ {item.amount.toLocaleString()}
      </Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
type Tab = 'all' | 'credit' | 'debit';

export default function WalletHistoryScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [activeTab, setActiveTab]       = useState<Tab>('all');
  const [loading,    setLoading]        = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [error,      setError]          = useState<string | null>(null);

  const fetchHistory = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const data = await userService.getWalletHistory();
      setTransactions(data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load transaction history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchHistory(); }, [fetchHistory]));

  const filtered =
    activeTab === 'credit' ? transactions.filter(t => t.direction === 'credit') :
    activeTab === 'debit'  ? transactions.filter(t => t.direction === 'debit')  :
    transactions;

  const totalIn  = transactions.filter(t => t.direction === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter(t => t.direction === 'debit').reduce((s, t)  => s + t.amount, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.replace('/(farmer)/wallet')} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
      </View>

      {loading ? (
        <View style={{ padding: 20, gap: 12 }}>
          <SkeletonLoader.Box height={72} borderRadius={16} />
          <SkeletonLoader.OrderList count={6} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Feather name="wifi-off" size={32} color={Colors.textSecondary} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchHistory()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Summary row */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total In</Text>
              <Text style={[styles.summaryVal, { color: Colors.success }]}>
                +₨ {totalIn.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Out</Text>
              <Text style={[styles.summaryVal, { color: Colors.error }]}>
                -₨ {totalOut.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Transactions</Text>
              <Text style={styles.summaryVal}>{transactions.length}</Text>
            </View>
          </View>

          {/* Filter tabs */}
          <View style={styles.tabs}>
            {(['all', 'credit', 'debit'] as Tab[]).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'all' ? 'All' : tab === 'credit' ? 'Money In' : 'Money Out'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={filtered}
            renderItem={({ item }) => <TransactionItem item={item} />}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="clock" size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No transactions</Text>
                <Text style={styles.emptySubtitle}>
                  {activeTab === 'all' ? 'Your wallet activity will appear here.' :
                   activeTab === 'credit' ? 'No incoming payments yet.' :
                   'No outgoing transactions yet.'}
                </Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchHistory(true)}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },

  summaryRow: {
    flexDirection: 'row', backgroundColor: '#fff',
    marginHorizontal: 20, marginTop: 16, borderRadius: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  summaryCard: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  summaryLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '700', marginBottom: 4 },
  summaryVal: { fontSize: 14, fontWeight: '900', color: '#111827' },
  summaryDivider: { width: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },

  tabs: {
    flexDirection: 'row', marginHorizontal: 20, marginTop: 14, marginBottom: 4,
    backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
  tabTextActive: { color: Colors.textPrimary },

  listContent: { padding: 20, paddingTop: 12 },

  itemContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', padding: 14, borderRadius: 16,
    marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9',
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  creditBg: { backgroundColor: Colors.successLight },
  debitBg:  { backgroundColor: Colors.errorLight },
  itemDetails: { flex: 1 },
  itemLabel: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  itemDate:  { fontSize: 11, color: '#64748B', fontWeight: '500', marginBottom: 2 },
  balanceAfter: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  itemAmount: { fontSize: 14, fontWeight: '900' },
  creditText: { color: Colors.success },
  debitText:  { color: Colors.error },

  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyTitle:    { fontSize: 18, fontWeight: '800', color: '#334155', marginTop: 16 },
  emptySubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, textAlign: 'center' },

  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center', marginTop: 12, marginBottom: 20 },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
