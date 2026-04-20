import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui';
import { EscrowBadge } from '@/components/checkout/EscrowBadge';
import { useCartStore } from '@/store/cartStore';

const MOCK_ADDRESSES = [
  { id: '1', label: 'Home', address: 'House 42, Street 5, DHA Phase 6, Lahore', icon: 'home' },
  { id: '2', label: 'Work', address: 'Office 12, Arfa Tower, Ferozepur Road, Lahore', icon: 'briefcase' },
];

const MOCK_PAYMENTS = [
  { id: 'wallet', label: 'DigitalKisan Wallet', subtitle: 'Balance: ₨15,400', emoji: '💳', type: 'escrow' },
  { id: 'jazzcash', label: 'JazzCash Escrow', subtitle: 'Pay securely via JazzCash', emoji: '🟡', type: 'escrow' },
  { id: 'easypaisa', label: 'Easypaisa Escrow', subtitle: 'Pay securely via Easypaisa', emoji: '🟢', type: 'escrow' },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState('1');
  const [selectedPayment, setSelectedPayment] = useState('wallet');

  // Load live cart data
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const delivery = totalPrice > 0 ? 80 : 0;
  const tax = +(totalPrice * 0.05).toFixed(2);
  const grandTotal = totalPrice + delivery + tax;

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Complete order
      const clearCart = useCartStore.getState().clearCart;
      clearCart();
      router.replace('/(buyer)/order-confirmed');
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  // Reusable Step circle
  const StepIndicator = ({ num, label, isActive, isDone }: { num: number, label: string, isActive: boolean, isDone: boolean }) => (
    <View className="items-center">
      <View className={`w-10 h-10 rounded-full items-center justify-center mb-1.5 border-2 ${isActive || isDone ? 'bg-primary border-primary' : 'bg-white border-gray-300'}`}>
        {isDone ? (
          <Feather name="check" size={20} color="#fff" />
        ) : (
          <Text className={`font-bold text-sm ${isActive ? 'text-white' : 'text-gray-400'}`}>{num}</Text>
        )}
      </View>
      <Text className={`text-xs uppercase font-bold tracking-wider ${isActive ? 'text-primary' : isDone ? 'text-textPrimary' : 'text-gray-400'}`}>{label}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-background pt-12">
      {/* ── HEADER ── */}
      <View className="px-6 mb-2 flex-row items-center border-b border-gray-100 pb-4">
        <TouchableOpacity onPress={handleBack} className="w-10 h-10 items-center justify-center rounded-xl bg-gray-50 mr-4">
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-textPrimary">Secure Checkout</Text>
        <View className="ml-auto bg-green-50 px-3 py-1.5 rounded-full flex-row items-center">
           <Feather name="shield" size={14} color={Colors.green[700]} />
           <Text className="text-green-800 text-[10px] font-bold ml-1.5 uppercase">Protected</Text>
        </View>
      </View>

      {/* ── PROGRESS TRACKER ── */}
      <View className="flex-row justify-center items-center px-8 mb-6 mt-4">
        <StepIndicator num={1} label="Address" isActive={step === 1} isDone={step > 1} />
        <View className={`h-[2px] w-12 mx-3 -mt-4 ${step > 1 ? 'bg-primary' : 'bg-gray-200'}`} />
        <StepIndicator num={2} label="Payment" isActive={step === 2} isDone={step > 2} />
        <View className={`h-[2px] w-12 mx-3 -mt-4 ${step > 2 ? 'bg-primary' : 'bg-gray-200'}`} />
        <StepIndicator num={3} label="Confirm" isActive={step === 3} isDone={false} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* ── STEP 1: DELIVERY ── */}
        {step === 1 && (
          <View>
            <Text className="text-xl font-bold text-textPrimary mb-5">Where should we deliver?</Text>
            
            {MOCK_ADDRESSES.map(addr => (
              <TouchableOpacity 
                key={addr.id}
                onPress={() => setSelectedAddress(addr.id)}
                className={`flex-row p-5 rounded-2xl border mb-4 shadow-sm ${selectedAddress === addr.id ? 'bg-primary-50 border-primary' : 'bg-white border-gray-200'}`}
              >
                <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${selectedAddress === addr.id ? 'bg-primary' : 'bg-gray-100'}`}>
                  <Feather name={addr.icon as any} size={20} color={selectedAddress === addr.id ? '#fff' : Colors.textSecondary} />
                </View>
                <View className="flex-1 justify-center">
                  <Text className="font-bold text-textPrimary text-base mb-1">{addr.label}</Text>
                  <Text className="text-textSecondary text-xs leading-5">{addr.address}</Text>
                </View>
                <View className="ml-3 justify-center">
                  <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${selectedAddress === addr.id ? 'border-primary bg-primary' : 'border-gray-300 bg-transparent'}`}>
                    {selectedAddress === addr.id && <Feather name="check" size={12} color="#fff" />}
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity className="flex-row items-center justify-center bg-white border-2 border-dashed border-gray-300 rounded-2xl p-4 mb-6">
              <Feather name="plus" size={20} color={Colors.primary} />
              <Text className="text-primary font-bold ml-2">Add New Address</Text>
            </TouchableOpacity>

            <Text className="text-textPrimary font-bold mb-2">Delivery Instructions</Text>
            <TextInput 
              placeholder="e.g. Call upon arrival, leave at door..."
              multiline
              numberOfLines={3}
              className="bg-white border border-gray-200 rounded-xl p-4 text-textPrimary h-24 text-top"
              style={{ textAlignVertical: 'top' }}
            />
          </View>
        )}

        {/* ── STEP 2: PAYMENT ── */}
        {step === 2 && (
          <View>
            <View className="mb-6">
              <EscrowBadge variant="holding" size="sm" />
            </View>

            <Text className="text-xl font-bold text-textPrimary mb-5">Select Escrow Provider</Text>
            
            {MOCK_PAYMENTS.map(pay => (
              <TouchableOpacity 
                key={pay.id}
                onPress={() => setSelectedPayment(pay.id)}
                className={`flex-row items-center p-5 rounded-2xl border mb-4 shadow-sm ${selectedPayment === pay.id ? 'bg-primary-50 border-primary' : 'bg-white border-gray-200'}`}
              >
                <Text className="text-4xl mr-4">{pay.emoji}</Text>
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <Text className="font-bold text-textPrimary text-base mr-2">{pay.label}</Text>
                    {pay.type === 'escrow' && (
                      <View className="bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                        <Text className="text-[9px] font-bold text-blue-800 uppercase">Escrow</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-textSecondary text-xs font-medium">{pay.subtitle}</Text>
                </View>
                <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${selectedPayment === pay.id ? 'border-primary bg-primary' : 'border-gray-300 bg-transparent'}`}>
                  {selectedPayment === pay.id && <Feather name="check" size={12} color="#fff" />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── STEP 3: CONFIRM ── */}
        {step === 3 && (
          <View>
            <Text className="text-xl font-bold text-textPrimary mb-4">Review Order</Text>

            <View className="mb-6">
              <EscrowBadge variant="locked" amount={grandTotal} />
            </View>

            <View className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-6">
              <Text className="font-bold text-textPrimary mb-3 border-b border-gray-100 pb-3 text-lg">Order Summary</Text>
              
              {items.map(item => (
                <View key={item.productId} className="flex-row justify-between mb-3">
                  <View className="flex-1 mr-4">
                    <Text className="text-textPrimary font-medium">{item.name}</Text>
                    <Text className="text-textSecondary text-xs">Qty: {item.quantity} {item.unit}</Text>
                  </View>
                  <Text className="text-textPrimary font-medium">₨{(item.price * item.quantity).toLocaleString()}</Text>
                </View>
              ))}
              
              <View className="w-full h-[1px] bg-gray-100 my-2" />
              
              <View className="flex-row justify-between mb-2 mt-2">
                <Text className="text-textSecondary">Subtotal</Text>
                <Text className="text-textPrimary font-medium">₨{totalPrice.toLocaleString()}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-textSecondary">Delivery</Text>
                <Text className="text-textPrimary font-medium">₨{delivery}</Text>
              </View>
              <View className="flex-row justify-between mb-4">
                <Text className="text-textSecondary">GST (5%)</Text>
                <Text className="text-textPrimary font-medium">₨{tax}</Text>
              </View>

              <View className="w-full h-[1px] bg-gray-200 mb-4" />
              
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-bold text-textPrimary">Total Payment</Text>
                <Text className="text-2xl font-bold text-primary">₨{grandTotal.toLocaleString()}</Text>
              </View>
            </View>

            {/* Delivery address mini card */}
            <View className="bg-white p-4 rounded-xl border border-gray-200 mb-4 flex-row items-center">
              <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                <Feather name="map-pin" size={16} color={Colors.textSecondary} />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] text-textSecondary uppercase font-bold tracking-wider mb-0.5">Delivering To</Text>
                <Text className="font-bold text-textPrimary text-sm">{MOCK_ADDRESSES.find(a => a.id === selectedAddress)?.label}</Text>
              </View>
              <TouchableOpacity onPress={() => setStep(1)}>
                <Text className="text-primary font-bold text-xs uppercase tracking-wider">Edit</Text>
              </TouchableOpacity>
            </View>

             {/* Payment method mini card */}
             <View className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex-row items-center">
              <Text className="text-2xl mr-3">{MOCK_PAYMENTS.find(p => p.id === selectedPayment)?.emoji}</Text>
              <View className="flex-1">
                <Text className="text-[10px] text-textSecondary uppercase font-bold tracking-wider mb-0.5">Paying via Escrow</Text>
                <Text className="font-bold text-textPrimary text-sm">{MOCK_PAYMENTS.find(p => p.id === selectedPayment)?.label}</Text>
              </View>
              <TouchableOpacity onPress={() => setStep(2)}>
                <Text className="text-primary font-bold text-xs uppercase tracking-wider">Edit</Text>
              </TouchableOpacity>
            </View>

          </View>
        )}
      </ScrollView>

      {/* ── FOOTER ACTION ── */}
      <View className="px-6 py-5 bg-white border-t border-gray-100 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
        <Button 
          variant="primary" 
          label={step === 3 ? "Lock Funds & Secure Order →" : "Continue"} 
          onPress={handleNext}
          size="lg"
          fullWidth
          leftIcon={step === 3 ? <Feather name="lock" size={18} color="#fff" /> : undefined}
          style={step === 3 ? { backgroundColor: Colors.agri.shab } : undefined} // Darker trust color
        />
        {step === 3 && (
          <Text className="text-center text-[10px] text-textSecondary mt-3 uppercase tracking-widest font-bold">
            No charge until delivery is confirmed
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
