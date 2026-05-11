import { View, Text, TouchableOpacity, Alert, Platform, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/colors';
import { useRouter } from 'expo-router';

export default function FarmerProfile() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    const doLogout = async () => {
      await logout();
      router.replace('/');
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (confirmed) doLogout();
      return;
    }

    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: doLogout },
    ]);
  };

  const INFO_ROWS = [
    { icon: '📱', label: 'Phone', value: user?.phone ?? 'Not set' },
    { icon: '✅', label: 'Verified', value: user?.isVerified ? 'Yes' : 'Pending' },
    { icon: '🏷️', label: 'Role', value: 'Farmer' },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.heroHeader, { paddingTop: insets.top + 24 }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>👤</Text>
        </View>
        <Text style={styles.name}>{user?.name ?? 'Farmer'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push('/(auth)/edit-profile')}
        >
          <Feather name="edit-3" size={12} color="#fff" />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        {INFO_ROWS.map(item => (
          <View key={item.label} style={styles.infoCard}>
            <Text style={styles.infoIcon}>{item.icon}</Text>
            <View style={styles.infoBody}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          </View>
        ))}

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
  content: { paddingBottom: 40 },

  heroHeader: {
    backgroundColor: Colors.primary,
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

  section: { paddingHorizontal: 20, paddingTop: 20, gap: 10 },

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

  logoutCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.errorLight, borderRadius: 18, padding: 16, marginTop: 8,
  },
  logoutIcon: { fontSize: 20 },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.error },
});
