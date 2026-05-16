import React, { useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, Alert, Platform,
  StyleSheet, ScrollView, Switch, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/colors';
import userService, { WalletData, VehicleInfo } from '@/services/user.service';
import orderService from '@/services/order.service';

// Tab bar is position:absolute, so we must manually clear it
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 92 : 72;

const VEHICLE_ICONS: Record<string, string> = {
  motorcycle: '🏍️',
  rickshaw:   '🛺',
  pickup:     '🛻',
  van:        '🚐',
  truck:      '🚛',
};

const VEHICLE_LABELS: Record<string, string> = {
  motorcycle: 'Motorcycle',
  rickshaw:   'Rickshaw',
  pickup:     'Pickup',
  van:        'Van',
  truck:      'Truck',
};

export default function LogisticsProfile() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [wallet, setWallet]               = useState<WalletData | null>(null);
  const [deliveryCount, setDeliveryCount] = useState<number | null>(null);
  const [isOnline, setIsOnline]           = useState<boolean>(false);
  const [vehicleInfo, setVehicleInfo]     = useState<VehicleInfo | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [walletData, profile, orders] = await Promise.all([
          userService.getWallet(),
          userService.getMyProfile(),
          orderService.getMyOrders(),
        ]);
        if (cancelled) return;
        setWallet(walletData);
        setIsOnline(profile.isOnline ?? false);
        setVehicleInfo(
          profile.vehicleInfo && profile.vehicleInfo.vehicleType
            ? profile.vehicleInfo
            : null,
        );
        setDeliveryCount(orders.filter((o) => o.status === 'delivered').length);
      } catch { /* silently ignore — stats are non-critical */ }
    };
    load();
    return () => { cancelled = true; };
  }, []));

  const handleToggleOnline = async () => {
    if (togglingStatus) return;
    setTogglingStatus(true);
    try {
      const result = await userService.toggleOnlineStatus();
      setIsOnline(result.isOnline);
    } catch {
      Alert.alert('Error', 'Failed to update online status. Please try again.');
    } finally {
      setTogglingStatus(false);
    }
  };

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
    { icon: '📱', label: 'Phone',    value: user?.phone ?? 'Not set' },
    { icon: '🏷️', label: 'Role',     value: 'Logistics Partner' },
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

      {/* Online / Offline Toggle */}
      <View style={styles.onlineCard}>
        <View style={styles.onlineLeft}>
          <View style={[styles.onlineDot, isOnline ? styles.onlineDotActive : styles.onlineDotInactive]} />
          <View>
            <Text style={styles.onlineTitle}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
            <Text style={styles.onlineSub}>
              {isOnline
                ? 'You are visible to buyers and receiving job requests'
                : 'You are not receiving any new job requests'}
            </Text>
          </View>
        </View>
        {togglingStatus ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
            thumbColor={isOnline ? Colors.primary : '#9CA3AF'}
          />
        )}
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

      {/* Vehicle Info Card */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.vehicleCard}
          onPress={() => router.push('/(logistics)/vehicle' as any)}
          activeOpacity={0.8}
        >
          {vehicleInfo ? (
            <>
              <View style={styles.vehicleIconBox}>
                <Text style={styles.vehicleEmoji}>
                  {VEHICLE_ICONS[vehicleInfo.vehicleType ?? ''] ?? '🚗'}
                </Text>
              </View>
              <View style={styles.vehicleBody}>
                <Text style={styles.vehicleTitle}>
                  {VEHICLE_LABELS[vehicleInfo.vehicleType ?? ''] ?? 'Vehicle'}
                  {vehicleInfo.model ? ` · ${vehicleInfo.model}` : ''}
                </Text>
                <Text style={styles.vehicleSub}>
                  {[
                    vehicleInfo.plateNumber ? `Plate: ${vehicleInfo.plateNumber}` : null,
                    vehicleInfo.capacity    ? `Capacity: ${vehicleInfo.capacity} kg` : null,
                  ].filter(Boolean).join('  •  ') || 'Tap to complete vehicle details'}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
            </>
          ) : (
            <>
              <View style={[styles.vehicleIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Text style={styles.vehicleEmoji}>🚗</Text>
              </View>
              <View style={styles.vehicleBody}>
                <Text style={styles.vehicleTitle}>Setup Vehicle</Text>
                <Text style={styles.vehicleSub}>Add your vehicle info to start accepting jobs</Text>
              </View>
              <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
            </>
          )}
        </TouchableOpacity>

        {/* Info Rows */}
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
            <Text style={styles.navSub}>View delivery history &amp; payouts</Text>
          </View>
          <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* My Bids shortcut */}
        <TouchableOpacity
          style={styles.navCard}
          onPress={() => router.push('/(logistics)/bids' as any)}
          activeOpacity={0.8}
        >
          <View style={[styles.navIconBox, { backgroundColor: '#F0FDF4' }]}>
            <Feather name="clipboard" size={18} color={Colors.primary} />
          </View>
          <View style={styles.navBody}>
            <Text style={styles.navTitle}>My Bids</Text>
            <Text style={styles.navSub}>Track your active and past bids</Text>
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

  // ── Hero ──────────────────────────────────────────────────────────────────
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
  name:  { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 4 },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 16 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
  },
  editBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // ── Online Toggle ─────────────────────────────────────────────────────────
  onlineCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    marginHorizontal: 20, marginTop: 16,
    borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: Colors.cardBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  onlineLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 12 },
  onlineDot: { width: 12, height: 12, borderRadius: 6 },
  onlineDotActive:   { backgroundColor: Colors.primary },
  onlineDotInactive: { backgroundColor: '#9CA3AF' },
  onlineTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  onlineSub:   { fontSize: 11, color: Colors.textSecondary, fontWeight: '500', marginTop: 2, flexShrink: 1 },

  // ── Stats ─────────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row', backgroundColor: '#fff',
    marginHorizontal: 20, marginTop: 12, borderRadius: 20, padding: 16,
    shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: '#EFF6FF',
  },
  statCard:    { flex: 1, alignItems: 'center' },
  statVal:     { fontSize: 15, fontWeight: '900', color: Colors.textPrimary },
  statLabel:   { fontSize: 10, color: Colors.textSecondary, fontWeight: '700', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#F1F5F9', marginHorizontal: 8 },

  // ── Section ───────────────────────────────────────────────────────────────
  section: { paddingHorizontal: 20, paddingTop: 16, gap: 10 },

  // ── Vehicle Card ──────────────────────────────────────────────────────────
  vehicleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: Colors.cardBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  vehicleIconBox: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center',
  },
  vehicleEmoji: { fontSize: 24 },
  vehicleBody:  { flex: 1 },
  vehicleTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  vehicleSub:   { fontSize: 11, color: Colors.textSecondary, fontWeight: '500', marginTop: 2 },

  // ── Info Rows ─────────────────────────────────────────────────────────────
  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: Colors.cardBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  infoIcon:  { fontSize: 20 },
  infoBody:  { flex: 1 },
  infoLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', marginBottom: 2 },
  infoValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: '700' },

  // ── Nav Cards ─────────────────────────────────────────────────────────────
  navCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: Colors.cardBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  navIconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  navBody:    { flex: 1 },
  navTitle:   { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  navSub:     { fontSize: 11, color: Colors.textSecondary, fontWeight: '500', marginTop: 1 },

  // ── Logout ────────────────────────────────────────────────────────────────
  logoutCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.errorLight, borderRadius: 18, padding: 16, marginTop: 8,
  },
  logoutIcon: { fontSize: 20 },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.error },
});
