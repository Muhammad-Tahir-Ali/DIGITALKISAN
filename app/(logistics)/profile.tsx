import React, { useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, Alert, Platform,
  StyleSheet, ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/colors';
import userService, { WalletData } from '@/services/user.service';
import orderService from '@/services/order.service';

// Tab bar is position:absolute, so we must manually clear it
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 92 : 72;

export default function LogisticsProfile() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [wallet, setWallet]               = useState<WalletData | null>(null);
  const [deliveryCount, setDeliveryCount] = useState<number | null>(null);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [walletData, orders] = await Promise.all([
          userService.getWallet(),
          orderService.getMyOrders(),
        ]);
        if (cancelled) return;
        setWallet(walletData);
        setDeliveryCount(orders.filter((o) => o.status === 'delivered').length);
      } catch { /* silently ignore — stats are non-critical */ }
    };
    load();
    return () => { cancelled = true; };
  }, []));

  const handleLogout = async () => {
    const doLogout = async () => {
      await logout();
      router.replace('/');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) doLogout();
      return;
    }
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: doLogout },
    ]);
  };

  const INFO_ROWS = [
    { icon: '📱', label: 'Phone', value: user?.phone ?? 'Not set' },
    { icon: '🏷️', label: 'Role', value: 'Logistics Partner' },
    { icon: '✅', label: 'Verified', value: user?.isVerified ? 'Yes' : 'Pending admin review' },
  ];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Header */}
      <View style={[styles.heroHeader, { paddingTop: insets.top + 24 }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>🚚</Text>
        </View>
        <Text style={styles.name}>{user?.name ?? 'Driver'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push('/(auth)/edit-profile')}
        >
          <Feather name="edit-3" size={12} color="#fff" />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Earnings Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>
            {wallet ? `₨ ${wallet.availableBalance.toLocaleString()}` : '—'}
          </Text>
          <Text style={styles.statLabel}>Balance</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statVal}>
            {wallet ? `₨ ${wallet.totalEarned.toLocaleString()}` : '—'}
          </Text>
          <Text style={styles.statLabel}>Total Earned</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{deliveryCount ?? '—'}</Text>
          <Text style={styles.statLabel}>Deliveries</Text>
        </View>
      </View>

      {/* Info Rows */}
      <View style={styles.section}>
        {INFO_ROWS.map((item) => (
          <View key={item.label} style={styles.infoCard}>
            <Text style={styles.infoIcon}>{item.icon}</Text>
            <View style={styles.infoBody}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          </View>
        ))}

        {/* Earnings shortcut */}
        <TouchableOpacity
          style={styles.navCard}
          onPress={() => router.push('/(logistics)/earnings' as any)}
          activeOpacity={0.8}
        >
          <View style={[styles.navIconBox, { backgroundColor: '#EFF6FF' }]}>
            <Feather name="dollar-sign" size={18} color="#2563EB" />
          </View>
          <View style={styles.navBody}>
            <Text style={styles.navTitle}>My Earnings</Text>
            <Text style={styles.navSub}>View delivery history & payouts</Text>
          </View>
          <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Sign Out */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutCard}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  heroHeader: {
    backgroundColor: '#1565C0',
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarEmoji: { fontSize: 36 },
  name: { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 4 },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 16 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
  },
  editBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row', backgroundColor: '#fff',
    marginHorizontal: 20, marginTop: -24, borderRadius: 20, padding: 16,
    shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: '#EFF6FF',
  },
  statCard: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 15, fontWeight: '900', color: Colors.textPrimary },
  statLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '700', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#F1F5F9', marginHorizontal: 8 },

  section: { paddingHorizontal: 20, paddingTop: 28, gap: 10 },

  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: Colors.cardBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  infoIcon: { fontSize: 20 },
  infoBody: { flex: 1 },
  infoLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', marginBottom: 2 },
  infoValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: '700' },

  navCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: Colors.cardBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  navIconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  navBody: { flex: 1 },
  navTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  navSub: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500', marginTop: 1 },

  logoutCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.errorLight, borderRadius: 18, padding: 16, marginTop: 8,
  },
  logoutIcon: { fontSize: 20 },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.error },
});
