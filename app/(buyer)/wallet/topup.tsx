import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStripe } from '@stripe/stripe-react-native';
import { Colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import userService from '@/services/user.service';
import paymentService from '@/services/payment.service';
import { useAuthStore } from '@/store/authStore';

export default function TopUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [amount, setAmount] = useState('1000');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [proofInput, setProofInput] = useState('');

  const METHODS = [
    { id: 'stripe', label: 'Debit / Credit Card', icon: 'credit-card', color: '#0EA5E9', bg: '#F0F9FF' },
    { id: 'jazzcash', label: 'JazzCash', icon: 'smartphone', color: '#DB2777', bg: '#FDF2F8' },
    { id: 'easypaisa', label: 'Easypaisa', icon: 'smartphone', color: '#059669', bg: '#ECFDF5' },
    { id: 'bank_transfer', label: 'Bank Transfer', icon: 'home', color: '#0F766E', bg: '#F0FDFA' },
  ];

  const showErr = (msg: string) => {
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Error', msg);
  };
  const showOk = (title: string, msg: string, onClose?: () => void) => {
    if (Platform.OS === 'web') { window.alert(`${title}: ${msg}`); onClose?.(); }
    else Alert.alert(title, msg, onClose ? [{ text: 'OK', onPress: onClose }] : undefined);
  };

  const handleStripeTopup = async (numAmount: number) => {
    const userName = useAuthStore.getState().user?.name ?? 'Customer';
    const { clientSecret, publishableKey } = await paymentService.createStripeTopupIntent(numAmount);

    if (!publishableKey || publishableKey.includes('REPLACE_ME')) {
      showErr('Card payments are not configured yet. Please choose another method.');
      return;
    }

    const { error: initError } = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: 'Digital Kisan',
      defaultBillingDetails: { name: userName },
      allowsDelayedPaymentMethods: false,
    });
    if (initError) throw new Error(initError.message);

    const { error: presentError } = await presentPaymentSheet();
    if (presentError) {
      if (presentError.code === 'Canceled') return; // user dismissed sheet — silent
      throw new Error(presentError.message);
    }

    // Webhook credits the wallet asynchronously. Give it a moment, then return.
    showOk(
      'Payment Successful',
      `₨ ${numAmount.toLocaleString()} will appear in your wallet within a few seconds.`,
      () => router.back()
    );
  };

  const handleManualTopup = async (numAmount: number, method: string) => {
    if (proofInput.trim().length < 4) {
      showErr('Please enter your transaction reference / TX ID from the payment app or bank slip.');
      return;
    }
    await userService.topupWallet(numAmount, method, proofInput.trim());
    showOk(
      'Request Submitted',
      `Your top-up of ₨ ${numAmount.toLocaleString()} is pending admin approval. You'll see the funds in your wallet shortly.`,
      () => router.back()
    );
  };

  const handleTopUp = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 100) {
      showErr('Minimum top-up amount is ₨ 100.');
      return;
    }
    if (!selectedMethod) {
      showErr('Please select a payment method to proceed.');
      return;
    }

    setLoading(true);
    try {
      if (selectedMethod === 'stripe') {
        await handleStripeTopup(numAmount);
      } else {
        await handleManualTopup(numAmount, selectedMethod);
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message ?? error?.message ?? 'Failed to add money. Please try again.';
      showErr(msg);
    } finally {
      setLoading(false);
    }
  };

  const isManual = selectedMethod && selectedMethod !== 'stripe';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Money</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <LinearGradient
            colors={[Colors.agri.sabz, '#059669']}
            style={styles.balanceCard}
          >
            <View style={styles.cardInfo}>
               <View>
                 <Text style={styles.balanceLabel}>DigitalKisan Wallet</Text>
                 <Text style={styles.balanceSub}>Enter amount to top up</Text>
               </View>
               <Feather name="shield" size={24} color="rgba(255,255,255,0.4)" />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.currencySymbol}>₨</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.5)"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </LinearGradient>

          <View style={styles.quickAmounts}>
            {[1000, 2000, 5000, 10000].map((val) => (
              <TouchableOpacity 
                key={val} 
                style={[styles.amountPill, amount === val.toString() && styles.amountPillActive]}
                onPress={() => setAmount(val.toString())}
              >
                <Text style={[styles.amountPillText, amount === val.toString() && styles.amountPillTextActive]}>+₨ {val.toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.paymentMethods}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          {METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[styles.methodRow, selectedMethod === method.id && styles.methodRowActive]}
              activeOpacity={0.7}
              onPress={() => { setSelectedMethod(method.id); setProofInput(''); }}
            >
              <View style={[styles.methodIcon, { backgroundColor: method.bg }]}>
                <Feather name={method.icon as any} size={20} color={method.color} />
              </View>
              <Text style={styles.methodLabel}>{method.label}</Text>
              <View style={[styles.radioCircle, selectedMethod === method.id && styles.radioActive]}>
                {selectedMethod === method.id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {isManual && (
          <View style={styles.proofCard}>
            <Text style={styles.proofTitle}>One more step</Text>
            <Text style={styles.proofHint}>
              {selectedMethod === 'bank_transfer'
                ? 'Transfer the amount to our bank account and enter the bank reference / TX ID below. Admin will verify and credit your wallet.'
                : 'Send the amount from your mobile wallet to our merchant number and enter the TX ID below. Admin will verify and credit your wallet.'}
            </Text>
            <Text style={styles.proofLabel}>Transaction Reference / TX ID</Text>
            <TextInput
              value={proofInput}
              onChangeText={setProofInput}
              placeholder="e.g. JC1234567 or BANK-REF-89231"
              placeholderTextColor="#94A3B8"
              style={styles.proofInput}
              autoCapitalize="characters"
            />
          </View>
        )}

        {selectedMethod === 'stripe' && (
          <View style={styles.stripeNoteCard}>
            <Feather name="shield" size={16} color={Colors.primary} />
            <Text style={styles.stripeNote}>
              You'll be redirected to a secure Stripe payment sheet. Funds appear in your
              wallet automatically once payment is confirmed.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity 
          style={[styles.payBtn, (!amount || !selectedMethod) && { opacity: 0.6 }]} 
          onPress={handleTopUp}
          disabled={!amount || !selectedMethod || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.payBtnText}>Proceed to Payment</Text>
              <Feather name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
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
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  balanceCard: { borderRadius: 20, padding: 24 },
  cardInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  balanceSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  currencySymbol: { color: '#fff', fontSize: 24, fontWeight: '900', marginRight: 8 },
  input: { color: '#fff', fontSize: 36, fontWeight: '900', flex: 1 },
  quickAmounts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 },
  amountPill: {
    backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'transparent'
  },
  amountPillActive: {
    backgroundColor: '#ECFDF5', borderColor: Colors.agri.sabz
  },
  amountPillText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  amountPillTextActive: { color: Colors.agri.sabz },
  paymentMethods: { gap: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1, paddingHorizontal: 4 },
  methodRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 20, gap: 12, borderWidth: 1, borderColor: '#F1F5F9'
  },
  methodRowActive: { borderColor: Colors.agri.sabz, backgroundColor: '#FAFEFB' },
  methodIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  methodLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1E293B' },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Colors.agri.sabz },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.agri.sabz },
  footer: { padding: 24, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F5F9', position: 'absolute', bottom: 0, left: 0, right: 0 },
  payBtn: {
    backgroundColor: Colors.agri.sabz, height: 60, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: Colors.agri.sabz, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4
  },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },

  proofCard: {
    marginTop: 16, backgroundColor: '#fff', borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: '#F1F5F9', gap: 10,
  },
  proofTitle: { fontSize: 13, fontWeight: '900', color: Colors.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 },
  proofHint: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18, fontWeight: '500' },
  proofLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 6 },
  proofInput: {
    backgroundColor: '#F8FAFB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
    fontSize: 14, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 0.5,
  },
  stripeNoteCard: {
    marginTop: 16, backgroundColor: '#ECFDF5', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: '#A7F3D0',
    flexDirection: 'row', alignItems: 'flex-start',
  },
  stripeNote: { flex: 1, fontSize: 12, color: '#065F46', fontWeight: '600', lineHeight: 18, marginLeft: 8 },
});
