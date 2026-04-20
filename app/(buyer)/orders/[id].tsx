import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { MOCK_ORDERS } from '@/constants/mockData';
import { Button } from '@/components/ui';
import { EscrowBadge } from '@/components/checkout/EscrowBadge';
import { StatusTimeline, TimelineStep } from '@/components/checkout/StatusTimeline';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const order = MOCK_ORDERS.find(o => o.id === id) || MOCK_ORDERS[0];

  // Map order status to timeline
  const isDelivered = order.status === 'Delivered';
  const isCancelled = order.status === 'Cancelled';
  
  // Decide active step based on deliveryProgress if Active
  let activeStep = 0;
  if (isDelivered) activeStep = 5;
  if (isCancelled) activeStep = -1;
  if (order.status === 'Active') {
     if (order.deliveryProgress >= 100) activeStep = 4;
     else if (order.deliveryProgress >= 60) activeStep = 3;
     else if (order.deliveryProgress >= 30) activeStep = 2;
     else activeStep = 1;
  }

  const ORDER_TRACKER: TimelineStep[] = [
    { key: 't1', label: 'Order Placed', timestamp: 'Oct 08, 10:30 AM', icon: 'lock' },
    { key: 't2', label: 'Confirmed by Farmer', timestamp: 'Oct 08, 11:15 AM' },
    { key: 't3', label: 'Packed & Ready', subtitle: 'Quality checked' },
    { key: 't4', label: 'Out for Delivery', subtitle: 'Rider is on the way' },
    { key: 't5', label: 'Delivered', subtitle: 'Escrow released' },
  ];

  const handleBack = () => router.back();

  const getEscrowVariant = () => {
    if (isDelivered) return 'released';
    if (isCancelled) return 'refunded';
    return 'holding';
  };

  return (
    <View className="flex-1 bg-background pt-12">
      {/* ── HEADER ── */}
      <View className="px-6 mb-4 flex-row items-center justify-between border-b border-gray-100 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={handleBack} className="w-10 h-10 items-center justify-center rounded-xl bg-gray-50 mr-4">
            <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold text-textPrimary">Order Details</Text>
            <Text className="text-xs text-textSecondary uppercase tracking-widest">{order.id}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        
        {/* ── ESCROW BADGE ── */}
        <View className="mb-6 mt-2">
            <EscrowBadge variant={getEscrowVariant()} size="lg" amount={order.total} />
        </View>

        {/* ── TRACKING QUICK VIEW ── */}
        {!isCancelled && (
            <View className="bg-white rounded-2xl p-5 border border-gray-200 mb-6 shadow-sm">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="font-bold text-base text-textPrimary">Delivery Status</Text>
                    {order.status === 'Active' && (
                       <TouchableOpacity 
                         onPress={() => router.push(`/(buyer)/orders/tracking/${order.id}` as any)}
                         className="flex-row items-center gap-x-1"
                       >
                           <Text className="text-primary font-bold text-xs uppercase tracking-wider">Live Track</Text>
                           <Feather name="chevron-right" size={14} color={Colors.primary} />
                       </TouchableOpacity>
                    )}
                </View>
                <StatusTimeline steps={ORDER_TRACKER} current={activeStep} variant="compact" />
            </View>
        )}

        {/* ── ITEMS ── */}
        <View className="bg-white rounded-2xl p-5 border border-gray-200 mb-6 shadow-sm">
          <Text className="font-bold text-base text-textPrimary mb-4 border-b border-gray-100 pb-2">Items Ordered</Text>
          {order.items.map((item, idx) => (
            <View key={item.id} className={`flex-row items-center ${idx !== order.items.length - 1 ? 'mb-4 border-b border-gray-50 pb-4' : ''}`}>
              <View className="w-12 h-12 rounded-xl bg-gray-50 items-center justify-center mr-4">
                <Text className="text-2xl">{item.emoji}</Text>
              </View>
              <View className="flex-1">
                <Text className="font-bold text-textPrimary text-sm">{item.name}</Text>
                <Text className="text-textSecondary text-xs">Qty: {item.qty} {item.unit}</Text>
              </View>
              <View className="items-end">
                  <Text className="font-bold text-textPrimary">₨{(item.price * item.qty).toLocaleString()}</Text>
                  <Text className="text-textSecondary text-[10px]">₨{item.price}/{item.unit}</Text>
              </View>
            </View>
          ))}
          
          <View className="w-full h-[1px] bg-gray-100 my-4" />
          <View className="flex-row justify-between items-center">
            <Text className="text-sm font-bold text-textPrimary">Total Amount</Text>
            <Text className="text-xl font-bold text-primary">₨{order.total.toLocaleString()}</Text>
          </View>
        </View>

        {/* ── DELIVERY DETAILS ── */}
        <View className="bg-white rounded-2xl p-5 border border-gray-200 mb-6 shadow-sm">
          <Text className="font-bold text-base text-textPrimary mb-4 border-b border-gray-100 pb-2">Delivery Details</Text>
          
          <View className="flex-row items-start mb-4">
            <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center mr-3 mt-1">
              <Feather name="map-pin" size={14} color={Colors.info} />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-textSecondary uppercase font-bold tracking-wider mb-0.5">Shipping Address</Text>
              <Text className="font-medium text-textPrimary text-sm leading-5">{order.address}</Text>
            </View>
          </View>

          <View className="flex-row items-start">
            <View className="w-8 h-8 rounded-full bg-purple-50 items-center justify-center mr-3 mt-1">
              <FontAwesome5 name="store" size={12} color="#9333EA" />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-textSecondary uppercase font-bold tracking-wider mb-0.5">Fulfillment By</Text>
              <Text className="font-medium text-textPrimary text-sm">{order.farmerName}</Text>
              <Text className="text-textSecondary text-xs">{order.farmName}</Text>
            </View>
            <TouchableOpacity className="border border-purple-200 px-3 py-1.5 rounded-lg">
                <Text className="text-purple-700 font-bold text-xs">Contact</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── PAYMENT ── */}
        <View className="bg-white rounded-2xl p-5 border border-gray-200 mb-6 shadow-sm">
          <Text className="font-bold text-base text-textPrimary mb-4 border-b border-gray-100 pb-2">Payment Secure Details</Text>
          <View className="flex-row justify-between mb-3">
              <Text className="text-textSecondary">Method</Text>
              <View className="flex-row items-center gap-x-1.5">
                 <Feather name="lock" size={12} color={Colors.success} />
                 <Text className="font-medium text-textPrimary">{order.paymentMethod} Escrow</Text>
              </View>
          </View>
          <View className="flex-row justify-between mb-3">
              <Text className="text-textSecondary">Transaction ID</Text>
              <Text className="font-medium text-textPrimary">TXN-99482A1</Text>
          </View>
          <View className="flex-row justify-between">
              <Text className="text-textSecondary">Funds Status</Text>
              <Text className={`font-bold ${isDelivered ? 'text-green-600' : isCancelled ? 'text-red-500' : 'text-amber-500'}`}>
                 {isDelivered ? 'Released to Farmer' : isCancelled ? 'Refunded to you' : 'Locked in Escrow'}
              </Text>
          </View>
        </View>

      </ScrollView>

      {/* ── ACTIONS ── */}
      {order.status === 'Active' && (
         <View className="px-6 py-4 bg-white border-t border-gray-100 pb-8 flex-row gap-x-4">
             <Button 
                variant="primary" 
                label="Confirm Delivery" 
                onPress={() => router.push(`/(buyer)/orders/tracking/${order.id}` as any)}
                fullWidth
             />
         </View>
      )}
    </View>
  );
}
