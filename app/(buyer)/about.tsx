import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { SUPPORT } from '@/constants/support';

const VERSION = Constants.expoConfig?.version ?? '1.0.0';
const TERMS_URL   = `${SUPPORT.webStoreUrl}/terms`;
const PRIVACY_URL = `${SUPPORT.webStoreUrl}/privacy`;
const WEBSITE_URL = SUPPORT.webStoreUrl;

function Row({
  icon, label, value, onPress,
}: { icon: string; label: string; value?: string; onPress?: () => void }) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.rowIcon}>
        <Feather name={icon as any} size={16} color={Colors.textSecondary} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {onPress && <Feather name="chevron-right" size={16} color="#CBD5E1" />}
    </TouchableOpacity>
  );
}

export default function AboutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brand}>
          <View style={styles.logo}><Text style={styles.logoEmoji}>🌾</Text></View>
          <Text style={styles.brandName}>DigitalKisan</Text>
          <Text style={styles.brandTagline}>Direct from farm. Verified. Escrow-protected.</Text>
        </View>

        <View style={styles.card}>
          <Row icon="info" label="Version" value={VERSION} />
          <Row icon="globe" label="Website" onPress={() => Linking.openURL(WEBSITE_URL).catch(() => {})} />
          <Row icon="file-text" label="Terms of Service" onPress={() => Linking.openURL(TERMS_URL).catch(() => {})} />
          <Row icon="shield" label="Privacy Policy" onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})} />
        </View>

        <Text style={styles.footer}>Built in Pakistan · For farmers, by Pakistan 🇵🇰</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  content: { padding: 20 },

  brand: { alignItems: 'center', paddingVertical: 24 },
  logo: {
    width: 76, height: 76, borderRadius: 24, backgroundColor: '#ECFDF5',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    borderWidth: 1, borderColor: '#D1FAE5',
  },
  logoEmoji: { fontSize: 36 },
  brandName: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -0.5 },
  brandTagline: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, fontWeight: '600' },

  card: {
    backgroundColor: '#fff', borderRadius: 18, marginTop: 12,
    borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: '#F8FAFC',
  },
  rowIcon: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: '#F8FAFB',
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#374151' },
  rowValue: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },

  footer: { textAlign: 'center', color: '#94A3B8', fontSize: 11, fontWeight: '500', marginTop: 32 },
});
