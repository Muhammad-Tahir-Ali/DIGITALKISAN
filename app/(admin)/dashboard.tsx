import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>System Control</Text>
        <Text style={styles.subtitle}>Platform-wide administration</Text>
      </View>

      <View style={styles.alertBox}>
        <Feather name="activity" size={20} color="#1E40AF" />
        <Text style={styles.alertText}>Platform health is normal. Total active users: 4,208.</Text>
      </View>

      <View style={styles.grid}>
        <AdminCard title="User Management" icon="users" color="#4F46E5" />
        <AdminCard title="Transaction Logs" icon="file-text" color="#059669" />
        <AdminCard title="Security & Escrow" icon="shield" color="#9333EA" />
        <AdminCard title="System Config" icon="settings" color="#4B5563" />
      </View>

      <TouchableOpacity style={styles.auditLog}>
        <Text style={styles.auditTitle}>View Audit Logs</Text>
        <Feather name="external-link" size={14} color="#64748B" />
      </TouchableOpacity>
    </ScrollView>
  );
}

function AdminCard({ title, icon, color }: { title: string; icon: any; color: string }) {
  return (
    <TouchableOpacity style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: color + '15' }]}>
        <Feather name={icon} size={24} color={color} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  content: { padding: 24, paddingTop: 60 },
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: '900', color: '#1E293B' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 4 },
  alertBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#DBEAFE',
    padding: 16, borderRadius: 16, marginBottom: 24, gap: 12,
    borderLeftWidth: 4, borderLeftColor: '#1E40AF',
  },
  alertText: { color: '#1E3A8A', fontSize: 12, fontWeight: '700', flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  card: {
    width: (width - 60) / 2, backgroundColor: '#fff', padding: 20,
    borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9',
    alignItems: 'center', gap: 12,
  },
  iconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#334155', textAlign: 'center' },
  auditLog: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 8, paddingVertical: 12, backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  auditTitle: { color: '#64748B', fontWeight: '700', fontSize: 13 },
});
