import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import userService from '@/services/user.service';

const METHODS = [
  { id: 'jazzcash' as const,      label: 'JazzCash',      color: '#DB2777' },
  { id: 'easypaisa' as const,     label: 'Easypaisa',     color: '#059669' },
  { id: 'bank_transfer' as const, label: 'Bank Transfer', color: '#0EA5E9' },
];

export default function LogisticsWithdrawalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [method, setMethod] = useState<'jazzcash' | 'easypaisa' | 'bank_transfer'>('jazzcash');
  const [amount, setAmount] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  useEffect(() => {
    userService.getWallet()
      .then(data => setAvailableBalance(data.availableBalance))
      .catch(() => setAvailableBalance(null))
      .finally(() => setBalanceLoading(false));
  }, []);

  const handlePress = async () => {
    const requested = parseFloat(amount);

    if (!amount || isNaN(requested) || requested < 500) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount (minimum ₨ 500).');
      return;
    }
    if (!accountTitle.trim() || accountTitle.trim().length < 2) {
      Alert.alert('Missing Field', 'Please enter your account title.');
      return;
    }
    if (!accountNumber.trim() || accountNumber.trim().length < 5) {
      Alert.alert('Missing Field', 'Please enter your account number.');
      return;
    }
    if (method === 'bank_transfer' && !bankName.trim()) {
      Alert.alert('Missing Field', 'Please enter your bank name.');
      return;
    }
    if (availableBalance !== null && requested > availableBalance) {
      Alert.alert(
        'Insufficient Balance',
        `You requested ₨ ${requested.toLocaleString()} but your available balance is only ₨ ${availableBalance.toLocaleString()}.`
      );
      return;
    }

    setLoading(true);
    try {
      await userService.requestWithdrawal(requested, method, {
        accountTitle: accountTitle.trim(),
        accountNumber: accountNumber.trim(),
        bankName: method === 'bank_transfer' ? bankName.trim() : undefined,
      });
      setSubmitted(true);
    } catch (error: any) {
      const msg = error?.response?.data?.message ?? 'Failed to submit withdrawal request. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const isMobileWallet = method === 'jazzcash' || method === 'easypaisa';

  if (submitted) {
    return (
      <View style={[styles.container, styles.successContainer, { paddingTop: insets.top, paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.successIconWrap}>
          <Feather name="check-circle" size={64} color="#fff" />
        </View>
        <Text style={styles.successTitle}>Request Submitted!</Text>
        <Text style={styles.successSub}>
          Your withdrawal request has been received.{'\n'}
          Our team will transfer funds to your account within 24–48 hours.
        </Text>
        <TouchableOpacity
          style={styles.successBtn}
          onPress={() => router.replace('/(logistics)/earnings')}
          activeOpacity={0.85}
        >
          <Text style={styles.successBtnText}>Back to Earnings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.replace('/(logistics)/earnings')} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw Earnings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Available Balance chip */}
        <View style={styles.balanceChip}>
          <Feather name="credit-card" size={14} color="#1565C0" />
          {balanceLoading ? (
            <Text style={styles.balanceChipText}>Loading balance…</Text>
          ) : availableBalance !== null ? (
            <Text style={styles.balanceChipText}>
              Available: <Text style={styles.balanceChipAmount}>₨ {availableBalance.toLocaleString()}</Text>
            </Text>
          ) : (
            <Text style={styles.balanceChipText}>Balance unavailable</Text>
          )}
        </View>

        {/* Amount */}
        <View style={styles.section}>
          <Text style={styles.label}>Withdrawal Amount</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currency}>₨</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="Min. 500"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            {availableBalance !== null && (
              <TouchableOpacity
                onPress={() => setAmount(Math.floor(availableBalance).toString())}
                style={styles.maxBtn}
              >
                <Text style={styles.maxBtnText}>MAX</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.methodGrid}>
            {METHODS.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.methodBtn, method === m.id && { borderColor: m.color, backgroundColor: `${m.color}10` }]}
                onPress={() => setMethod(m.id)}
              >
                <View style={[styles.dot, method === m.id && { backgroundColor: m.color }]} />
                <Text style={[styles.methodLabel, method === m.id && { color: m.color }]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Account Details */}
        <View style={styles.section}>
          <Text style={styles.label}>Account Details</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Account Title / Full Name"
            placeholderTextColor="#94A3B8"
            value={accountTitle}
            onChangeText={setAccountTitle}
          />
          <TextInput
            style={[styles.textInput, { marginTop: 12 }]}
            placeholder={isMobileWallet ? 'Mobile Wallet Number (03xx-xxxxxxx)' : 'IBAN / Account Number'}
            placeholderTextColor="#94A3B8"
            keyboardType={isMobileWallet ? 'phone-pad' : 'default'}
            value={accountNumber}
            onChangeText={setAccountNumber}
          />
          {method === 'bank_transfer' && (
            <TextInput
              style={[styles.textInput, { marginTop: 12 }]}
              placeholder="Bank Name (e.g. HBL, UBL, Meezan)"
              placeholderTextColor="#94A3B8"
              value={bankName}
              onChangeText={setBankName}
            />
          )}
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Feather name="shield" size={16} color="#1565C0" />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Secure Manual Payout</Text>
            <Text style={styles.infoText}>
              Withdrawal requests are reviewed by our admin team. Funds are transferred within 24–48 hours after approval.
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* Submit */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.withdrawBtn, loading && { opacity: 0.7 }]}
          onPress={handlePress}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="send" size={18} color="#fff" />
              <Text style={styles.withdrawBtnText}>Submit Withdrawal Request</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingBottom: 20, paddingHorizontal: 24,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },

  content: { padding: 24, paddingBottom: 40 },

  balanceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EFF6FF', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 28,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  balanceChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  balanceChipAmount: { fontWeight: '900', color: '#1565C0' },

  section: { marginBottom: 28 },
  label: {
    fontSize: 13, fontWeight: '800', color: '#94A3B8',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
  },

  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFB',
    borderRadius: 20, paddingHorizontal: 20, height: 64,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  currency: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginRight: 10 },
  amountInput: { flex: 1, fontSize: 24, fontWeight: '900', color: '#1E293B' },
  maxBtn: {
    backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, borderColor: '#93C5FD',
  },
  maxBtnText: { fontSize: 10, fontWeight: '900', color: '#1D4ED8', letterSpacing: 0.5 },

  methodGrid: { flexDirection: 'row', gap: 10 },
  methodBtn: {
    flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: '#F1F5F9',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E2E8F0' },
  methodLabel: { fontSize: 12, fontWeight: '700', color: '#64748B' },

  textInput: {
    backgroundColor: '#F8FAFB', borderRadius: 16, paddingHorizontal: 20,
    height: 56, borderWidth: 1, borderColor: '#F1F5F9',
    fontSize: 15, fontWeight: '600', color: '#1E293B',
  },

  infoBox: {
    flexDirection: 'row', gap: 12, padding: 16,
    backgroundColor: '#EFF6FF', borderRadius: 16,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  infoTitle: { fontSize: 12, fontWeight: '800', color: '#1E40AF', marginBottom: 4 },
  infoText: { fontSize: 12, color: '#1D4ED8', lineHeight: 18, fontWeight: '500' },

  footer: { padding: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  withdrawBtn: {
    backgroundColor: '#1565C0', height: 56, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  withdrawBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },

  successContainer: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1565C0', gap: 16, padding: 32,
  },
  successIconWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  successTitle: { fontSize: 26, fontWeight: '900', color: '#fff', textAlign: 'center' },
  successSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center',
    lineHeight: 22, fontWeight: '500', marginBottom: 8,
  },
  successBtn: {
    backgroundColor: '#fff', borderRadius: 16,
    paddingHorizontal: 40, paddingVertical: 14, marginTop: 8,
  },
  successBtnText: { fontSize: 15, fontWeight: '900', color: '#1565C0' },
});
