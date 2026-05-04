import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const MOCK_TRANSACTIONS = [
  { id: 'TX1001', type: 'Credit', amount: 15400, date: '20 Oct 2023', status: 'Success', label: 'Sale: Basmati Rice (100kg)' },
  { id: 'TX1002', type: 'Pending', amount: 8200, date: '18 Oct 2023', status: 'In Escrow', label: 'Sale: Premium Wheat (50kg)' },
  { id: 'TX1003', type: 'Debit', amount: 5000, date: '15 Oct 2023', status: 'Processing', label: 'Withdrawal to JazzCash' },
  { id: 'TX1004', type: 'Credit', amount: 12000, date: '10 Oct 2023', status: 'Success', label: 'Sale: Golden Wheat (80kg)' },
];

export default function FarmerWallet() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ── BALANCE SECTION ───────────────────────────────────── */}
      <View style={styles.gradientSection}>
        <LinearGradient
          colors={['#064e3b', '#065f46']}
          style={styles.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Available Balance</Text>
            <View style={styles.chip}>
              <Text style={styles.chipText}>PKR</Text>
            </View>
          </View>
          <Text style={styles.balanceAmount}>₨ 15,400</Text>
          <View style={styles.cardFooter}>
             <View>
                <Text style={styles.subLabel}>Account ID</Text>
                <Text style={styles.subVal}>DK-7821-FMR</Text>
             </View>
             <TouchableOpacity style={styles.withdrawSmallBtn} onPress={() => {}}>
                <Text style={styles.withdrawSmallText}>Withdraw Assets</Text>
             </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* ── STATS ROW ─────────────────────────────────────────── */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>₨ 45k</Text>
          <Text style={styles.statLabel}>Total Earned</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: '#F59E0B' }]}>₨ 8.2k</Text>
          <Text style={styles.statLabel}>In Escrow</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statVal}>24</Text>
          <Text style={styles.statLabel}>Sales</Text>
        </View>
      </View>

      {/* ── RECENT TRANSACTIONS ────────────────────────────────── */}
      <View style={styles.historySection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {MOCK_TRANSACTIONS.map((tx) => (
          <View key={tx.id} style={styles.txCard}>
            <View style={[styles.txIconWrap, { backgroundColor: tx.type === 'Credit' ? '#ECFDF5' : tx.type === 'Pending' ? '#FFFBEB' : '#F8FAFC' }]}>
               <Feather 
                name={tx.type === 'Credit' ? 'arrow-down-left' : tx.type === 'Debit' ? 'arrow-up-right' : 'clock'} 
                size={20} 
                color={tx.type === 'Credit' ? '#10B981' : tx.type === 'Pending' ? '#F59E0B' : '#64748B'} 
               />
            </View>
            <View style={styles.txInfo}>
               <Text style={styles.txLabel} numberOfLines={1}>{tx.label}</Text>
               <Text style={styles.txDate}>{tx.date} • {tx.id}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
               <Text style={[styles.txAmount, { color: tx.type === 'Credit' ? '#059669' : tx.type === 'Debit' ? '#EF4444' : '#1E293B' }]}>
                 {tx.type === 'Credit' ? '+' : tx.type === 'Debit' ? '-' : ''} ₨ {tx.amount.toLocaleString()}
               </Text>
               <View style={[styles.statusBadge, { backgroundColor: tx.status === 'Success' ? '#DCFCE7' : tx.status === 'In Escrow' ? '#FEF3C7' : '#F1F5F9' }]}>
                  <Text style={[styles.statusText, { color: tx.status === 'Success' ? '#15803D' : tx.status === 'In Escrow' ? '#B45309' : '#475569' }]}>{tx.status}</Text>
               </View>
            </View>
          </View>
        ))}
      </View>

      {/* ── Payout Options ────────────────────────────────────── */}
      <View style={styles.payoutSection}>
        <Text style={styles.sectionTitle}>Connect Payout Methods</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.payoutRow}>
          <PayoutCard name="JazzCash" icon="🟡" color="#FCD34D" />
          <PayoutCard name="Easypaisa" icon="🟢" color="#6EE7B7" />
          <PayoutCard name="Bank Transfer" icon="🏦" color="#94A3B8" />
        </ScrollView>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function PayoutCard({ name, icon, color }: { name: string, icon: string, color: string }) {
  return (
    <TouchableOpacity style={styles.payoutBtn}>
      <View style={[styles.payoutIconWrap, { backgroundColor: color + '30' }]}>
        <Text style={{ fontSize: 24 }}>{icon}</Text>
      </View>
      <Text style={styles.payoutName}>{name}</Text>
      <Text style={styles.payoutStatus}>Not Connected</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  gradientSection: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24 },
  balanceCard: {
    padding: 24, borderRadius: 24, height: 180,
    shadowColor: Colors.agri.sabz, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 15, elevation: 12,
    justifyContent: 'space-between',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  chip: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  chipText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  balanceAmount: { color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  subLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600' },
  subVal: { color: '#fff', fontSize: 12, fontWeight: '700' },
  withdrawSmallBtn: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  withdrawSmallText: { color: Colors.agri.sabz, fontSize: 11, fontWeight: '800' },

  statsRow: {
    flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 24,
    borderRadius: 20, padding: 20, marginBottom: 32,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '700', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#F1F5F9', marginHorizontal: 4 },

  historySection: { paddingHorizontal: 24, marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  seeAll: { color: Colors.agri.sabz, fontSize: 12, fontWeight: '800' },

  txCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    padding: 16, borderRadius: 20, marginBottom: 12,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  txIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txLabel: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  txDate: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  txAmount: { fontSize: 15, fontWeight: '900', marginBottom: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

  payoutSection: { paddingHorizontal: 24, marginBottom: 20 },
  payoutRow: { gap: 12 },
  payoutBtn: {
    backgroundColor: '#fff', width: 140, padding: 16,
    borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9',
    alignItems: 'center',
  },
  payoutIconWrap: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  payoutName: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginBottom: 2 },
  payoutStatus: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
});

