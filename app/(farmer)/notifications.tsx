import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import notificationService, { Notification } from '@/services/notification.service';

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const TYPE_CONFIG = {
  success: { icon: 'check-circle' as const, color: '#16A34A', bg: '#DCFCE7' },
  error:   { icon: 'x-circle' as const,     color: '#DC2626', bg: '#FEE2E2' },
  info:    { icon: 'info' as const,          color: '#2563EB', bg: '#DBEAFE' },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAndMarkRead = useCallback(async () => {
    try {
      const notifs = await notificationService.getMyNotifications();
      setNotifications(notifs);
      // Auto-mark all as read when screen opens
      const hasUnread = notifs.some(n => !n.isRead);
      if (hasUnread) {
        notificationService.markAllAsRead().catch(() => {});
        setNotifications(notifs.map(n => ({ ...n, isRead: true })));
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAndMarkRead();
    }, [fetchAndMarkRead])
  );

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleTap = async (notif: Notification) => {
    if (!notif.isRead) {
      await notificationService.markAsRead(notif._id);
      setNotifications(prev =>
        prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n)
      );
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFB' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const hasUnread = notifications.some(n => !n.isRead);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {hasUnread ? (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Feather name="bell-off" size={40} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySub}>AI review results and updates will appear here</Text>
          </View>
        ) : (
          notifications.map(notif => {
            const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.info;
            return (
              <TouchableOpacity
                key={notif._id}
                style={[styles.row, !notif.isRead && styles.rowUnread]}
                onPress={() => handleTap(notif)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: cfg.bg }]}>
                  <Feather name={cfg.icon} size={18} color={cfg.color} />
                </View>
                <View style={styles.rowContent}>
                  <View style={styles.rowTop}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{notif.title}</Text>
                    <Text style={styles.rowTime}>{timeAgo(notif.createdAt)}</Text>
                  </View>
                  <Text style={styles.rowMessage} numberOfLines={2}>{notif.message}</Text>
                </View>
                {!notif.isRead && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: Colors.textPrimary },
  markAllText: { fontSize: 13, fontWeight: '700', color: Colors.agri.sabz },

  content: { paddingVertical: 12, paddingBottom: 48 },

  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#94A3B8', fontWeight: '500', textAlign: 'center', paddingHorizontal: 40 },

  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    paddingHorizontal: 24, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
    backgroundColor: '#fff',
  },
  rowUnread: { backgroundColor: '#FAFFFE' },
  iconCircle: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  rowContent: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  rowTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B', flex: 1, marginRight: 8 },
  rowTime: { fontSize: 11, color: '#94A3B8', fontWeight: '500', flexShrink: 0 },
  rowMessage: { fontSize: 13, color: '#64748B', fontWeight: '500', lineHeight: 18 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#3B82F6', marginTop: 6, flexShrink: 0,
  },
});
