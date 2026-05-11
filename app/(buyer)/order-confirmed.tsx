import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Button, SkeletonLoader } from '@/components/ui';
import { EscrowBadge } from '@/components/checkout/EscrowBadge';
import { StatusTimeline, TimelineStep } from '@/components/checkout/StatusTimeline';
import orderService, { Order } from '@/services/order.service';

const ORDER_TRACKER: TimelineStep[] = [
  { key: 't1', label: 'Order Placed',        subtitle: 'Funds secured in DigitalKisan Escrow', timestamp: 'Just now', icon: 'lock' },
  { key: 't2', label: 'Farmer Confirmation', subtitle: 'Waiting for farmer to accept' },
  { key: 't3', label: 'Packed' },
  { key: 't4', label: 'Out for Delivery' },
  { key: 't5', label: 'Delivered' },
];

function formatOrderId(id: string) {
  return `#DK-${id.slice(-8).toUpperCase()}`;
}

function formatPaymentMethod(method: string) {
  if (method === 'wallet') return 'Wallet Escrow';
  if (method === 'jazzcash') return 'JazzCash Escrow';
  if (method === 'easypaisa') return 'Easypaisa Escrow';
  return 'Wallet Escrow';
}

export default function OrderConfirmedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId, totalAmount, paymentMethod } = useLocalSearchParams<{
    orderId: string;
    totalAmount: string;
    paymentMethod: string;
  }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleValue, { toValue: 1, tension: 40, friction: 6, useNativeDriver: true }),
      Animated.timing(opacityValue, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    orderService.getById(orderId)
      .then(setOrder)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  // Derive display values — prefer live order data, fall back to route params
  const displayId     = order ? formatOrderId(order._id) : orderId ? formatOrderId(orderId) : '—';
  const displayAmount = order
    ? `₨${order.totalPrice.toLocaleString()}`
    : totalAmount
    ? `₨${Number(totalAmount).toLocaleString()}`
    : '—';
  const displayMethod = formatPaymentMethod(paymentMethod ?? 'wallet');

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 16 }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Animated success icon ── */}
        <View className="items-center mb-8 pt-6">
          <Animated.View
            style={{ transform: [{ scale: scaleValue }], opacity: opacityValue }}
            className="w-24 h-24 bg-blue-50 rounded-full items-center justify-center mb-5 border-4 border-blue-100 relative"
          >
            <View className="w-full h-full absolute items-center justify-center">
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
            Your money is locked safely in <Text className="font-bold text-textPrimary">escrow</Text>.{' '}
            The farmer won't be paid until you receive your order.
          </Animated.Text>
        </View>

        {/* ── Escrow badge ── */}
        <View className="mb-8">
          <EscrowBadge variant="holding" size="lg" />
        </View>

        {/* ── Order summary ── */}
        {loading ? (
          <View style={{ gap: 12, marginBottom: 32 }}>
            <SkeletonLoader.Box height={160} borderRadius={16} />
          </View>
        ) : (
          <View className="bg-gray-50 rounded-2xl p-5 border border-gray-200 mb-8 w-full shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]">
            <View className="flex-row justify-between mb-3 border-b border-gray-200 pb-3">
              <Text className="text-textSecondary font-medium">Order ID</Text>
              <Text className="text-textPrimary font-bold">{displayId}</Text>
            </View>
            <View className="flex-row justify-between mb-3 border-b border-gray-200 pb-3">
              <Text className="text-textSecondary font-medium">Amount Locked</Text>
              <Text className="text-primary font-bold">{displayAmount}</Text>
            </View>
            {order?.product?.title && (
              <View className="flex-row justify-between mb-3 border-b border-gray-200 pb-3">
                <Text className="text-textSecondary font-medium">Product</Text>
                <Text className="text-textPrimary font-bold" numberOfLines={1} style={{ maxWidth: '60%', textAlign: 'right' }}>
                  {order.product.title}
                </Text>
              </View>
            )}
            {order?.farmer?.name && (
              <View className="flex-row justify-between mb-3 border-b border-gray-200 pb-3">
                <Text className="text-textSecondary font-medium">Farmer</Text>
                <Text className="text-textPrimary font-bold">{order.farmer.name}</Text>
              </View>
            )}
            <View className="flex-row justify-between mb-3 border-b border-gray-200 pb-3">
              <Text className="text-textSecondary font-medium">Payment Method</Text>
              <Text className="text-textPrimary font-bold">{displayMethod}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-textSecondary font-medium">ETA</Text>
              <View className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                <Text className="text-primary font-bold text-xs uppercase tracking-wider">1–2 Business Days</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Status timeline ── */}
        <View className="mb-6 px-2">
          <Text className="text-lg font-bold text-textPrimary mb-6 tracking-wide">Live Tracking</Text>
          <StatusTimeline steps={ORDER_TRACKER} current={1} />
        </View>
      </ScrollView>

      {/* ── Action buttons ── */}
      <View
        className="px-6 py-5 bg-white border-t border-gray-100 flex-row gap-x-4 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Button
          variant="outline"
          label="Track Order"
          onPress={() => orderId
            ? router.push(`/(buyer)/orders/tracking/${orderId}` as any)
            : router.push('/(buyer)/orders' as any)
          }
          style={{ flex: 1 }}
          size="lg"
        />
        <Button
          variant="primary"
          label="Home"
          onPress={() => router.replace('/(buyer)/home')}
          style={{ flex: 1 }}
          size="lg"
        />
      </View>
    </View>
  );
}
