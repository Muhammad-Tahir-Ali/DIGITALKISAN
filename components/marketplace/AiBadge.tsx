import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { AIGrade } from '@/constants/mockData';

interface Props {
  grade: AIGrade;
  score?: number;
  size?: 'sm' | 'md';
}

const CONFIG = {
  'Grade A': { label: 'AI Premium', bg: '#F3E8FF', border: '#D8B4FE', text: '#7E22CE', icon: '#9333EA' },
  'Grade B': { label: 'AI Standard', bg: '#DCFCE7', border: '#86EFAC', text: '#15803D', icon: '#16A34A' },
  'Grade C': { label: 'AI Low',     bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C', icon: '#EA580C' },
} as const;

export const AiBadge = React.memo(function AiBadge({ grade, score, size = 'md' }: Props) {
  const cfg = CONFIG[grade];
  const isSm = size === 'sm';

  return (
    <View style={[
      styles.badge,
      { backgroundColor: cfg.bg, borderColor: cfg.border },
      isSm ? styles.sm : styles.md,
    ]}>
      <Feather name="cpu" size={isSm ? 9 : 11} color={cfg.icon} />
      <Text style={[styles.label, { color: cfg.text }, isSm ? styles.labelSm : styles.labelMd]}>
        {cfg.label}{score !== undefined ? ` ${score}%` : ''}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  sm:  { paddingHorizontal: 6,  paddingVertical: 2, gap: 3 },
  md:  { paddingHorizontal: 10, paddingVertical: 5, gap: 5 },
  label:   { fontWeight: '700' },
  labelSm: { fontSize: 9 },
  labelMd: { fontSize: 11 },
});
