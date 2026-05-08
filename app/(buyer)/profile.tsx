import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Alert, ScrollView,
  StyleSheet, Platform, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/colors';
import userService from '@/services/user.service';

interface MenuRow {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  toggle?: boolean;
  badge?: string;
}

function SettingsRow({ icon, label, value, onPress, danger, toggle, badge }: MenuRow) {
  const [enabled, setEnabled] = useState(true);
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
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false: '#E5E7EB', true: `${Colors.primary}60` }}
            thumbColor={enabled ? Colors.primary : '#9CA3AF'}
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
  const [walletBalance, setWalletBalance] = useState<string>('...');

  useEffect(() => {
    userService.getWallet().then(data => {
      setWalletBalance(`₨ ${data.availableBalance.toLocaleString()}`);
    }).catch(() => setWalletBalance('₨ 0'));
  }, []);

  const handleComingSoon = () => Alert.alert('Coming Soon', 'This feature is currently under development!');

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

  const stats = [
    { label: 'Orders', value: '12', icon: '📦' },
    { label: 'Saved ₨', value: '4.2K', icon: '💰' },
    { label: 'Farms', value: '6', icon: '🌾' },
  ];

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── HERO HEADER ──────────────────────────────────────── */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={['#052e16', '#14532d', '#166534']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Decorative circles */}
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />

          <View style={styles.heroTop}>
            <Text style={styles.heroTitle}>My Profile</Text>
            <TouchableOpacity style={styles.editBtn}>
              <Feather name="edit-2" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Feather name="check" size={10} color="#fff" />
            </View>
          </View>

          <Text style={styles.heroName}>{user?.name ?? 'Guest Buyer'}</Text>
          <Text style={styles.heroEmail}>{user?.email ?? 'Not logged in'}</Text>

          {/* Role Chip */}
          <View style={styles.roleChip}>
            <View style={styles.roleDot} />
            <Text style={styles.roleText}>Verified Buyer</Text>
          </View>

          {/* Stats Row */}
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
          {/* ── ACCOUNT ──────────────────────────────────────────── */}
          <SectionCard title="Account">
            <SettingsRow icon="user" label="Full Name" value={user?.name ?? '–'} onPress={handleComingSoon} />
            <SettingsRow icon="phone" label="Phone Number" value={user?.phone ?? 'Not set'} onPress={handleComingSoon} />
            <SettingsRow icon="mail" label="Email" value={user?.email?.split('@')[0] + '…'} onPress={handleComingSoon} />
            <SettingsRow icon="map-pin" label="Saved Addresses" badge="2" onPress={handleComingSoon} />
          </SectionCard>

          {/* ── ORDERS & WALLET ──────────────────────────────────── */}
          <SectionCard title="Orders & Wallet">
            <SettingsRow icon="package" label="My Orders" onPress={() => router.push('/(buyer)/orders' as any)} />
            <SettingsRow icon="credit-card" label="Wallet Balance" value={walletBalance} onPress={handleComingSoon} />
            <SettingsRow icon="clock" label="Transaction History" onPress={handleComingSoon} />
            <SettingsRow icon="shield" label="Escrow Status" badge="1 Active" onPress={handleComingSoon} />
          </SectionCard>

          {/* ── PREFERENCES ──────────────────────────────────────── */}
          <SectionCard title="Preferences">
            <SettingsRow icon="bell" label="Push Notifications" toggle />
            <SettingsRow icon="moon" label="Dark Mode" toggle />
            <SettingsRow icon="globe" label="Language" value="English" onPress={handleComingSoon} />
          </SectionCard>

          {/* ── SUPPORT ─────────────────────────────────────────── */}
          <SectionCard title="Support">
            <SettingsRow icon="help-circle" label="Help Center" onPress={handleComingSoon} />
            <SettingsRow icon="message-circle" label="Chat with Support" onPress={handleComingSoon} />
            <SettingsRow icon="star" label="Rate DigitalKisan" onPress={handleComingSoon} />
            <SettingsRow icon="info" label="About" value="v1.0.0" onPress={handleComingSoon} />
          </SectionCard>

          {/* ── SIGN OUT ─────────────────────────────────────────── */}
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

  // Hero
  heroContainer: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
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

  // Content
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  // Section
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

  // Menu Row
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

  // Sign Out
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
