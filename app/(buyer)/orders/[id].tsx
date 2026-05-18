import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking, Platform, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Button, SkeletonLoader } from '@/components/ui';
import { EscrowBadge } from '@/components/checkout/EscrowBadge';
import { StatusTimeline, TimelineStep } from '@/components/checkout/StatusTimeline';
import orderService, { Order } from '@/services/order.service';

function formatOrderId(id: string) {
  return `#DK-${id.slice(-8).toUpperCase()}`;
}

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString('en-PK', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = React.useCallback(() => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    orderService.getById(id as string)
      .then(setOrder)
      .catch((e: any) => {
        setError(e?.response?.data?.message ?? 'Failed to load order details');
      })
      .finally(() => setLoading(false));
  }, [id]);

  React.useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const handleCancel = () => {
    if (!order) return;
    const doCancel = async () => {
      setCancelling(true);
      try {
        await orderService.cancel(order._id);
        setOrder(prev => prev ? { ...prev, status: 'cancelled' } : prev);
      } catch {
        Alert.alert('Error', 'Could not cancel the order. Please try again.');
      } finally {
        setCancelling(false);
      }
    };
    if (Platform.OS === 'web') {
      doCancel();
    } else {
      Alert.alert(
        'Cancel Order',
        'Are you sure you want to cancel this order? Your funds will be refunded.',
        [
          { text: 'Keep Order', style: 'cancel' },
          { text: 'Yes, Cancel', style: 'destructive', onPress: doCancel },
        ]
      );
    }
  };

  const handleContact = () => {
    const phone = order?.farmer?.phone;
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  if (error) {
    return (
      <View className="flex-1 bg-background justify-center items-center p-6">
        <Feather name="wifi-off" size={48} color={Colors.error} />
        <Text className="text-lg font-bold text-textPrimary mt-4 text-center">{error}</Text>
        <TouchableOpacity onPress={fetchOrder} className="mt-6 bg-primary px-6 py-3 rounded-xl">
          <Text className="text-white font-bold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="px-6 mb-4 flex-row items-center border-b border-gray-100 pb-4 pt-4">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-xl bg-gray-50 mr-4">
            <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-textPrimary">Order Details</Text>
        </View>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 12 }}>
          <SkeletonLoader.Box height={80} borderRadius={16} />
          <SkeletonLoader.Box height={160} borderRadius={16} />
          <SkeletonLoader.Box height={120} borderRadius={16} />
          <SkeletonLoader.Box height={100} borderRadius={16} />
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 bg-background justify-center items-center p-6">
        <Feather name="alert-circle" size={48} color={Colors.error} />
        <Text className="text-lg font-bold text-textPrimary mt-4">Order not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-6 bg-primary px-6 py-3 rounded-xl">
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isDelivered       = order.status === 'delivered';
  const isCancelled       = order.status === 'cancelled';
  const isPending         = order.status === 'pending';
  const isPaid            = order.status === 'paid';
  const isActiveDelivery  = ['in_transit', 'picked_up', 'reached'].includes(order.status);

  const DELIVERY_SUBTITLES: Record<string, string> = {
    in_transit: 'Rider is on the way',
    picked_up:  'Product picked up by rider',
    reached:    'Rider has reached your area',
  };

  let activeStep = 1;
  if (order.status === 'paid')       activeStep = 2;
  if (order.status === 'bidding')    activeStep = 3;
  if (isActiveDelivery)              activeStep = 4;
  if (isDelivered)                   activeStep = 5;
  if (isCancelled)                   activeStep = -1;

  const ORDER_TRACKER: TimelineStep[] = [
    { key: 't1', label: 'Order Placed', timestamp: formatTimestamp(order.createdAt), icon: 'lock' },
    { key: 't2', label: 'Confirmed by Farmer' },
    { key: 't3', label: 'Packed & Ready', subtitle: 'Quality checked' },
    { key: 't4', label: 'Out for Delivery', subtitle: DELIVERY_SUBTITLES[order.status] ?? 'Rider is on the way' },
    { key: 't5', label: 'Delivered', subtitle: 'Escrow released' },
  ];

  const showCancel = isPending || isPaid;
  const showTrack  = isActiveDelivery;
  const showRate   = isDelivered;
  const showFooter = showCancel || showTrack || showRate;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* ── HEADER ── */}
      <View className="px-6 flex-row items-center border-b border-gray-100 pb-4 pt-4">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-xl bg-gray-50 mr-4">
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-bold text-textPrimary">Order Details</Text>
          <Text className="text-xs text-textSecondary uppercase tracking-widest">{formatOrderId(order._id)}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* ── ESCROW BADGE ── */}
        <View className="mb-6 mt-4">
          <EscrowBadge
            variant={isDelivered ? 'released' : isCancelled ? 'refunded' : 'holding'}
            size="lg"
            amount={order.totalPrice}
          />
        </View>

        {/* ── TRACKING ── */}
        {!isCancelled && (
          <View className="bg-white rounded-2xl p-5 border border-gray-200 mb-6 shadow-sm">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="font-bold text-base text-textPrimary">Delivery Status</Text>
              {isActiveDelivery && (
                <TouchableOpacity
                  onPress={() => router.push(`/(buyer)/orders/tracking/${order._id}` as any)}
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

        {/* ── ITEM ── */}
        <View className="bg-white rounded-2xl p-5 border border-gray-200 mb-6 shadow-sm">
          <Text className="font-bold text-base text-textPrimary mb-4 border-b border-gray-100 pb-2">Item Ordered</Text>
          <View className="flex-row items-center mb-4">
            <View className="w-12 h-12 rounded-xl bg-gray-50 items-center justify-center mr-4">
              <Text className="text-2xl">📦</Text>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-textPrimary text-sm">{order.product?.title}</Text>
              <Text className="text-textSecondary text-xs">Qty: {order.quantity}</Text>
            </View>
            <View className="items-end">
              <Text className="font-bold text-textPrimary">₨{order.totalPrice.toLocaleString()}</Text>
              <Text className="text-textSecondary text-[10px]">₨{order.product?.pricePerUnit}/unit</Text>
            </View>
          </View>

          <View className="w-full h-[1px] bg-gray-100 my-2" />
          <View className="flex-row justify-between items-center mt-2">
            <Text className="text-sm font-bold text-textPrimary">Total Amount</Text>
            <Text className="text-xl font-bold text-primary">₨{order.totalPrice.toLocaleString()}</Text>
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
              <Text className="font-medium text-textPrimary text-sm leading-5">{order.shippingAddress?.address ?? 'No Address'}</Text>
            </View>
          </View>

          <View className="flex-row items-start">
            <View className="w-8 h-8 rounded-full bg-purple-50 items-center justify-center mr-3 mt-1">
              <Feather name="package" size={14} color="#9333EA" />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-textSecondary uppercase font-bold tracking-wider mb-0.5">Fulfillment By</Text>
              <Text className="font-medium text-textPrimary text-sm">{order.farmer?.name ?? 'Farmer'}</Text>
              <Text className="text-textSecondary text-xs">{order.farmer?.location?.address ?? ''}</Text>
            </View>
            <TouchableOpacity
              onPress={handleContact}
              className="border border-purple-200 px-3 py-1.5 rounded-lg"
            >
              <Text className="text-purple-700 font-bold text-xs">Contact</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── DELIVERY PROOF ── */}
        {order.deliveryProofs && order.deliveryProofs.length > 0 && (
          <View className="bg-white rounded-2xl p-5 border border-gray-200 mb-6 shadow-sm">
            <Text className="font-bold text-base text-textPrimary mb-4 border-b border-gray-100 pb-2">Delivery Photos</Text>
            {order.deliveryProofs.map((proof, idx) => {
              const isPickup = proof.status === 'picked_up';
              return (
                <View key={idx} className={idx < order.deliveryProofs!.length - 1 ? 'mb-4' : ''}>
                  <View className="flex-row items-center gap-x-2 mb-2">
                    <View className={`w-7 h-7 rounded-full items-center justify-center ${isPickup ? 'bg-amber-50' : 'bg-purple-50'}`}>
                      <Text style={{ fontSize: 14 }}>{isPickup ? '📦' : '📍'}</Text>
                    </View>
                    <View>
                      <Text className={`text-xs font-bold ${isPickup ? 'text-amber-700' : 'text-purple-700'}`}>
                        {isPickup ? 'Pickup Proof' : 'Arrival Proof'}
                      </Text>
                      <Text className="text-[10px] text-textSecondary">
                        {new Date(proof.capturedAt).toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                  <Image
                    source={{ uri: proof.imageData }}
                    style={{ width: '100%', height: 180, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                </View>
              );
            })}
          </View>
        )}

        {/* ── PAYMENT ── */}
        <View className="bg-white rounded-2xl p-5 border border-gray-200 mb-6 shadow-sm">
          <Text className="font-bold text-base text-textPrimary mb-4 border-b border-gray-100 pb-2">Payment Details</Text>
          <View className="flex-row justify-between mb-3">
            <Text className="text-textSecondary">Method</Text>
            <View className="flex-row items-center gap-x-1.5">
              <Feather name="lock" size={12} color={Colors.success} />
              <Text className="font-medium text-textPrimary">DigitalKisan Escrow</Text>
            </View>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className="text-textSecondary">Transaction ID</Text>
            <Text className="font-medium text-textPrimary">{formatOrderId(order._id)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-textSecondary">Funds Status</Text>
            <Text className={`font-bold ${isDelivered ? 'text-green-600' : isCancelled ? 'text-red-500' : 'text-amber-500'}`}>
              {isDelivered ? 'Released to Farmer' : isCancelled ? 'Refunded to you' : 'Locked in Escrow'}
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* ── FOOTER ACTIONS ── */}
      {showFooter && (
        <View
          className="px-6 py-4 bg-white border-t border-gray-100 flex-row gap-x-4"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          {showCancel && (
            <Button
              variant="outline"
              label={cancelling ? 'Cancelling…' : 'Cancel Order'}
              onPress={handleCancel}
              disabled={cancelling}
              style={{ flex: 1 }}
              size="lg"
            />
          )}
          {showTrack && (
            <Button
              variant="primary"
              label="Track Order"
              onPress={() => router.push(`/(buyer)/orders/tracking/${order._id}` as any)}
              style={{ flex: 1 }}
              size="lg"
            />
          )}
          {showRate && (
            <Button
              variant="primary"
              label="Rate this Order"
              onPress={() => router.push(`/(buyer)/orders/rate/${order._id}` as any)}
              style={{ flex: 1 }}
              size="lg"
            />
          )}
        </View>
      )}
    </View>
  );
}
