import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui';
import { EscrowBadge } from '@/components/checkout/EscrowBadge';
import { StatusTimeline, TimelineStep } from '@/components/checkout/StatusTimeline';

const ORDER_TRACKER: TimelineStep[] = [
  { key: 't1', label: 'Order Placed', subtitle: 'Funds secured in DigitalKisan Escrow', timestamp: 'Just now', icon: 'lock' },
  { key: 't2', label: 'Farmer Confirmation', subtitle: 'Waiting for farmer to accept' },
  { key: 't3', label: 'Packed' },
  { key: 't4', label: 'Out for Delivery' },
  { key: 't5', label: 'Delivered' },
];

export default function OrderConfirmedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Animation state
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 16 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* ── Animated Escrow Lock Sequence ── */}
        <View className="items-center mb-8 pt-6">
          <Animated.View 
            style={{ 
              transform: [{ scale: scaleValue }], 
              opacity: opacityValue 
            }}
            className="w-24 h-24 bg-blue-50 rounded-full items-center justify-center mb-5 border-4 border-blue-100 relative"
          >
            <View className="w-full h-full absolute items-center justify-center">
               {/* Pulsing ring effect could go here */}
               <View className="w-[120%] h-[120%] border-2 border-blue-200/50 rounded-full absolute" />
            </View>
            <Feather name="shield" size={42} color={Colors.info} />
            <View className="absolute bottom-1 right-2 bg-white rounded-full p-1 shadow-sm">
                <Feather name="check-circle" size={16} color={Colors.green[600]} />
            </View>
          </Animated.View>
          
          <Animated.Text style={{ opacity: opacityValue }} className="text-3xl font-bold text-textPrimary text-center mb-2">
            Payment Secured!
          </Animated.Text>
          <Animated.Text style={{ opacity: opacityValue }} className="text-textSecondary text-base text-center leading-6 px-4">
            Your money is locked safely in <Text className="font-bold text-textPrimary">escrow</Text>. 
            The farmer won't be paid until you receive your order.
          </Animated.Text>
        </View>

        {/* ── Escrow Trust Badge ── */}
        <View className="mb-8">
            <EscrowBadge variant="holding" size="lg" />
        </View>

        {/* ── Order Details Summary ── */}
        <View className="bg-gray-50 rounded-2xl p-5 border border-gray-200 mb-8 mx-auto w-full shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]">
          <View className="flex-row justify-between mb-3 border-b border-gray-200 pb-3">
            <Text className="text-textSecondary font-medium">Order ID</Text>
            <Text className="text-textPrimary font-bold">#DK-89420</Text>
          </View>
          <View className="flex-row justify-between mb-3 border-b border-gray-200 pb-3">
            <Text className="text-textSecondary font-medium">Amount Locked</Text>
            <Text className="text-primary font-bold">₨7,190</Text>
          </View>
          <View className="flex-row justify-between mb-3 border-b border-gray-200 pb-3">
            <Text className="text-textSecondary font-medium">Payment Method</Text>
            <Text className="text-textPrimary font-bold">Wallet Escrow</Text>
          </View>
          <View className="flex-row justify-between items-center">
             <View>
                <Text className="text-textSecondary font-medium">ETA</Text>
             </View>
             <View className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                <Text className="text-primary font-bold text-xs uppercase tracking-wider">Tomorrow, 4 PM</Text>
             </View>
          </View>
        </View>

        {/* ── Reusable Status Timeline ── */}
        <View className="mb-6 px-2">
          <Text className="text-lg font-bold text-textPrimary mb-6 tracking-wide">Live Tracking</Text>
          <StatusTimeline steps={ORDER_TRACKER} current={1} />
        </View>

      </ScrollView>

      {/* ── Action Buttons ── */}
      <View className="px-6 py-5 bg-white border-t border-gray-100 flex-row gap-x-4 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]" style={{ paddingBottom: insets.bottom + 16 }}>
        <Button 
          variant="outline" 
          label="Track Order" 
          onPress={() => router.push('/(buyer)/orders/tracking/ORD123451' as any)}
          style={{ flex: 1 }}
          size="lg"
        />
        <Button 
          variant="primary" 
          label="Home" 
          onPress={() => router.push('/(buyer)/home')}
          style={{ flex: 1 }}
          size="lg"
        />
      </View>
    </View>
  );
}
