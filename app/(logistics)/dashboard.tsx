import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export default function LogisticsDashboard() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Logistics Center</Text>
        <Text style={styles.subtitle}>Manage fleet and deliveries</Text>
      </View>

      <View style={styles.comingSoon}>
        <Feather name="truck" size={60} color={Colors.agri.sabz} />
        <Text style={styles.csTitle}>Fleet Management Coming Soon</Text>
        <Text style={styles.csDesc}>
          We are currently onboarding logistics partners in your region. 
          Expect route optimization and fleet tracking features shortly.
        </Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statLine}>
          <Text style={styles.statLabel}>Pending Deliveries</Text>
          <Text style={styles.statVal}>0</Text>
        </View>
        <View style={styles.statLine}>
          <Text style={styles.statLabel}>Active Fleet</Text>
          <Text style={styles.statVal}>0</Text>
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
    backgroundColor: '#fff', padding: 40, borderRadius: 24, 
    alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9',
    marginBottom: 24,
  },
  csTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginTop: 20, textAlign: 'center' },
  csDesc: { fontSize: 13, color: '#94A3B8', marginTop: 10, textAlign: 'center', lineHeight: 20 },
  statsCard: { backgroundColor: '#1E293B', padding: 20, borderRadius: 20, gap: 16 },
  statLine: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontWeight: '700' },
  statVal: { color: '#fff', fontWeight: '900' },
});
