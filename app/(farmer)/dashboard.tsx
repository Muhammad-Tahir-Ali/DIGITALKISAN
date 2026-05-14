import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, Alert, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import userService, { DashboardStats } from '@/services/user.service';
import orderService, { Order } from '@/services/order.service';
import notificationService, { Notification } from '@/services/notification.service';
import { SkeletonLoader, StatusBadge } from '@/components/ui';

const { width } = Dimensions.get('window');

function formatOrderId(id: string) {
  return `#DK-${id.slice(-8).toUpperCase()}`;
}

export default function FarmerDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const setRole = useAuthStore((s) => s.setRole);

  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAll = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      const [statsData, ordersData, notifsData] = await Promise.all([
        userService.getDashboardStats(),
        orderService.getMyOrders(),
        notificationService.getMyNotifications(),
      ]);
      setStats(statsData);
      setOrders(ordersData);
      setNotifications(notifsData);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load dashboard. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAll();

    // Poll notifications every 30s to catch async AI / backend updates
    let errorCount = 0;
    const interval = setInterval(async () => {
      try {
        const notifs = await notificationService.getMyNotifications();
        setNotifications(notifs);
        errorCount = 0;
      } catch (e) {
        errorCount++;
        if (errorCount >= 3) {
          // Stop polling silently after 3 consecutive failures to avoid spam
          clearInterval(interval);
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchAll]);

  const unreadNotifs = notifications.filter(n => !n.isRead);

  const handleNotificationsClick = async () => {
    if (notifications.length === 0) {
      Alert.alert('Notifications', 'You have no notifications.');
      return;
    }

    // Show all unread first, then all notifications
    const toShow = unreadNotifs.length > 0 ? unreadNotifs : notifications;

    const showNext = (index: number) => {
      if (index >= toShow.length) {
        // All shown — mark all as read
        if (unreadNotifs.length > 0) {
          notificationService.markAllAsRead().catch(() => {});
          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        }
        return;
      }
      const notif = toShow[index];
      const isLast = index === toShow.length - 1;
      Alert.alert(
        notif.title,
        notif.message,
        [
          { text: isLast ? 'Done' : 'Next', onPress: () => showNext(index + 1) },
        ]
      );
    };

    showNext(0);
  };

  // Only show orders that need farmer action (new / unprocessed)
  const newOrders = orders.filter(o => o.status === 'pending' || o.status === 'paid');

  const handleSwitchToBuyer = () => {
    setRole('buyer');
    router.replace('/(buyer)/home' as any);
  };

  return (
    <ScrollView
      style={styles.container}
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
      {error && (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={14} color={Colors.error} />
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchAll()}>
            <Text style={styles.errorRetryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── 1. PREMIUM HEADER ────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <LinearGradient
          colors={['#064e3b', '#065f46', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />

        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleSwitchToBuyer} style={styles.switchBtn}>
            <Feather name="repeat" size={12} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.switchText}>Switch to Buyer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleNotificationsClick}>
            <Feather name="bell" size={20} color="#fff" />
            {unreadNotifs.length > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadNotifs.length > 9 ? '9+' : unreadNotifs.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.userInfo}>
          <View>
            <Text style={styles.greeting}>Salaam,</Text>
            <Text style={styles.name}>{user?.name ?? 'Farmer'}</Text>
          </View>
          {user?.isVerified && (
            <View style={styles.verifiedBadge}>
              <Feather name="shield" size={12} color="#fff" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>

        {/* Floating Stats Quick View */}
        <View style={styles.floatingStats}>
          <View style={styles.floatStatItem}>
            <Text style={styles.floatStatVal}>₨ {stats?.todaysEarnings?.toLocaleString() ?? '0'}</Text>
            <Text style={styles.floatStatLabel}>Today</Text>
          </View>
          <View style={styles.floatDivider} />
          <View style={styles.floatStatItem}>
            <Text style={styles.floatStatVal}>{stats?.newAdsToday ?? 0}</Text>
            <Text style={styles.floatStatLabel}>New Ads</Text>
          </View>
          <View style={styles.floatDivider} />
          <View style={styles.floatStatItem}>
            <Text style={styles.floatStatVal}>{stats?.rating?.toFixed(1) ?? '0.0'}★</Text>
            <Text style={styles.floatStatLabel}>Rating</Text>
          </View>
        </View>
      </View>

      {/* ── 2. OVERVIEW CARDS ───────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dashboard Overview</Text>
        </View>
        {loading ? (
          <View style={{ paddingHorizontal: 4 }}><SkeletonLoader.StatGrid count={4} /></View>
        ) : (
          <View style={styles.overviewGrid}>
            <OverviewCard icon="box"          color={Colors.agri.sabz} label="Total Products"  value={stats?.totalProducts?.toString() ?? '0'}                           subtext="In inventory" />
            <OverviewCard icon="activity"     color="#F59E0B"           label="Active Orders"   value={stats?.activeOrdersCount?.toString() ?? '0'}                      subtext="Post-escrow" />
            <OverviewCard icon="check-circle" color="#10B981"           label="Completed"       value={stats?.completedOrdersCount?.toString() ?? '0'}                   subtext="All time" />
            <OverviewCard icon="dollar-sign"  color="#0EA5E9"           label="Earnings"        value={`₨ ${stats?.totalEarnings?.toLocaleString() ?? '0'}`}             subtext="Total paid out" onPress={() => router.push('/(farmer)/wallet' as any)} />
          </View>
        )}
      </View>

      {/* ── 3. QUICK ACTIONS ───────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionRow}>
          <QuickAction icon="plus"        label="Add Product" color={Colors.primary} onPress={() => router.push('/(farmer)/products/add' as any)} />
          <QuickAction icon="grid"        label="My Products" color={Colors.primary} onPress={() => router.push('/(farmer)/products' as any)} />
          <QuickAction icon="package"     label="Orders"      color={Colors.primary} onPress={() => router.push('/(farmer)/orders' as any)} />
          <QuickAction icon="credit-card" label="Wallet"      color={Colors.primary} onPress={() => router.push('/(farmer)/wallet' as any)} />
        </ScrollView>
      </View>

      {/* ── 4. NEW ORDERS ─────────────────────────────────────── */}
      <View style={[styles.section, { marginBottom: 40 }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>New Orders</Text>
          {newOrders.length > 0 && (
            <View style={styles.badgeCount}>
              <Text style={styles.badgeText}>{newOrders.length}</Text>
            </View>
          )}
        </View>

        {loading ? (
          <View style={{ gap: 10, paddingHorizontal: 4 }}>
            <SkeletonLoader.OrderList count={2} />
          </View>
        ) : newOrders.length > 0 ? (
          newOrders.map((order) => (
            <TouchableOpacity
              key={order._id}
              style={styles.orderCard}
              onPress={() => router.push(`/(farmer)/orders/${order._id}` as any)}
              activeOpacity={0.85}
            >
              <View style={styles.orderTop}>
                <Text style={styles.orderId}>{formatOrderId(order._id)}</Text>
                <StatusBadge status={order.status} size="sm" />
              </View>
              <View style={styles.orderInfo}>
                <Text style={styles.orderLabel}>
                  {order.quantity} units · {order.product?.title || 'Unknown Product'}
                </Text>
                <Text style={styles.orderTotal}>₨ {order.totalPrice.toLocaleString()}</Text>
              </View>
              <View style={styles.orderMeta}>
                <Feather name="user" size={11} color={Colors.textTertiary} />
                <Text style={styles.orderMetaText}>{order.buyer?.name ?? 'Buyer'}</Text>
                <Text style={styles.orderMetaDot}>·</Text>
                <Feather name="clock" size={11} color={Colors.textTertiary} />
                <Text style={styles.orderMetaText}>
                  {new Date(order.createdAt).toLocaleString('en-PK', {
                    month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </View>
              <View style={styles.orderFooter}>
                <Text style={styles.viewOrderBtn}>Process Order →</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Feather name="inbox" size={24} color={Colors.textSecondary} />
            </View>
            <Text style={styles.emptyText}>No new orders</Text>
            <Text style={styles.emptySubText}>New buyer orders will appear here</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function OverviewCard({
  icon, label, value, subtext, color, onPress,
}: {
  icon: string; label: string; value: string; subtext: string; color: string; onPress?: () => void;
}) {
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

function QuickAction({
  icon, label, color, onPress,
}: {
  icon: string; label: string; color: string; onPress?: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.actionBtn} activeOpacity={0.7}>
      <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
        <Feather name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.errorLight, paddingHorizontal: 20, paddingVertical: 10,
  },
  errorBannerText: { flex: 1, fontSize: 13, color: Colors.error, fontWeight: '600' },
  errorRetryText: { fontSize: 13, color: Colors.error, fontWeight: '800', textDecorationLine: 'underline' },

  header: {
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
    flexDirection: 'row', alignItems: 'center',
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
  notifBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#EF4444',
    borderWidth: 1.5, borderColor: '#065f46',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: { fontSize: 9, fontWeight: '900', color: '#fff' },

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
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  orderId: { fontSize: 13, fontWeight: '900', color: '#1E293B' },
  orderInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', flex: 1, marginRight: 8 },
  orderTotal: { fontSize: 16, fontWeight: '900', color: Colors.agri.sabz },
  orderMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  orderMetaText: { fontSize: 11, color: Colors.textTertiary, fontWeight: '500' },
  orderMetaDot: { fontSize: 11, color: Colors.textTertiary },
  orderFooter: { borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingTop: 10 },
  viewOrderBtn: { fontSize: 13, fontWeight: '800', color: Colors.agri.sabz, textAlign: 'right' },

  emptyCard: {
    backgroundColor: '#fff', padding: 32, borderRadius: 20,
    alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9', borderStyle: 'dashed',
  },
  emptyIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#F8FAFB', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  emptyText: { color: '#1E293B', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  emptySubText: { color: '#94A3B8', fontSize: 12, fontWeight: '500' },
});
