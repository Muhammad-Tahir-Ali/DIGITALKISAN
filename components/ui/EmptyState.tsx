import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Button } from './Button';

type EmptyStatePreset = 'orders' | 'products' | 'search' | 'error' | 'custom';

interface EmptyStateProps {
  preset?: EmptyStatePreset;
  emoji?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
  style?: ViewStyle;
}

const PRESETS: Record<EmptyStatePreset, { emoji: string; title: string; subtitle: string }> = {
  orders: {
    emoji: '📦',
    title: 'No Orders Yet',
    subtitle: 'Your orders will appear here once you make a purchase.',
  },
  products: {
    emoji: '🌾',
    title: 'No Products Found',
    subtitle: 'There are no products available right now. Check back soon.',
  },
  search: {
    emoji: '🔍',
    title: 'No Results',
    subtitle: 'Try a different keyword or browse by category.',
  },
  error: {
    emoji: '⚡',
    title: 'Something went wrong',
    subtitle: 'We couldn\'t load this content. Please try again.',
  },
  custom: {
    emoji: '📭',
    title: 'Nothing here',
    subtitle: '',
  },
};

export function EmptyState({
  preset = 'custom',
  emoji,
  title,
  subtitle,
  ctaLabel,
  onCta,
  style,
}: EmptyStateProps) {
  const config = PRESETS[preset];
  const displayEmoji = emoji ?? config.emoji;
  const displayTitle = title ?? config.title;
  const displaySubtitle = subtitle ?? config.subtitle;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.emojiWrap}>
        <Text style={styles.emoji}>{displayEmoji}</Text>
      </View>
      <Text style={styles.title}>{displayTitle}</Text>
      {displaySubtitle ? (
        <Text style={styles.subtitle}>{displaySubtitle}</Text>
      ) : null}
      {ctaLabel && onCta && (
        <Button
          label={ctaLabel}
          onPress={onCta}
          variant="primary"
          size="md"
          style={{ marginTop: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    paddingHorizontal: 40,
  },
  emojiWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
