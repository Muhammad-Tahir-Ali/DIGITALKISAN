import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export default function LogisticsDashboard() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Logistics Center</Text>
        <Text style={styles.subtitle}>Manage fleet and deliveries</Text>
      </View>

      {/* Coming Soon: Fleet Management */}
      <View style={styles.comingSoon}>
        <View style={styles.csIconWrap}>
          <Feather name="truck" size={40} color={Colors.agri.sabz} />
        </View>
        <Text style={styles.csTitle}>Fleet Management</Text>
        <View style={styles.csBadge}>
          <Text style={styles.csBadgeText}>Coming Soon</Text>
        </View>
        <Text style={styles.csDesc}>
          We are actively building route optimization, real-time GPS tracking,
          and automated delivery assignment for logistics partners. This feature
          will be available in your region shortly.
        </Text>
        <View style={styles.csFeatureList}>
          {[
            { icon: 'map', text: 'Optimized delivery routes' },
            { icon: 'navigation', text: 'Real-time GPS tracking' },
            { icon: 'zap', text: 'Auto-assigned deliveries' },
          ].map(f => (
            <View key={f.icon} style={styles.csFeatureItem}>
              <Feather name={f.icon as any} size={14} color={Colors.agri.sabz} />
              <Text style={styles.csFeatureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statLine}>
          <Text style={styles.statLabel}>Pending Deliveries</Text>
          <Text style={styles.statPlaceholder}>— awaiting data</Text>
        </View>
        <View style={styles.statLine}>
          <Text style={styles.statLabel}>Active Fleet</Text>
          <Text style={styles.statPlaceholder}>— awaiting data</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  content: { padding: 24, paddingTop: 60 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '900', color: '#1E293B' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },
  comingSoon: {
    backgroundColor: '#fff', paddingHorizontal: 28, paddingVertical: 32, borderRadius: 24,
    alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9',
    marginBottom: 24,
  },
  csIconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: Colors.agri.sabz + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  csTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B', textAlign: 'center', marginBottom: 8 },
  csBadge: {
    backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20, marginBottom: 14, borderWidth: 1, borderColor: '#FCD34D',
  },
  csBadgeText: { fontSize: 11, fontWeight: '800', color: '#92400E', textTransform: 'uppercase', letterSpacing: 0.5 },
  csDesc: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  csFeatureList: { gap: 8, alignSelf: 'stretch' },
  csFeatureItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F8FAFB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  csFeatureText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  statsCard: { backgroundColor: '#1E293B', padding: 20, borderRadius: 20, gap: 16 },
  statLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontWeight: '700' },
  statPlaceholder: { color: 'rgba(255,255,255,0.35)', fontWeight: '600', fontSize: 13, fontStyle: 'italic' },
});
