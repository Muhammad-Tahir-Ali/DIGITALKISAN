import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';

export type StatusVariant =
  | 'pending'
  | 'paid'
  | 'bidding'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'disputed'
  | 'active'
  | 'sold_out';

interface StatusBadgeProps {
  status: StatusVariant | string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const STATUS_MAP: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: 'Pending', bg: '#FEF9EC', text: '#92400E', dot: '#F59E0B' },
  paid: { label: 'Paid', bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  bidding: { label: 'Bidding', bg: '#FAF5FF', text: '#6D28D9', dot: '#8B5CF6' },
  in_transit: { label: 'In Transit', bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
  delivered: { label: 'Delivered', bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  cancelled: { label: 'Cancelled', bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444' },
  disputed: { label: 'Disputed', bg: '#FFF1F2', text: '#BE123C', dot: '#FB7185' },
  active: { label: 'Active', bg: '#FEF9EC', text: '#92400E', dot: '#F59E0B' },
  sold_out: { label: 'Sold Out', bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
};

const DEFAULT_STATUS = { label: 'Unknown', bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8' };

export function StatusBadge({ status, size = 'md', style }: StatusBadgeProps) {
  const config = STATUS_MAP[status.toLowerCase().replace(' ', '_')] ?? DEFAULT_STATUS;
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: config.bg, paddingHorizontal: isSm ? 8 : 10, paddingVertical: isSm ? 3 : 5 },
        style,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.dot, width: isSm ? 5 : 6, height: isSm ? 5 : 6 }]} />
      <Text style={[styles.label, { color: config.text, fontSize: isSm ? 10 : 11 }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  dot: {
    borderRadius: 999,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
