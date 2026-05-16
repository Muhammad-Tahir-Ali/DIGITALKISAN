import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Platform, InteractionManager } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import userService from '@/services/user.service';

const PRESETS = ['500', '1000', '2000', '5000'];

export default function TopUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('1000');
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [loading, setLoading] = useState(false);
  const customInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (customMode) {
      const task = InteractionManager.runAfterInteractions(() => {
        customInputRef.current?.focus();
      });
      return () => task.cancel();
    }
  }, [customMode]);

  const showErr = (msg: string) => {
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Error', msg);
  };

  const handleAddMoney = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 100) {
      showErr('Minimum top-up amount is ₨ 100.');
      return;
    }

    setLoading(true);
    try {
      await userService.topupWallet(numAmount, 'direct');
      if (Platform.OS === 'web') {
        window.alert(`₨ ${numAmount.toLocaleString()} has been added to your wallet.`);
        router.back();
      } else {
        Alert.alert(
          'Money Added!',
          `₨ ${numAmount.toLocaleString()} has been added to your wallet.`,
          [{ text: 'Done', onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message ?? error?.message ?? 'Failed to add money. Please try again.';
      showErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Money</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Amount Card */}
        <View style={styles.card}>
          <LinearGradient colors={[Colors.agri.sabz, '#059669']} style={styles.balanceCard}>
            <View style={styles.cardInfo}>
              <View>
                <Text style={styles.balanceLabel}>DigitalKisan Wallet</Text>
                <Text style={styles.balanceSub}>Amount to add</Text>
              </View>
              <Feather name="shield" size={24} color="rgba(255,255,255,0.4)" />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.currencySymbol}>₨</Text>
              <Text style={styles.amountDisplay}>
                {amount ? parseFloat(amount).toLocaleString() : '0'}
              </Text>
            </View>
          </LinearGradient>

          {/* Preset Pills */}
          <View style={styles.quickAmounts}>
            {PRESETS.map((val) => (
              <TouchableOpacity
                key={val}
                style={[styles.amountPill, !customMode && amount === val && styles.amountPillActive]}
                onPress={() => { setAmount(val); setCustomMode(false); setCustomValue(''); }}
              >
                <Text style={[styles.amountPillText, !customMode && amount === val && styles.amountPillTextActive]}>
                  +₨ {parseInt(val).toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.amountPill, styles.customPill, customMode && styles.amountPillActive]}
              onPress={() => { setCustomMode(true); setCustomValue(''); setAmount(''); }}
            >
              <Feather name="edit-2" size={11} color={customMode ? Colors.agri.sabz : '#475569'} style={{ marginRight: 4 }} />
              <Text style={[styles.amountPillText, customMode && styles.amountPillTextActive]}>Custom</Text>
            </TouchableOpacity>
          </View>

          {/* Custom Input Box */}
          {customMode && (
            <View style={styles.customBox}>
              <Text style={styles.customBoxLabel}>Enter Custom Amount</Text>
              <View style={styles.customInputRow}>
                <View style={styles.customCurrencyBox}>
                  <Text style={styles.customCurrency}>₨</Text>
                </View>
                <TextInput
                  ref={customInputRef}
                  style={styles.customInput}
                  placeholder="e.g. 3500"
                  placeholderTextColor="#CBD5E1"
                  keyboardType="numeric"
                  value={customValue}
                  onChangeText={(text) => {
                    const clean = text.replace(/[^0-9]/g, '');
                    setCustomValue(clean);
                    setAmount(clean);
                  }}
                  returnKeyType="done"
                />
                {customValue.length > 0 && (
                  <TouchableOpacity onPress={() => { setCustomValue(''); setAmount(''); }} style={styles.customClear}>
                    <Feather name="x" size={14} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.customHint}>Minimum ₨ 100</Text>
            </View>
          )}
        </View>

        {/* Instant Credit Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconWrap}>
            <Feather name="zap" size={18} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Instant Credit</Text>
            <Text style={styles.infoDesc}>Funds are added to your wallet immediately and can be used to place orders right away.</Text>
          </View>
        </View>

        {/* Banking Coming Soon */}
        <View style={styles.comingSoonCard}>
          <View style={styles.comingSoonHeader}>
            <Feather name="clock" size={16} color="#6366F1" />
            <Text style={styles.comingSoonTitle}>Banking Methods — Coming Soon</Text>
          </View>
          <Text style={styles.comingSoonDesc}>
            We're working on integrating JazzCash, Easypaisa, and Bank Transfer. Stay tuned!
          </Text>
          <View style={styles.comingSoonBadges}>
            {['JazzCash', 'Easypaisa', 'Bank Transfer'].map((name) => (
              <View key={name} style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonBadgeText}>{name}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.payBtn, (!amount || loading) && { opacity: 0.6 }]}
          onPress={handleAddMoney}
          disabled={!amount || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="plus-circle" size={20} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.payBtnText}>Add ₨ {amount ? parseFloat(amount).toLocaleString() : '0'} to Wallet</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingBottom: 20, paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },

  content: { padding: 24, paddingBottom: 120 },

  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  balanceCard: { borderRadius: 20, padding: 24 },
  cardInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  balanceSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  currencySymbol: { color: '#fff', fontSize: 24, fontWeight: '900', marginRight: 8 },
  amountDisplay: { color: '#fff', fontSize: 36, fontWeight: '900', flex: 1 },

  quickAmounts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 },
  amountPill: {
    backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1, borderColor: 'transparent',
  },
  amountPillActive: { backgroundColor: '#ECFDF5', borderColor: Colors.agri.sabz },
  amountPillText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  amountPillTextActive: { color: Colors.agri.sabz },
  customPill: { flexDirection: 'row', alignItems: 'center' },

  customBox: {
    marginTop: 16, backgroundColor: '#F8FAFB', borderRadius: 16,
    borderWidth: 1.5, borderColor: Colors.agri.sabz, overflow: 'hidden',
  },
  customBoxLabel: {
    fontSize: 10, fontWeight: '800', color: Colors.agri.sabz,
    textTransform: 'uppercase', letterSpacing: 1,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6,
  },
  customInputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  customCurrencyBox: {
    width: 40, height: 48, borderRadius: 12, backgroundColor: '#ECFDF5',
    alignItems: 'center', justifyContent: 'center',
  },
  customCurrency: { fontSize: 18, fontWeight: '900', color: Colors.agri.sabz },
  customInput: { flex: 1, height: 48, fontSize: 22, fontWeight: '900', color: '#1E293B', paddingHorizontal: 8 },
  customClear: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  customHint: { fontSize: 10, fontWeight: '700', color: '#94A3B8', paddingHorizontal: 16, paddingBottom: 10 },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#ECFDF5', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#A7F3D0', marginBottom: 16,
  },
  infoIconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#D1FAE5',
    alignItems: 'center', justifyContent: 'center',
  },
  infoTitle: { fontSize: 13, fontWeight: '800', color: '#065F46', marginBottom: 4 },
  infoDesc: { fontSize: 12, color: '#047857', fontWeight: '500', lineHeight: 18 },

  comingSoonCard: {
    backgroundColor: '#F5F3FF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#DDD6FE',
  },
  comingSoonHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  comingSoonTitle: { fontSize: 13, fontWeight: '800', color: '#4338CA' },
  comingSoonDesc: { fontSize: 12, color: '#6366F1', fontWeight: '500', lineHeight: 18, marginBottom: 12 },
  comingSoonBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  comingSoonBadge: {
    backgroundColor: '#EDE9FE', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  comingSoonBadgeText: { fontSize: 11, fontWeight: '700', color: '#5B21B6' },

  footer: {
    padding: 24, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F5F9',
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  payBtn: {
    backgroundColor: Colors.agri.sabz, height: 60, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.agri.sabz, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
  },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
