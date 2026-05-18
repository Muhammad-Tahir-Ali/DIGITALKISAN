import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { Colors } from '@/constants/colors';

interface SkeletonBoxProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

function SkeletonBox({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonBoxProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: Colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

/** Skeleton for a single product card */
function ProductCardSkeleton() {
  return (
    <View style={skStyles.productCard}>
      <SkeletonBox height={130} borderRadius={16} style={{ marginBottom: 10 }} />
      <SkeletonBox width="70%" height={13} borderRadius={6} style={{ marginBottom: 8 }} />
      <SkeletonBox width="40%" height={11} borderRadius={6} style={{ marginBottom: 10 }} />
      <SkeletonBox width="55%" height={32} borderRadius={10} />
    </View>
  );
}

/** Skeleton for an order card */
function OrderCardSkeleton() {
  return (
    <View style={skStyles.orderCard}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <SkeletonBox width="40%" height={12} borderRadius={6} />
        <SkeletonBox width="22%" height={22} borderRadius={11} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <SkeletonBox width={44} height={44} borderRadius={12} />
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonBox width="60%" height={13} borderRadius={6} />
          <SkeletonBox width="35%" height={11} borderRadius={6} />
        </View>
        <SkeletonBox width="20%" height={20} borderRadius={6} />
      </View>
      <SkeletonBox height={36} borderRadius={10} />
    </View>
  );
}

/** Skeleton for a stat card (farmer dashboard) */
function StatCardSkeleton() {
  return (
    <View style={skStyles.statCard}>
      <SkeletonBox width={40} height={40} borderRadius={12} style={{ marginBottom: 12 }} />
      <SkeletonBox width="60%" height={20} borderRadius={6} style={{ marginBottom: 6 }} />
      <SkeletonBox width="80%" height={13} borderRadius={6} />
    </View>
  );
}

/** Render n product card skeletons in a 2-col grid */
function ProductGrid({ count = 4 }: { count?: number }) {
  return (
    <View style={skStyles.productGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </View>
  );
}

/** Render n order card skeletons */
function OrderList({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </View>
  );
}

/** Render n stat card skeletons in a 2-col grid */
function StatGrid({ count = 4 }: { count?: number }) {
  return (
    <View style={skStyles.statGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </View>
  );
}

export const SkeletonLoader = {
  Box: SkeletonBox,
  ProductGrid,
  OrderList,
  StatGrid,
};

const skStyles = StyleSheet.create({
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
});
