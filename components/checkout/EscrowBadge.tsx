/**
 * EscrowBadge — Trust-first escrow status indicator.
 * Variants: 'locked' | 'holding' | 'released' | 'refunded'
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export type EscrowVariant = 'locked' | 'holding' | 'released' | 'refunded';

interface Props {
  variant: EscrowVariant;
  amount?: number;
  size?: 'sm' | 'lg';
}

const CONFIG = {
  locked: {
    icon: 'lock'        as const,
    label: 'Money held securely in Escrow',
    sublabel: 'Your funds are protected until delivery is confirmed',
    bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8', iconColor: '#2563EB',
    dot: '#3B82F6',
  },
  holding: {
    icon: 'shield'      as const,
    label: 'Escrow: Waiting for Delivery',
    sublabel: 'Farmer receives payment only after you confirm receipt',
    bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', iconColor: '#D97706',
    dot: '#F59E0B',
  },
  released: {
    icon: 'unlock'      as const,
    label: 'Payment Released to Farmer',
    sublabel: 'Transaction complete. Funds disbursed successfully.',
    bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46', iconColor: '#059669',
    dot: '#10B981',
  },
  refunded: {
    icon: 'rotate-ccw'  as const,
    label: 'Refund Processed',
    sublabel: 'Your money has been returned to your account.',
    bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', iconColor: '#DC2626',
    dot: '#EF4444',
  },
};

export function EscrowBadge({ variant, amount, size = 'lg' }: Props) {
  const cfg = CONFIG[variant];
  const isLg = size === 'lg';

  return (
    <View style={[styles.root, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      {/* Animated dot */}
      <View style={[styles.dotWrap, { borderColor: `${cfg.dot}40` }]}>
        <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
      </View>

      {/* Lock icon */}
      <View style={[styles.iconCircle, { backgroundColor: `${cfg.iconColor}18` }]}>
        <Feather name={cfg.icon} size={isLg ? 20 : 16} color={cfg.iconColor} />
      </View>

      {/* Text */}
      <View style={styles.textWrap}>
        <Text style={[styles.label, { color: cfg.text }, !isLg && styles.labelSm]}>
          {cfg.label}
          {amount ? `  ₨${amount.toLocaleString()}` : ''}
        </Text>
        {isLg && (
          <Text style={[styles.sublabel, { color: `${cfg.text}B0` }]}>
            {cfg.sublabel}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 16,
    padding: 14, gap: 10,
  },
  dotWrap: {
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  iconCircle: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  label:   { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  labelSm: { fontSize: 11 },
  sublabel:{ fontSize: 11, lineHeight: 16 },
});
