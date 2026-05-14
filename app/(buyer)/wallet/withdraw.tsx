import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, ActivityIndicator, Platform,
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
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 500, 'Minimum withdrawal is ₨ 500'),
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

export default function BuyerWithdrawScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [method, setMethod] = React.useState<'jazzcash' | 'easypaisa' | 'bank_transfer'>('jazzcash');
  const [loading, setLoading] = React.useState(false);
  const [availableBalance, setAvailableBalance] = React.useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = React.useState(true);

  useEffect(() => {
    userService.getWallet()
      .then((data) => setAvailableBalance(data.availableBalance))
      .catch(() => setAvailableBalance(null))
      .finally(() => setBalanceLoading(false));
  }, []);

  const { control, handleSubmit, formState: { errors } } = useForm<WithdrawForm>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: { amount: '', accountTitle: '', accountNumber: '', bankName: '' },
  });

  const showErr = (msg: string) => {
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Error', msg);
  };

  const onSubmit = async (data: WithdrawForm) => {
    const requested = parseFloat(data.amount);

    if (availableBalance !== null && requested > availableBalance) {
      showErr(`You requested ₨ ${requested.toLocaleString()} but your balance is ₨ ${availableBalance.toLocaleString()}.`);
      return;
    }
    if (method === 'bank_transfer' && !data.bankName?.trim()) {
      showErr('Please enter your bank name for bank transfers.');
      return;
    }

    setLoading(true);
    try {
      await userService.requestWithdrawal(requested, method, {
        accountTitle: data.accountTitle,
        accountNumber: data.accountNumber,
        bankName: method === 'bank_transfer' ? data.bankName : undefined,
      });
      const msg = 'Your withdrawal request has been submitted. Funds will be processed within 24–48 hours.';
      if (Platform.OS === 'web') {
        window.alert(msg);
        router.back();
      } else {
        Alert.alert('Request Submitted', msg, [{ text: 'OK', onPress: () => router.back() }]);
      }
    } catch (e: any) {
      showErr(e?.response?.data?.message ?? 'Failed to submit withdrawal request.');
    } finally {
      setLoading(false);
    }
  };

  const isMobileWallet = method === 'jazzcash' || method === 'easypaisa';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw Funds</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Balance chip */}
        <View style={styles.balanceChip}>
          <Feather name="credit-card" size={14} color={Colors.agri.sabz} />
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
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, value } }) => (
              <View style={[styles.amountRow, errors.amount && styles.inputError]}>
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

        {/* Payment method */}
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

        {/* Account details */}
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

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Feather name="info" size={16} color="#64748B" />
          <Text style={styles.disclaimerText}>
            Payouts are processed manually by our finance team within 24–48 hours.
            Ensure your account details are correct before submitting.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>Submit Request</Text>
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
    backgroundColor: '#ECFDF5', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 28,
    borderWidth: 1, borderColor: '#A7F3D0',
  },
  balanceChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  balanceChipAmount: { fontWeight: '900', color: Colors.agri.sabz },

  section: { marginBottom: 28 },
  label: {
    fontSize: 11, fontWeight: '800', color: '#94A3B8',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
  },

  amountRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFB',
    borderRadius: 20, paddingHorizontal: 20, height: 64,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  inputError: { borderColor: Colors.error },
  fieldError: { color: Colors.error, fontSize: 11, fontWeight: '600', marginTop: 4 },
  currency: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginRight: 10 },
  amountInput: { flex: 1, fontSize: 24, fontWeight: '900', color: '#1E293B' },
  maxBtn: {
    backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, borderColor: '#A7F3D0',
  },
  maxBtnText: { fontSize: 10, fontWeight: '900', color: Colors.agri.sabz, letterSpacing: 0.5 },

  methodGrid: { flexDirection: 'row', gap: 10 },
  methodBtn: {
    flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: '#F1F5F9',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E2E8F0' },
  methodLabel: { fontSize: 11, fontWeight: '700', color: '#64748B' },

  textInput: {
    backgroundColor: '#F8FAFB', borderRadius: 16, paddingHorizontal: 20,
    height: 56, borderWidth: 1, borderColor: '#F1F5F9',
    fontSize: 15, fontWeight: '600', color: '#1E293B',
  },

  disclaimer: {
    flexDirection: 'row', gap: 10, padding: 16,
    backgroundColor: '#F8FAFC', borderRadius: 16,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  disclaimerText: { flex: 1, fontSize: 12, color: '#64748B', lineHeight: 18, fontWeight: '500' },

  footer: { padding: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#fff' },
  submitBtn: {
    backgroundColor: Colors.agri.sabz, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
