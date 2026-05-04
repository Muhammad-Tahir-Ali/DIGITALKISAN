import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { MOCK_ORDERS, MOCK_CROPS } from '@/constants/mockData';

const { width } = Dimensions.get('window');

export default function FarmerDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setRole = useAuthStore((s) => s.setRole);

  const isVerified = user?.isVerified ?? false;

  const handleSwitchToBuyer = () => {
    setRole('buyer');
    router.replace('/(buyer)/home');
  };

  const pendingOrders = MOCK_ORDERS.filter((o) => o.status === 'Active');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* ── 1. PREMIUM HEADER ────────────────────────────────────── */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#064e3b', '#065f46', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Decorative elements */}
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />

        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleSwitchToBuyer} style={styles.switchBtn}>
            <Text style={styles.switchText}>Switch to Buyer 🔄</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="bell" size={20} color="#fff" />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.userInfo}>
          <View>
            <Text style={styles.greeting}>Salaam,</Text>
            <Text style={styles.name}>{user?.name ?? 'Farmer'} 👋</Text>
          </View>
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <Feather name="shield" size={12} color="#fff" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>

        {/* Floating Stats Quick View */}
        <View style={styles.floatingStats}>
          <View style={styles.floatStatItem}>
            <Text style={styles.floatStatVal}>₨ 12k</Text>
            <Text style={styles.floatStatLabel}>Today</Text>
          </View>
          <View style={styles.floatDivider} />
          <View style={styles.floatStatItem}>
            <Text style={styles.floatStatVal}>4</Text>
            <Text style={styles.floatStatLabel}>New Ads</Text>
          </View>
          <View style={styles.floatDivider} />
          <View style={styles.floatStatItem}>
            <Text style={styles.floatStatVal}>98%</Text>
            <Text style={styles.floatStatLabel}>Rating</Text>
          </View>
        </View>
      </View>

      {/* ── 2. OVERVIEW CARDS ───────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dashboard Overview</Text>
        </View>
        <View style={styles.overviewGrid}>
          <OverviewCard icon="box" color={Colors.agri.sabz} label="Total Products" value="12" subtext="In inventory" />
          <OverviewCard icon="activity" color="#F59E0B" label="Active Orders" value="3" subtext="Post-escrow" />
          <OverviewCard icon="check-circle" color="#10B981" label="Completed" value="28" subtext="Last 30 days" />
          <OverviewCard icon="dollar-sign" color="#0EA5E9" label="Earnings" value="₨ 45k" subtext="Total paid out" onPress={() => router.push('/(farmer)/wallet' as any)} />
        </View>
      </View>

      {/* ── 3. QUICK ACTIONS ───────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionRow}>
          <QuickAction icon="plus-circle" label="Add Product" color={Colors.agri.sabz} onPress={() => router.push('/(farmer)/products/add' as any)} />
          <QuickAction icon="grid" label="My Products" color="#6366F1" onPress={() => router.push('/(farmer)/products' as any)} />
          <QuickAction icon="shopping-bag" label="Orders" color="#EC4899" onPress={() => router.push('/(farmer)/orders' as any)} />
          <QuickAction icon="credit-card" label="Wallet" color="#8B5CF6" onPress={() => router.push('/(farmer)/wallet' as any)} />
        </ScrollView>
      </View>

      {/* ── 4. PENDING ORDERS ──────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pending Orders</Text>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeText}>{pendingOrders.length}</Text>
          </View>
        </View>

        {pendingOrders.length > 0 ? (
          pendingOrders.map((order) => (
            <TouchableOpacity key={order.id} style={styles.orderCard} onPress={() => router.push(`/(farmer)/orders/${order.id}` as any)}>
              <View style={styles.orderTop}>
                <Text style={styles.orderId}>{order.id}</Text>
                <Text style={styles.orderDate}>{order.date}</Text>
              </View>
              <View style={styles.orderInfo}>
                <Text style={styles.orderLabel}>{order.items.length} items • Transaction Secure</Text>
                <Text style={styles.orderTotal}>₨ {order.total}</Text>
              </View>
              <View style={styles.orderFooter}>
                <Text style={styles.viewOrderBtn}>Process Order →</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No pending orders yet 🌾</Text>
          </View>
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function OverviewCard({ icon, label, value, subtext, color, onPress }: { icon: string; label: string; value: string; subtext: string; color: string; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1} style={styles.overviewCard}>
      <View style={[styles.cardIconWrap, { backgroundColor: color + '15' }]}>
        <Feather name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.cardVal}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardSub}>{subtext}</Text>
    </TouchableOpacity>
  );
}

function QuickAction({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.actionBtn}>
      <View style={[styles.actionIcon, { backgroundColor: color }]}>
        <Feather name={icon as any} size={24} color="#fff" />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  header: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  headerCircle1: {
    position: 'absolute', top: -50, right: -50,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerCircle2: {
    position: 'absolute', bottom: -30, left: -20,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 24,
  },
  switchBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
  },
  switchText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  iconBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 12, right: 12,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#065f46',
  },
  userInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
  name: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, marginTop: 8, gap: 4,
  },
  verifiedText: { color: '#fff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  
  floatingStats: {
    position: 'absolute', bottom: -35, left: 24, right: 24,
    backgroundColor: '#fff', borderRadius: 20,
    flexDirection: 'row', padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 10, elevation: 6,
  },
  floatStatItem: { flex: 1, alignItems: 'center' },
  floatStatVal: { fontSize: 18, fontWeight: '900', color: '#111827' },
  floatStatLabel: { fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: '600' },
  floatDivider: { width: 1, backgroundColor: '#F1F5F9', marginHorizontal: 10 },

  section: { paddingHorizontal: 24, marginTop: 70 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B', flex: 1 },
  
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  overviewCard: {
    width: (width - 60) / 2, backgroundColor: '#fff',
    borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F1F5F9',
  },
  cardIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  cardVal: { fontSize: 20, fontWeight: '900', color: '#111827', marginBottom: 2 },
  cardLabel: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 2 },
  cardSub: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },

  actionRow: { paddingBottom: 10, gap: 12 },
  actionBtn: { width: 100, alignItems: 'center' },
  actionIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: '800', color: '#475569', textAlign: 'center' },

  badgeCount: { backgroundColor: '#FCD34D', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '900', color: '#92400E' },

  orderCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9',
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  orderId: { fontSize: 14, fontWeight: '900', color: '#1E293B' },
  orderDate: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  orderInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  orderTotal: { fontSize: 18, fontWeight: '900', color: Colors.agri.sabz },
  orderFooter: { borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingTop: 12 },
  viewOrderBtn: { fontSize: 14, fontWeight: '800', color: Colors.agri.sabz, textAlign: 'right' },

  emptyCard: { backgroundColor: '#fff', padding: 32, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9', borderStyle: 'dashed' },
  emptyText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
});

