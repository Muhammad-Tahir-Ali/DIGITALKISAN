import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  Alert, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

const STORAGE_KEY = '@digitalkisan:saved_addresses';

interface SavedAddress {
  id: string;
  label: string;
  address: string;
}

export default function SavedAddressesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [draftAddress, setDraftAddress] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => setAddresses(raw ? JSON.parse(raw) : []))
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false));
  }, []);

  const persist = async (next: SavedAddress[]) => {
    setAddresses(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const openAdd = () => {
    setEditingId('new');
    setDraftLabel('');
    setDraftAddress('');
  };

  const openEdit = (a: SavedAddress) => {
    setEditingId(a.id);
    setDraftLabel(a.label);
    setDraftAddress(a.address);
  };

  const handleSave = async () => {
    if (!draftLabel.trim() || !draftAddress.trim()) {
      const msg = 'Please fill in both label and address.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Required', msg);
      return;
    }
    if (editingId === 'new') {
      await persist([
        ...addresses,
        { id: Date.now().toString(), label: draftLabel.trim(), address: draftAddress.trim() },
      ]);
    } else {
      await persist(addresses.map(a =>
        a.id === editingId ? { ...a, label: draftLabel.trim(), address: draftAddress.trim() } : a
      ));
    }
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const doDelete = () => persist(addresses.filter(a => a.id !== id));
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this saved address?')) doDelete();
    } else {
      Alert.alert('Delete Address', 'This address will be removed permanently.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : editingId ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.formTitle}>
            {editingId === 'new' ? 'Add New Address' : 'Edit Address'}
          </Text>
          <Text style={styles.label}>Label</Text>
          <TextInput
            value={draftLabel}
            onChangeText={setDraftLabel}
            placeholder="e.g. Home, Office, Shop"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />
          <Text style={styles.label}>Full Address</Text>
          <TextInput
            value={draftAddress}
            onChangeText={setDraftAddress}
            placeholder="House #, Street, Area, City"
            placeholderTextColor="#94A3B8"
            style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
            multiline
          />

          <View style={styles.formActions}>
            <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => setEditingId(null)}>
              <Text style={styles.btnGhostText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleSave}>
              <Text style={styles.btnPrimaryText}>Save</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {addresses.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="map-pin" size={36} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No saved addresses</Text>
              <Text style={styles.emptyText}>
                Save delivery addresses so you can check out faster next time.
              </Text>
            </View>
          ) : (
            addresses.map(a => (
              <View key={a.id} style={styles.addrCard}>
                <View style={styles.addrIcon}>
                  <Feather name="map-pin" size={16} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addrLabel}>{a.label}</Text>
                  <Text style={styles.addrText} numberOfLines={2}>{a.address}</Text>
                </View>
                <TouchableOpacity onPress={() => openEdit(a)} style={styles.iconBtn}>
                  <Feather name="edit-2" size={14} color={Colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(a.id)} style={styles.iconBtn}>
                  <Feather name="trash-2" size={14} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {!editingId && !loading && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Add New Address</Text>
          </TouchableOpacity>
        </View>
      )}
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
  content: { padding: 20, paddingBottom: 120 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  empty: {
    alignItems: 'center', padding: 40, backgroundColor: '#fff',
    borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9',
  },
  emptyTitle: { marginTop: 14, fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  emptyText: { marginTop: 6, fontSize: 12, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },

  addrCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  addrIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#ECFDF5',
    alignItems: 'center', justifyContent: 'center',
  },
  addrLabel: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  addrText: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, fontWeight: '500' },
  iconBtn: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: '#F8FAFB',
    alignItems: 'center', justifyContent: 'center',
  },

  formTitle: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary, marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: '#E2E8F0',
    fontSize: 15, fontWeight: '600', color: Colors.textPrimary,
  },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 28 },
  btn: { flex: 1, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnGhost: { backgroundColor: '#F1F5F9' },
  btnGhostText: { color: Colors.textPrimary, fontWeight: '800' },
  btnPrimary: { backgroundColor: Colors.primary },
  btnPrimaryText: { color: '#fff', fontWeight: '900' },

  footer: {
    paddingHorizontal: 24, paddingTop: 16, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, height: 56, borderRadius: 16,
  },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '900' },
});
