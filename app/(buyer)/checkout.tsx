import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, StyleSheet, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui';
import { EscrowBadge } from '@/components/checkout/EscrowBadge';
import { useCartStore } from '@/store/cartStore';
import { LinearGradient } from 'expo-linear-gradient';
import orderService from '@/services/order.service';
import userService from '@/services/user.service';

const { width } = Dimensions.get('window');

const PAYMENT_OPTIONS = (balance: number) => [
  { id: 'wallet', label: 'DigitalKisan Wallet', subtitle: `Balance: ₨ ${balance.toLocaleString()}`, icon: 'credit-card', type: 'escrow' },
  { id: 'jazzcash', label: 'JazzCash Escrow', subtitle: 'Coming Soon', icon: 'smartphone', type: 'escrow', disabled: true },
  { id: 'easypaisa', label: 'Easypaisa Escrow', subtitle: 'Coming Soon', icon: 'zap', type: 'escrow', disabled: true },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('wallet');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  useEffect(() => {
    userService.getWallet().then(data => {
      setWalletBalance(data.availableBalance);
    }).catch(() => setWalletBalance(0));
  }, []);

  // Load live cart data
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const clearCart = useCartStore((s) => s.clearCart);
  const delivery = totalPrice > 0 ? 80 : 0;
  const tax = +(totalPrice * 0.05).toFixed(2);
  const grandTotal = totalPrice + delivery + tax;

  const handleNext = async () => {
    if (step === 1) {
      if (!deliveryAddress.trim()) {
        if (Platform.OS === 'web') window.alert('Address Required: Please enter your delivery address.');
        else Alert.alert('Address Required', 'Please enter your delivery address.');
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (selectedPayment === 'wallet' && walletBalance < grandTotal) {
        const msg = `Your wallet balance (₨ ${walletBalance.toLocaleString()}) is less than the total amount (₨ ${grandTotal.toLocaleString()}). Please top up your wallet.`;
        
        if (Platform.OS === 'web') {
           const confirmTopup = window.confirm(`${msg}\n\nDo you want to add money?`);
           if (confirmTopup) router.push('/(buyer)/wallet/topup' as any);
           return;
        }

        Alert.alert(
          'Insufficient Balance',
          msg,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Add Money', onPress: () => router.push('/(buyer)/wallet/topup' as any) }
          ]
        );
        return;
      }
      setStep(3);
      return;
    }

    // Step 3: Submit — Create real orders for each cart item
    setIsSubmitting(true);
    try {
      const orderPromises = items.map(item =>
        orderService.create({
          productId: item.productId,
          quantity: item.quantity,
          shippingAddress: { address: deliveryAddress.trim() },
          paymentGatewayRef: `${selectedPayment.toUpperCase()}_${Date.now()}`,
        })
      );

      await Promise.all(orderPromises);
      clearCart();
      router.replace('/(buyer)/order-confirmed' as any);
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message ?? 'Something went wrong. Please try again.';
      if (Platform.OS === 'web') window.alert(`Order Failed: ${errorMsg}`);
      else Alert.alert('Order Failed', errorMsg, [{ text: 'OK' }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  const StepIndicator = ({ num, label, isActive, isDone }: { num: number, label: string, isActive: boolean, isDone: boolean }) => (
    <View style={styles.stepItem}>
      <View style={[styles.stepCircle, (isActive || isDone) ? styles.stepCircleActive : styles.stepCircleInactive]}>
        {isDone ? (
          <Feather name="check" size={18} color="#fff" />
        ) : (
          <Text style={[styles.stepNum, isActive ? { color: '#fff' } : { color: '#94A3B8' }]}>{num}</Text>
        )}
      </View>
      <Text style={[styles.stepLabel, isActive ? { color: Colors.agri.sabz } : { color: '#94A3B8' }]}>{label}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      {/* ── HEADER ── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Secure Checkout</Text>
        <View style={styles.shieldBadge}>
           <Feather name="shield" size={12} color="#059669" />
           <Text style={styles.shieldText}>Escrow Active</Text>
        </View>
      </View>

      {/* ── PROGRESS TRACKER ── */}
      <View style={styles.progressTracker}>
        <StepIndicator num={1} label="Shipping" isActive={step === 1} isDone={step > 1} />
        <View style={[styles.progressLine, { backgroundColor: step > 1 ? Colors.agri.sabz : '#F1F5F9' }]} />
        <StepIndicator num={2} label="Escrow" isActive={step === 2} isDone={step > 2} />
        <View style={[styles.progressLine, { backgroundColor: step > 2 ? Colors.agri.sabz : '#F1F5F9' }]} />
        <StepIndicator num={3} label="Confirm" isActive={step === 3} isDone={false} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ── STEP 1: DELIVERY ── */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Delivery Address</Text>

            <View style={styles.addressInputWrap}>
              <Feather name="map-pin" size={20} color={Colors.agri.sabz} style={{ marginRight: 12 }} />
              <TextInput
                style={styles.addressInput}
                placeholder="Enter full delivery address..."
                placeholderTextColor="#94A3B8"
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.noteBox}>
              <Text style={styles.noteLabel}>Delivery Instructions (optional)</Text>
              <TextInput
                placeholder="e.g. Call my brother at 03xx-xxxxxx..."
                placeholderTextColor="#94A3B8"
                multiline
                style={styles.noteInput}
                value={deliveryNote}
                onChangeText={setDeliveryNote}
              />
            </View>
          </View>
        )}

        {/* ── STEP 2: PAYMENT ── */}
        {step === 2 && (
          <View>
            <View style={styles.escrowHeader}>
               <EscrowBadge variant="holding" size="sm" />
               <Text style={styles.escrowDesc}>Your funds are safely held by DigitalKisan and only released to the farmer after you confirm receipt of quality produce.</Text>
            </View>

            <Text style={styles.stepTitle}>Select Escrow Provider</Text>
            
            {PAYMENT_OPTIONS(walletBalance).map(pay => (
              <TouchableOpacity 
                key={pay.id}
                onPress={() => !(pay as any).disabled && setSelectedPayment(pay.id)}
                activeOpacity={(pay as any).disabled ? 1 : 0.7}
                style={[
                  styles.payCard, 
                  selectedPayment === pay.id && styles.payCardActive,
                  (pay as any).disabled && { opacity: 0.5 }
                ]}
              >
                <View style={[styles.payEmojiWrap, (pay as any).disabled && { backgroundColor: '#F8FAFC' }]}>
                  <Feather name={pay.icon as any} size={22} color={selectedPayment === pay.id ? Colors.agri.sabz : '#94A3B8'} />
                </View>
                <View style={{ flex: 1 }}>
                   <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.payLabel, (pay as any).disabled && { color: '#94A3B8' }]}>{pay.label}</Text>
                      {! (pay as any).disabled && (
                        <View style={styles.verifiedPayBadge}>
                          <Text style={styles.verifiedPayText}>Escrow</Text>
                        </View>
                      )}
                   </View>
                   <Text style={[styles.paySub, (pay as any).disabled && { color: '#CBD5E1' }]}>{pay.subtitle}</Text>
                </View>
                {!(pay as any).disabled ? (
                  <View style={[styles.radioCircle, selectedPayment === pay.id && styles.radioActive]}>
                    {selectedPayment === pay.id && <View style={styles.radioInner} />}
                  </View>
                ) : (
                  <Feather name="lock" size={14} color="#CBD5E1" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── STEP 3: CONFIRM ── */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>Final Verification</Text>

            <View style={styles.paymentSummary}>
               <View style={styles.summaryHeader}>
                  <Text style={styles.summaryTitle}>Bill Summary</Text>
                  <View style={styles.paymentMethodTag}>
                     <Feather name={PAYMENT_OPTIONS(walletBalance).find(p => p.id === selectedPayment)?.icon as any} size={14} color="#475569" />
                     <Text style={styles.paymentMethodName}>{PAYMENT_OPTIONS(walletBalance).find(p => p.id === selectedPayment)?.label}</Text>
                  </View>
               </View>

               <View style={styles.summaryList}>
                  {items.map(item => (
                    <View key={item.productId} style={styles.summaryItem}>
                      <Text style={styles.summaryItemName}>{item.name} <Text style={{ color: '#94A3B8' }}>x {item.quantity}</Text></Text>
                      <Text style={styles.summaryItemPrice}>₨ {(item.price * item.quantity).toLocaleString()}</Text>
                    </View>
                  ))}
                  <View style={styles.divider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.subTotalLabel}>Subtotal</Text>
                    <Text style={styles.subTotalVal}>₨ {totalPrice.toLocaleString()}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.subTotalLabel}>Delivery Fee</Text>
                    <Text style={styles.subTotalVal}>₨ {delivery}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.subTotalLabel}>Processing / Tax</Text>
                    <Text style={styles.subTotalVal}>₨ {tax}</Text>
                  </View>
               </View>

               <View style={styles.totalSection}>
                  <Text style={styles.finalLabel}>Amount to Lock</Text>
                  <Text style={styles.finalVal}>₨ {grandTotal.toLocaleString()}</Text>
               </View>
            </View>

            <View style={styles.destinationPreview}>
               <View style={styles.destIcon}>
                  <Feather name="map-pin" size={16} color={Colors.agri.sabz} />
               </View>
               <View style={{ flex: 1 }}>
                  <Text style={styles.destTitle}>Shipment Destination</Text>
                  <Text style={styles.destVal} numberOfLines={2}>{deliveryAddress || 'No address entered'}</Text>
               </View>
               <TouchableOpacity onPress={() => setStep(1)}>
                  <Text style={styles.editLink}>Change</Text>
               </TouchableOpacity>
            </View>

            <View style={styles.securityWarning}>
               <Feather name="lock" size={14} color="#065F46" />
               <Text style={styles.securityText}>Funds will be placed in a non-custodial escrow until successful delivery confirmation.</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── FOOTER ACTION ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleNext}
          disabled={isSubmitting}
          style={[styles.mainBtn, step === 3 && { backgroundColor: '#1E293B' }, isSubmitting && { opacity: 0.7 }]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.mainBtnText}>
                {step === 3 ? "Lock Funds & Confirm Order" : "Proceed to Escrow"}
              </Text>
              <Feather name={step === 3 ? "shield" : "arrow-right"} size={18} color="#fff" style={{ marginLeft: 10 }} />
            </>
          )}
        </TouchableOpacity>
        {step === 3 && (
          <Text style={styles.footerDisclaimer}>
            100% SATISFACTION GUARANTEE · ESCROW PROTECTED
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingBottom: 20, paddingHorizontal: 24,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary, flex: 1 },
  shieldBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#ECFDF5', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
  },
  shieldText: { color: '#059669', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

  progressTracker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 24, paddingHorizontal: 40 },
  stepItem: { alignItems: 'center', gap: 6 },
  stepCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  stepCircleActive: { backgroundColor: Colors.agri.sabz, borderColor: Colors.agri.sabz },
  stepCircleInactive: { backgroundColor: '#fff', borderColor: '#E2E8F0' },
  stepNum: { fontSize: 14, fontWeight: '900' },
  stepLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  progressLine: { width: 40, height: 2, marginHorizontal: 8, marginTop: -18 },

  scrollContent: { paddingHorizontal: 24, paddingBottom: 140 },
  stepTitle: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 24, letterSpacing: -0.5 },

  // Address input
  addressInputWrap: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff',
    padding: 16, borderRadius: 20, marginBottom: 20,
    borderWidth: 1.5, borderColor: Colors.agri.sabz,
  },
  addressInput: {
    flex: 1, fontSize: 14, fontWeight: '600', color: '#1E293B',
    minHeight: 80, textAlignVertical: 'top', paddingTop: 2,
  },

  // Addresses
  addressCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    padding: 16, borderRadius: 20, marginBottom: 12, gap: 12,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  addressCardActive: { borderColor: Colors.agri.sabz, backgroundColor: '#FAFEFB' },
  addressIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  addressLabel: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginBottom: 3 },
  addressSub: { fontSize: 12, color: '#94A3B8', fontWeight: '500', lineHeight: 18 },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Colors.agri.sabz },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.agri.sabz },

  addNewAddr: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.agri.sabz,
    marginTop: 8, marginBottom: 24, gap: 8,
  },
  addNewAddrText: { color: Colors.agri.sabz, fontSize: 14, fontWeight: '800' },

  noteBox: { marginTop: 8 },
  noteLabel: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10, textTransform: 'uppercase' },
  noteInput: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, height: 100,
    borderWidth: 1, borderColor: '#F1F5F9', textAlignVertical: 'top',
    fontSize: 14, fontWeight: '600', color: '#1E293B',
  },

  // Escrow Step
  escrowHeader: { backgroundColor: '#F8FAFC', padding: 20, borderRadius: 20, marginBottom: 28, borderWidth: 1, borderColor: '#EEF2F7' },
  escrowDesc: { fontSize: 12, color: '#64748B', fontWeight: '500', marginTop: 12, lineHeight: 18 },

  payCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    padding: 16, borderRadius: 20, marginBottom: 12, gap: 12,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  payCardActive: { borderColor: Colors.agri.sabz, backgroundColor: '#FAFEFB' },
  payEmojiWrap: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  payLabel: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  verifiedPayBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
  verifiedPayText: { fontSize: 8, fontWeight: '900', color: '#1E40AF', textTransform: 'uppercase' },
  paySub: { fontSize: 12, color: '#94A3B8', fontWeight: '500', marginTop: 2 },

  // Summary Step
  paymentSummary: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 20 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F8FAFB', paddingBottom: 16, marginBottom: 16 },
  summaryTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  paymentMethodTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  paymentMethodName: { fontSize: 11, fontWeight: '800', color: '#475569' },
  summaryList: { gap: 12 },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryItemName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  summaryItemPrice: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  divider: { height: 1, backgroundColor: '#F8FAFB', marginVertical: 4 },
  subTotalLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  subTotalVal: { fontSize: 14, color: '#1E293B', fontWeight: '700' },
  totalSection: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  finalLabel: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  finalVal: { fontSize: 22, fontWeight: '900', color: Colors.agri.sabz },

  destinationPreview: {
    flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff',
    borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', gap: 12, marginBottom: 12,
  },
  destIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  destTitle: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
  destVal: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginTop: 2 },
  editLink: { color: Colors.agri.sabz, fontSize: 12, fontWeight: '800' },

  securityWarning: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, opacity: 0.8 },
  securityText: { fontSize: 10, color: '#065F46', fontWeight: '600', flex: 1, lineHeight: 14 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', padding: 24, borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  mainBtn: {
    backgroundColor: Colors.agri.sabz, height: 60, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.agri.sabz, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
  },
  mainBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  footerDisclaimer: { textAlign: 'center', fontSize: 10, fontWeight: '800', color: '#94A3B8', marginTop: 14, letterSpacing: 1 },
});
