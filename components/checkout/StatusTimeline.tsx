/**
 * StatusTimeline — Reusable vertical escrow order timeline.
 *
 * Props:
 *  steps     — array of { key, label, subtitle?, timestamp? }
 *  current   — index of the active step (0-based)
 *  variant   — 'default' | 'compact'
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export type TimelineStatus = 'done' | 'active' | 'pending';

export interface TimelineStep {
  key: string;
  label: string;
  subtitle?: string;
  timestamp?: string;
  icon?: keyof typeof Feather.glyphMap;
}

interface Props {
  steps: TimelineStep[];
  /** 0-based index of current step */
  current: number;
  variant?: 'default' | 'compact';
}

const STEP_ICONS: Partial<Record<string, keyof typeof Feather.glyphMap>> = {
  Ordered:   'shopping-bag',
  Packed:    'package',
  Shipped:   'truck',
  Delivered: 'home',
  Completed: 'check-circle',
};

export function StatusTimeline({ steps, current, variant = 'default' }: Props) {
  const isCompact = variant === 'compact';

  return (
    <View style={styles.root}>
      {steps.map((step, idx) => {
        const status: TimelineStatus =
          idx < current  ? 'done'    :
          idx === current ? 'active'  : 'pending';

        const isLast = idx === steps.length - 1;
        const iconName = step.icon ?? STEP_ICONS[step.label] ?? 'circle';

        return (
          <View key={step.key} style={styles.stepRow}>
            {/* ── Left column: circle + line ───────────────────────── */}
            <View style={styles.leftCol}>
              {/* Node circle */}
              <View style={[
                styles.circle,
                isCompact && styles.circleCompact,
                status === 'done'    && styles.circleDone,
                status === 'active'  && styles.circleActive,
                status === 'pending' && styles.circlePending,
              ]}>
                {status === 'done' ? (
                  <Feather name="check" size={isCompact ? 10 : 14} color="#fff" />
                ) : status === 'active' ? (
                  <View style={styles.activePulse} />
                ) : null}
              </View>

              {/* Connecting line */}
              {!isLast && (
                <View style={[
                  styles.line,
                  isCompact && styles.lineCompact,
                  status === 'done' ? styles.lineDone : styles.linePending,
                ]} />
              )}
            </View>

            {/* ── Right column: text ────────────────────────────────── */}
            <View style={[styles.textCol, !isLast && (isCompact ? styles.textGapCompact : styles.textGap)]}>
              <View style={styles.labelRow}>
                {/* Icon pill */}
                {!isCompact && (
                  <View style={[
                    styles.iconPill,
                    status === 'done'    && styles.iconPillDone,
                    status === 'active'  && styles.iconPillActive,
                    status === 'pending' && styles.iconPillPending,
                  ]}>
                    <Feather
                      name={iconName}
                      size={12}
                      color={
                        status === 'done'   ? Colors.primary :
                        status === 'active' ? Colors.amber[600] :
                        Colors.gray[400]
                      }
                    />
                  </View>
                )}
                <Text style={[
                  styles.label,
                  isCompact && styles.labelCompact,
                  status === 'done'    && styles.labelDone,
                  status === 'active'  && styles.labelActive,
                  status === 'pending' && styles.labelPending,
                ]}>
                  {step.label}
                </Text>
                {step.timestamp && status !== 'pending' && (
                  <Text style={styles.timestamp}>{step.timestamp}</Text>
                )}
              </View>

              {/* Subtitle */}
              {step.subtitle && !isCompact && (
                <Text style={[
                  styles.subtitle,
                  status === 'active' && styles.subtitleActive,
                ]}>
                  {step.subtitle}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const CIRCLE_SIZE = 36;
const CIRCLE_COMPACT = 24;

const styles = StyleSheet.create({
  root:  {},
  stepRow: { flexDirection: 'row' },

  // Left
  leftCol: { alignItems: 'center', marginRight: 14 },
  circle: {
    width: CIRCLE_SIZE, height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  circleCompact: { width: CIRCLE_COMPACT, height: CIRCLE_COMPACT, borderRadius: CIRCLE_COMPACT / 2 },
  circleDone:    { backgroundColor: Colors.primary,     borderColor: Colors.primary },
  circleActive:  { backgroundColor: '#FFF7ED',          borderColor: Colors.amber[500], borderWidth: 2.5 },
  circlePending: { backgroundColor: Colors.gray[100],   borderColor: Colors.gray[300] },
  activePulse:   { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.amber[500] },

  line:        { width: 2, flex: 1, marginVertical: 4, minHeight: 30 },
  lineCompact: { minHeight: 16 },
  lineDone:    { backgroundColor: Colors.primary },
  linePending: { backgroundColor: Colors.gray[200] },

  // Right
  textCol: { flex: 1, paddingTop: 6 },
  textGap:        { paddingBottom: 24 },
  textGapCompact: { paddingBottom: 12 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },

  iconPill: {
    width: 24, height: 24, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  iconPillDone:    { backgroundColor: Colors.green[100] },
  iconPillActive:  { backgroundColor: Colors.amber[100] },
  iconPillPending: { backgroundColor: Colors.gray[100] },

  label:        { fontSize: 15, fontWeight: '700' },
  labelCompact: { fontSize: 12 },
  labelDone:    { color: Colors.primary },
  labelActive:  { color: Colors.amber[700] },
  labelPending: { color: Colors.gray[400] },

  timestamp:    { fontSize: 10, color: Colors.textSecondary, marginLeft: 'auto' as any },
  subtitle:       { fontSize: 12, color: Colors.textSecondary, marginTop: 3, lineHeight: 18 },
  subtitleActive: { color: Colors.amber[700] },
});
