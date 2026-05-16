import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, Platform, TextInput as RNTextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import userService, { VehicleInfo } from '@/services/user.service';

const VEHICLE_TYPES: { key: VehicleInfo['vehicleType']; label: string; icon: string; desc: string }[] = [
  { key: 'motorcycle', label: 'Motorcycle', icon: '🏍️', desc: 'Up to 30 kg' },
  { key: 'rickshaw',   label: 'Rickshaw',   icon: '🛺',  desc: 'Up to 150 kg' },
  { key: 'pickup',     label: 'Pickup',     icon: '🛻',  desc: 'Up to 800 kg' },
  { key: 'van',        label: 'Van',        icon: '🚐',  desc: 'Up to 1,500 kg' },
  { key: 'truck',      label: 'Truck',      icon: '🚛',  desc: 'Up to 5,000 kg' },
];

function Field({
  label, value, onChangeText, placeholder, keyboardType, maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
  maxLength?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <RNTextInput
        style={[styles.input, focused && styles.inputFocused]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType ?? 'default'}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

export default function VehicleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [vehicleType, setVehicleType] = useState<VehicleInfo['vehicleType']>(undefined);
  const [plateNumber, setPlateNumber] = useState('');
  const [capacity, setCapacity]       = useState('');
  const [model, setModel]             = useState('');
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const profile = await userService.getMyProfile();
        if (cancelled) return;
        const v = profile.vehicleInfo;
        if (v) {
          setVehicleType(v.vehicleType);
          setPlateNumber(v.plateNumber ?? '');
          setCapacity(v.capacity != null ? String(v.capacity) : '');
          setModel(v.model ?? '');
        }
      } catch { /* ignore */ }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, []));

  const handleSave = async () => {
    if (!vehicleType) {
      Alert.alert('Vehicle Type Required', 'Please select a vehicle type.');
      return;
    }
    if (!plateNumber.trim()) {
      Alert.alert('Plate Number Required', 'Please enter your vehicle plate number.');
      return;
    }
    setSaving(true);
    try {
      await userService.updateVehicleInfo({
        vehicleType,
        plateNumber: plateNumber.trim().toUpperCase(),
        capacity: capacity ? Number(capacity) : undefined,
        model: model.trim() || undefined,
      });
      if (Platform.OS === 'web') {
        alert('Vehicle info saved!');
        router.back();
      } else {
        Alert.alert('Saved', 'Vehicle information updated successfully.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to save vehicle info');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.heading}>Vehicle Info</Text>
          <Text style={styles.subheading}>Update your delivery vehicle details</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Vehicle type selector */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Vehicle Type</Text>
            <Text style={styles.sectionSub}>Select the type of vehicle you use for deliveries</Text>
            <View style={styles.vehicleGrid}>
              {VEHICLE_TYPES.map((v) => {
                const active = vehicleType === v.key;
                return (
                  <TouchableOpacity
                    key={v.key}
                    style={[styles.vehicleOption, active && styles.vehicleOptionActive]}
                    onPress={() => setVehicleType(v.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.vehicleIcon}>{v.icon}</Text>
                    <Text style={[styles.vehicleLabel, active && styles.vehicleLabelActive]}>{v.label}</Text>
                    <Text style={[styles.vehicleDesc, active && styles.vehicleDescActive]}>{v.desc}</Text>
                    {active && (
                      <View style={styles.vehicleCheck}>
                        <Feather name="check" size={10} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Details form */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Vehicle Details</Text>
            <Field
              label="Plate Number *"
              value={plateNumber}
              onChangeText={setPlateNumber}
              placeholder="e.g. ABC-1234"
              maxLength={12}
            />
            <Field
              label="Model / Make"
              value={model}
              onChangeText={setModel}
              placeholder="e.g. Honda 125, Suzuki Carry"
            />
            <Field
              label="Capacity (kg)"
              value={capacity}
              onChangeText={(t) => setCapacity(t.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 500"
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          {/* Info tip */}
          <View style={styles.guideCard}>
            <Feather name="info" size={14} color="#2563EB" />
            <Text style={styles.guideText}>
              Accurate capacity helps farmers match orders to the right vehicle, increasing your bid acceptance rate.
            </Text>
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="save" size={16} color="#fff" />
                <Text style={styles.saveBtnText}>Save Vehicle Info</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFB' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 14, paddingTop: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#F8FAFB', alignItems: 'center', justifyContent: 'center',
  },
  heading: { fontSize: 18, fontWeight: '900', color: '#111827' },
  subheading: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500', marginTop: 2 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  scroll: { padding: 16, paddingBottom: 40 },

  sectionCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 4 },
  sectionSub: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500', marginBottom: 14 },

  vehicleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  vehicleOption: {
    width: '47%', backgroundColor: '#F8FAFB', borderRadius: 16, padding: 14,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#F1F5F9', position: 'relative',
  },
  vehicleOptionActive: {
    backgroundColor: Colors.primaryLight, borderColor: Colors.primary,
  },
  vehicleIcon: { fontSize: 26, marginBottom: 6 },
  vehicleLabel: { fontSize: 13, fontWeight: '800', color: '#374151', marginBottom: 2 },
  vehicleLabelActive: { color: Colors.primary },
  vehicleDesc: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },
  vehicleDescActive: { color: Colors.primary },
  vehicleCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },

  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#F8FAFB', borderRadius: 12, borderWidth: 1.5,
    borderColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#111827', fontWeight: '600',
  },
  inputFocused: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },

  guideCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#EFF6FF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#BFDBFE', marginBottom: 20,
  },
  guideText: { flex: 1, fontSize: 12, color: '#1E40AF', fontWeight: '500', lineHeight: 18 },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
