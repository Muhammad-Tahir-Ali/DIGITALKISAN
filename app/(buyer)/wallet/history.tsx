import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { SkeletonLoader } from '@/components/ui';
import userService, { WalletTransaction } from '@/services/user.service';

function TransactionItem({ item }: { item: WalletTransaction }) {
  const isCredit = ['deposit', 'escrow_release', 'order_refund'].includes(item.type);
  const iconMap: Record<WalletTransaction['type'], React.ComponentProps<typeof Feather>['name']> = {
    deposit: 'plus-circle',
    withdrawal: 'arrow-up-circle',
    order_payment: 'shopping-cart',
    order_refund: 'rotate-ccw',
    payout: 'award',
    escrow_lock: 'lock',
    escrow_release: 'unlock',
  };

  return (
    <View style={styles.itemContainer}>
      <View style={[styles.iconContainer, isCredit ? styles.creditBg : styles.debitBg]}>
        <Feather name={iconMap[item.type] || 'activity'} size={20} color={isCredit ? Colors.success : Colors.error} />
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemDescription} numberOfLines={1}>{item.description}</Text>
        <Text style={styles.itemDate}>
          {new Date(item.createdAt).toLocaleString('en-PK', {
            day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit'
          })}
        </Text>
      </View>
      <Text style={[styles.itemAmount, isCredit ? styles.creditText : styles.debitText]}>
        {isCredit ? '+' : '-'}₨ {item.amount.toLocaleString()}
      </Text>
    </View>
  );
}

export default function WalletHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
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

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="clock" size={48} color="#CBD5E1" />
      <Text style={styles.emptyTitle}>No Transactions Yet</Text>
      <Text style={styles.emptySubtitle}>Your wallet activity will appear here.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
      </View>

      {loading ? (
        <View style={{ padding: 20, gap: 12 }}>
          <SkeletonLoader.OrderList count={6} />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Feather name="wifi-off" size={32} color={Colors.textSecondary} />
          <Text style={{ marginTop: 12, fontSize: 15, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' }}>{error}</Text>
          <TouchableOpacity onPress={() => fetchHistory()} style={{ marginTop: 16, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={({ item }) => <TransactionItem item={item} />}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchHistory(true)}
              colors={[Colors.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  listContent: { padding: 20 },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  creditBg: { backgroundColor: Colors.successLight },
  debitBg: { backgroundColor: Colors.errorLight },
  itemDetails: { flex: 1 },
  itemDescription: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  itemDate: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  itemAmount: { fontSize: 15, fontWeight: '800' },
  creditText: { color: Colors.success },
  debitText: { color: Colors.error },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '40%',
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#334155', marginTop: 16 },
  emptySubtitle: { fontSize: 13, color: '#64748B', marginTop: 4 },
});
