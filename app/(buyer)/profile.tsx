import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Alert, ScrollView,
  StyleSheet, Platform, Switch, Linking,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/colors';
import { SUPPORT } from '@/constants/support';
import userService from '@/services/user.service';
import orderService from '@/services/order.service';

const KEY_NOTIFS    = '@digitalkisan:pref:notifs';
const KEY_DARKMODE  = '@digitalkisan:pref:darkmode';
const KEY_ADDRESSES = '@digitalkisan:saved_addresses';

interface MenuRow {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggleChange?: (v: boolean) => void;
  badge?: string;
}

function SettingsRow({ icon, label, value, onPress, danger, toggle, toggleValue, onToggleChange, badge }: MenuRow) {
  return (
    <TouchableOpacity
      style={styles.menuRow}
      onPress={toggle ? undefined : onPress}
      activeOpacity={toggle ? 1 : 0.7}
    >
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Feather name={icon as any} size={16} color={danger ? Colors.error : Colors.textSecondary} />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      <View style={styles.menuRight}>
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        {value && <Text style={styles.menuValue}>{value}</Text>}
        {toggle ? (
          <Switch
            value={!!toggleValue}
            onValueChange={onToggleChange}
            trackColor={{ false: '#E5E7EB', true: `${Colors.primary}60` }}
            thumbColor={toggleValue ? Colors.primary : '#9CA3AF'}
          />
        ) : (
          !danger && <Feather name="chevron-right" size={16} color="#CBD5E1" />
        )}
      </View>
    </TouchableOpacity>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function BuyerProfile() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [walletBalance, setWalletBalance] = useState<string>('...');
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [escrowCount, setEscrowCount] = useState<number>(0);
  const [farmCount, setFarmCount] = useState<number | null>(null);
  const [savedCount, setSavedCount] = useState<number>(0);
  const [addressCount, setAddressCount] = useState<number>(0);
  const [lang, setLang] = useState<'en' | 'ur'>('en');

  const [notifsOn, setNotifsOn] = useState(true);
  const [darkOn, setDarkOn]     = useState(false);

  // Load prefs once
  useEffect(() => {
    AsyncStorage.multiGet([KEY_NOTIFS, KEY_DARKMODE, '@digitalkisan:lang']).then(entries => {
      const map = Object.fromEntries(entries);
      if (map[KEY_NOTIFS] !== null) setNotifsOn(map[KEY_NOTIFS] === 'true');
      if (map[KEY_DARKMODE] !== null) setDarkOn(map[KEY_DARKMODE] === 'true');
      if (map['@digitalkisan:lang'] === 'ur') setLang('ur');
    });
  }, []);

  // Refresh data each time profile becomes focused (orders/wallet/addresses may change elsewhere)
  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;

      userService.getWallet()
        .then(data => {
          if (cancelled) return;
          setWalletBalance(`₨ ${data.availableBalance.toLocaleString()}`);
        })
        .catch(() => !cancelled && setWalletBalance('₨ 0'));

      orderService.getMyOrders()
        .then(orders => {
          if (cancelled) return;
          setOrderCount(orders.length);
          setEscrowCount(orders.filter(o => ['paid','bidding','in_transit'].includes(o.status)).length);
          const uniqueFarmers = new Set(orders.map(o => o.farmer?._id).filter(Boolean));
          setFarmCount(uniqueFarmers.size);
          const totalSpent = orders
            .filter(o => o.status === 'delivered')
            .reduce((sum, o) => sum + o.totalPrice, 0);
          setSavedCount(totalSpent);
        })
        .catch(() => {
          if (cancelled) return;
          setOrderCount(0); setEscrowCount(0); setFarmCount(0); setSavedCount(0);
        });

      AsyncStorage.getItem(KEY_ADDRESSES)
        .then(raw => {
          if (cancelled) return;
          const list = raw ? JSON.parse(raw) : [];
          setAddressCount(Array.isArray(list) ? list.length : 0);
        })
        .catch(() => !cancelled && setAddressCount(0));

      return () => { cancelled = true; };
    }, [])
  );

  const handleNotifsToggle = async (v: boolean) => {
    setNotifsOn(v);
    await AsyncStorage.setItem(KEY_NOTIFS, v ? 'true' : 'false');
  };
  const handleDarkToggle = async (v: boolean) => {
    setDarkOn(v);
    await AsyncStorage.setItem(KEY_DARKMODE, v ? 'true' : 'false');
    Alert.alert('Saved', 'Dark theme will activate in an upcoming release.');
  };

  const openWhatsApp = () => {
    const url = `https://wa.me/${SUPPORT.whatsapp.replace(/[^\d]/g, '')}?text=Hi%2C%20I%20need%20help%20with%20DigitalKisan`;
    Linking.openURL(url).catch(() => Alert.alert('Could not open WhatsApp'));
  };

  const openStoreReview = () => {
    const url = Platform.select({
      ios: `itms-apps://itunes.apple.com/app/id${SUPPORT.iosAppId}?action=write-review`,
      android: `market://details?id=${SUPPORT.androidPackage}`,
      default: SUPPORT.webStoreUrl,
    }) as string;
    Linking.openURL(url).catch(() => Linking.openURL(SUPPORT.webStoreUrl).catch(() => {}));
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (confirmed) logout();
      return;
    }
    Alert.alert(
      'Sign Out',
      'You will be logged out of your account. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const formatSpent = (n: number) => {
    if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  const stats = [
    { label: 'Orders',  value: orderCount === null ? '–' : String(orderCount), icon: '📦' },
    { label: 'Spent ₨', value: savedCount > 0 ? formatSpent(savedCount) : '0',  icon: '💰' },
    { label: 'Farmers', value: farmCount === null ? '–' : String(farmCount),   icon: '🌾' },
  ];

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        <View style={[styles.heroContainer, { paddingTop: insets.top + 24 }]}>
          <LinearGradient
            colors={['#052e16', '#14532d', '#166534']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />

          <View style={styles.heroTop}>
            <Text style={styles.heroTitle}>My Profile</Text>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push('/(auth)/edit-profile' as any)}
            >
              <Feather name="edit-2" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
            {user?.isVerified && (
              <View style={styles.verifiedBadge}>
                <Feather name="check" size={10} color="#fff" />
              </View>
            )}
          </View>

          <Text style={styles.heroName}>{user?.name ?? 'Guest Buyer'}</Text>
          <Text style={styles.heroEmail}>{user?.email ?? 'Not logged in'}</Text>

          <View style={styles.roleChip}>
            <View style={styles.roleDot} />
            <Text style={styles.roleText}>{user?.isVerified ? 'Verified Buyer' : 'Buyer'}</Text>
          </View>

          <View style={styles.statsRow}>
            {stats.map((stat, i) => (
              <React.Fragment key={stat.label}>
                {i > 0 && <View style={styles.statDivider} />}
                <View style={styles.statItem}>
                  <Text style={styles.statEmoji}>{stat.icon}</Text>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.content}>
          <SectionCard title="Account">
            <SettingsRow
              icon="user"
              label="Full Name"
              value={user?.name ?? '–'}
              onPress={() => router.push('/(auth)/edit-profile' as any)}
            />
            <SettingsRow
              icon="phone"
              label="Phone Number"
              value={user?.phone ?? 'Not set'}
              onPress={() => router.push('/(auth)/edit-profile' as any)}
            />
            <SettingsRow
              icon="mail"
              label="Email"
              value={user?.email ?? '–'}
              onPress={() => router.push('/(auth)/edit-profile' as any)}
            />
            <SettingsRow
              icon="map-pin"
              label="Saved Addresses"
              badge={addressCount > 0 ? String(addressCount) : undefined}
              onPress={() => router.push('/(buyer)/addresses' as any)}
            />
          </SectionCard>

          <SectionCard title="Orders & Wallet">
            <SettingsRow icon="package"     label="My Orders"          onPress={() => router.push('/(buyer)/orders' as any)} />
            <SettingsRow icon="credit-card" label="Wallet Balance"     value={walletBalance} onPress={() => router.push('/(buyer)/wallet' as any)} />
            <SettingsRow icon="clock"       label="Transaction History" onPress={() => router.push('/(buyer)/wallet/history' as any)} />
            <SettingsRow
              icon="shield"
              label="Escrow Status"
              badge={escrowCount > 0 ? `${escrowCount} Active` : undefined}
              onPress={() => router.push('/(buyer)/wallet' as any)}
            />
          </SectionCard>

          <SectionCard title="Preferences">
            <SettingsRow icon="bell"  label="Push Notifications" toggle toggleValue={notifsOn} onToggleChange={handleNotifsToggle} />
            <SettingsRow icon="moon"  label="Dark Mode"          toggle toggleValue={darkOn}   onToggleChange={handleDarkToggle} />
            <SettingsRow
              icon="globe"
              label="Language"
              value={lang === 'ur' ? 'اردو' : 'English'}
              onPress={() => router.push('/(buyer)/language' as any)}
            />
          </SectionCard>

          <SectionCard title="Support">
            <SettingsRow icon="help-circle"    label="Help Center"        onPress={() => router.push('/(buyer)/help' as any)} />
            <SettingsRow icon="message-circle" label="Chat with Support"  onPress={openWhatsApp} />
            <SettingsRow icon="star"           label="Rate DigitalKisan"  onPress={openStoreReview} />
            <SettingsRow icon="info"           label="About"              value="v1.0.0" onPress={() => router.push('/(buyer)/about' as any)} />
          </SectionCard>

          <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Feather name="log-out" size={16} color={Colors.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>DigitalKisan · Built in Pakistan 🇵🇰</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFB' },

  heroContainer: {
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  heroCircle1: {
    position: 'absolute', top: -60, right: -40,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroCircle2: {
    position: 'absolute', bottom: -30, left: -50,
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  heroTop: {
    width: '100%', flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  editBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 42 },
  verifiedBadge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 24, height: 24, borderRadius: 8,
    backgroundColor: Colors.primary,
    borderWidth: 2, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  heroName: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  heroEmail: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '500', marginBottom: 12 },
  roleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  roleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  roleText: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20, padding: 16, width: '100%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  statEmoji: { fontSize: 18 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600' },

  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 20, marginBottom: 12,
    borderWidth: 1, borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: '#94A3B8',
    letterSpacing: 0.8, textTransform: 'uppercase',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 2,
  },

  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
    borderTopWidth: 1, borderTopColor: '#F8FAFC',
    gap: 12,
  },
  menuIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#F8FAFB',
    alignItems: 'center', justifyContent: 'center',
  },
  menuIconDanger: { backgroundColor: '#FEF2F2' },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#374151' },
  menuLabelDanger: { color: Colors.error },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuValue: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  badge: {
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 20,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: Colors.primary },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 16, marginTop: 8, marginBottom: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1, borderColor: '#FEE2E2',
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: Colors.error },

  footer: {
    textAlign: 'center', color: '#CBD5E1',
    fontSize: 11, fontWeight: '500', marginBottom: 8,
  },
});
