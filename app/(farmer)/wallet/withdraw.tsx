import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import userService from '@/services/user.service';

const withdrawSchema = z.object({
  amount: z.string()
    .min(1, 'Amount is required')
    .refine(v => !isNaN(parseFloat(v)) && parseFloat(v) >= 500, 'Minimum withdrawal is ₨ 500'),
  accountTitle: z.string().min(2, 'Account title is required'),
  accountNumber: z.string().min(5, 'Account number is required'),
  bankName: z.string().optional(),
});

type WithdrawForm = z.infer<typeof withdrawSchema>;

const METHODS = [
  { id: 'jazzcash' as const,      label: 'JazzCash',      color: '#DB2777' },
  { id: 'easypaisa' as const,     label: 'Easypaisa',     color: '#059669' },
  { id: 'bank_transfer' as const, label: 'Bank Transfer', color: '#0EA5E9' },
];

export default function FarmerWithdrawalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [method, setMethod] = React.useState<'jazzcash' | 'easypaisa' | 'bank_transfer'>('jazzcash');
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [availableBalance, setAvailableBalance] = React.useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = React.useState(true);

  useEffect(() => {
    userService.getWallet()
      .then(data => setAvailableBalance(data.availableBalance))
      .catch(() => setAvailableBalance(null))
      .finally(() => setBalanceLoading(false));
  }, []);

  const { control, trigger, getValues, formState: { errors } } = useForm<WithdrawForm>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: { amount: '', accountTitle: '', accountNumber: '', bankName: '' },
  });

  const handlePress = async () => {
    const isValid = await trigger();
    if (!isValid) {
      Alert.alert('Missing Information', 'Please fill in all required fields correctly.');
      return;
    }

    const data = getValues();
    const requested = parseFloat(data.amount);

    if (availableBalance !== null && requested > availableBalance) {
      Alert.alert(
        'Insufficient Balance',
        `You requested ₨ ${requested.toLocaleString()} but your available balance is only ₨ ${availableBalance.toLocaleString()}.`
      );
      return;
    }

    if (method === 'bank_transfer' && !data.bankName?.trim()) {
      Alert.alert('Bank Name Required', 'Please enter your bank name for bank transfers.');
      return;
    }

    setLoading(true);
    try {
      await userService.requestWithdrawal(
        requested,
        method,
        {
          accountTitle: data.accountTitle,
          accountNumber: data.accountNumber,
          bankName: method === 'bank_transfer' ? data.bankName : undefined,
        }
      );
      setSubmitted(true);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message ?? 'Failed to submit withdrawal request.');
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
          onPress={() => router.replace('/(farmer)/wallet')}
          activeOpacity={0.85}
        >
          <Text style={styles.successBtnText}>Back to Wallet</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.replace('/(farmer)/wallet')} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw Earnings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Available Balance chip */}
        <View style={styles.balanceChip}>
          <Feather name="credit-card" size={14} color={Colors.primary} />
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

        <View style={styles.section}>
          <Text style={styles.label}>Withdrawal Amount</Text>
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, value } }) => (
              <View style={[styles.inputContainer, errors.amount && styles.inputError]}>
                <Text style={styles.currency}>₨</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="Min. 500"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={onChange}
                />
                {availableBalance !== null && (
                  <TouchableOpacity
                    onPress={() => onChange(Math.floor(availableBalance).toString())}
                    style={styles.maxBtn}
                  >
                    <Text style={styles.maxBtnText}>MAX</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
          {errors.amount && <Text style={styles.fieldError}>{errors.amount.message}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.methodGrid}>
            {METHODS.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.methodBtn, method === m.id && { borderColor: m.color, backgroundColor: `${m.color}08` }]}
                onPress={() => setMethod(m.id)}
              >
                <View style={[styles.dot, method === m.id && { backgroundColor: m.color }]} />
                <Text style={[styles.methodLabel, method === m.id && { color: m.color }]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Account Details</Text>
          <Controller
            control={control}
            name="accountTitle"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.textInput, errors.accountTitle && styles.inputError]}
                placeholder="Account Title / Full Name"
                placeholderTextColor="#94A3B8"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.accountTitle && <Text style={styles.fieldError}>{errors.accountTitle.message}</Text>}

          <Controller
            control={control}
            name="accountNumber"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.textInput, { marginTop: 12 }, errors.accountNumber && styles.inputError]}
                placeholder={isMobileWallet ? 'Mobile Wallet Number (03xx-xxxxxxx)' : 'IBAN / Account Number'}
                placeholderTextColor="#94A3B8"
                keyboardType={isMobileWallet ? 'phone-pad' : 'default'}
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.accountNumber && <Text style={styles.fieldError}>{errors.accountNumber.message}</Text>}

          {method === 'bank_transfer' && (
            <Controller
              control={control}
              name="bankName"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.textInput, { marginTop: 12 }]}
                  placeholder="Bank Name (e.g. HBL, UBL, Meezan)"
                  placeholderTextColor="#94A3B8"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
          )}
        </View>

        <View style={styles.disclaimer}>
          <Feather name="info" size={16} color="#64748B" />
          <Text style={styles.disclaimerText}>
            Payouts are processed manually by our finance team within 24–48 hours.
            Please ensure your account details are correct.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.withdrawBtn, loading && { opacity: 0.7 }]}
          onPress={handlePress}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.withdrawBtnText}>Submit Request</Text>
          }
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
  content: { padding: 24, paddingBottom: 120 },

  balanceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primaryLight, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 28,
    borderWidth: 1, borderColor: `${Colors.primary}30`,
  },
  balanceChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  balanceChipAmount: { fontWeight: '900', color: Colors.primary },

  section: { marginBottom: 32 },
  label: {
    fontSize: 13, fontWeight: '800', color: '#94A3B8',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFB',
    borderRadius: 20, paddingHorizontal: 20, height: 64,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  inputError: { borderColor: Colors.error },
  fieldError: { color: Colors.error, fontSize: 11, fontWeight: '600', marginTop: 4 },
  currency: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginRight: 10 },
  amountInput: { flex: 1, fontSize: 24, fontWeight: '900', color: '#1E293B' },
  maxBtn: {
    backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, borderColor: `${Colors.primary}40`,
  },
  maxBtnText: { fontSize: 10, fontWeight: '900', color: Colors.primary, letterSpacing: 0.5 },

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

  disclaimer: { flexDirection: 'row', gap: 10, padding: 16, backgroundColor: '#F1F5F9', borderRadius: 16 },
  disclaimerText: { flex: 1, fontSize: 12, color: '#64748B', lineHeight: 18, fontWeight: '500' },

  footer: { padding: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  withdrawBtn: {
    backgroundColor: Colors.agri.sabz, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  withdrawBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },

  successContainer: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, gap: 16, padding: 32,
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
  successBtnText: { fontSize: 15, fontWeight: '900', color: Colors.primary },
});
