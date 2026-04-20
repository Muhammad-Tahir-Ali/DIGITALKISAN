import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface EmptyStateProps {
  icon?: React.ReactNode;
  emoji?: string;
  title: string;
  message?: string;
  cta?: string;
  onCta?: () => void;
  variant?: 'default' | 'compact';
}

export function EmptyState({
  icon,
  emoji,
  title,
  message,
  cta,
  onCta,
  variant = 'default',
}: EmptyStateProps) {
  const isCompact = variant === 'compact';

  return (
    <View style={[styles.root, isCompact && styles.rootCompact]}>
      <View style={[styles.iconWrap, isCompact && styles.iconWrapCompact]}>
        {emoji ? (
          <Text style={[styles.emoji, isCompact && styles.emojiCompact]}>{emoji}</Text>
        ) : (
          icon ?? <Feather name="inbox" size={isCompact ? 28 : 40} color="#CBD5E1" />
        )}
      </View>

      <Text style={[styles.title, isCompact && styles.titleCompact]}>{title}</Text>

      {message && (
        <Text style={[styles.message, isCompact && styles.messageCompact]}>{message}</Text>
      )}

      {cta && onCta && (
        <TouchableOpacity style={styles.ctaBtn} onPress={onCta} activeOpacity={0.8}>
          <Text style={styles.ctaText}>{cta}</Text>
          <Feather name="arrow-right" size={14} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingVertical: 48,
  },
  rootCompact: { paddingVertical: 28 },
  iconWrap: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: '#F8FAFB',
    borderWidth: 1, borderColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  iconWrapCompact: { width: 64, height: 64, borderRadius: 20, marginBottom: 14 },
  emoji: { fontSize: 42 },
  emojiCompact: { fontSize: 30 },
  title: { fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 8 },
  titleCompact: { fontSize: 15, marginBottom: 6 },
  message: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  messageCompact: { fontSize: 13, lineHeight: 20, marginBottom: 18 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24, paddingVertical: 13,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
