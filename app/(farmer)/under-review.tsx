import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Animated, Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import productService, { Product } from '@/services/product.service';

function getElapsed(createdAt: string): string {
  const seconds = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  return `${mins}m ${seconds % 60}s`;
}

export default function UnderReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const pulseAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    const spin = Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 2000, useNativeDriver: true })
    );
    pulse.start();
    spin.start();
    return () => { pulse.stop(); spin.stop(); };
  }, []);

  // Tick every second to update elapsed timers
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const all = await productService.getMyProducts();
      setProducts(all.filter(p => p.status === 'pending_ai' || p.status === 'rejected'));
    } catch {
      // silent — user can pull-to-refresh later
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
      const interval = setInterval(fetchProducts, 5000);
      return () => clearInterval(interval);
    }, [fetchProducts])
  );

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'Delete Listing',
      `Remove "${title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            await productService.delete(id);
            setProducts(prev => prev.filter(p => p._id !== id));
          },
        },
      ]
    );
  };

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const glowOpacity = pulseAnim;

  const pending = products.filter(p => p.status === 'pending_ai');
  const rejected = products.filter(p => p.status === 'rejected');

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFB' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Review</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {products.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Feather name="check-circle" size={48} color={Colors.agri.sabz} />
            </View>
            <Text style={styles.emptyTitle}>All clear!</Text>
            <Text style={styles.emptySub}>No listings are under AI review right now.</Text>
          </View>
        ) : (
          <>
            {pending.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Animated.View style={[styles.sectionDot, { opacity: glowOpacity }]} />
                  <Text style={styles.sectionTitle}>Analyzing ({pending.length})</Text>
                </View>
                {pending.map(item => (
                  <View key={item._id} style={styles.pendingCard}>
                    {/* Pulsing glow overlay */}
                    <Animated.View style={[styles.pendingGlow, { opacity: glowOpacity }]} />
                    <View style={styles.cardRow}>
                      {item.images?.[0] ? (
                        <Image source={{ uri: item.images[0] }} style={styles.thumb} resizeMode="cover" />
                      ) : (
                        <View style={[styles.thumb, styles.thumbPlaceholder]}>
                          <Feather name="image" size={20} color="#94A3B8" />
                        </View>
                      )}
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.cardMeta}>
                          ₨ {item.pricePerUnit} / {item.unit} · {item.category}
                        </Text>
                        <View style={styles.analyzeRow}>
                          <Animated.View style={{ transform: [{ rotate: spin }] }}>
                            <Feather name="settings" size={12} color={Colors.agri.sabz} />
                          </Animated.View>
                          <Text style={styles.analyzeText}>AI analyzing your images...</Text>
                        </View>
                        <Text style={styles.elapsedText}>
                          analyzing for {getElapsed(item.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {rejected.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.sectionTitle}>Rejected ({rejected.length})</Text>
                </View>
                {rejected.map(item => (
                  <View key={item._id} style={styles.rejectedCard}>
                    <View style={styles.cardRow}>
                      {item.images?.[0] ? (
                        <Image source={{ uri: item.images[0] }} style={styles.thumb} resizeMode="cover" />
                      ) : (
                        <View style={[styles.thumb, styles.thumbPlaceholder]}>
                          <Feather name="image" size={20} color="#94A3B8" />
                        </View>
                      )}
                      <View style={styles.cardInfo}>
                        <View style={styles.cardTitleRow}>
                          <Text style={[styles.cardTitle, { flex: 1 }]} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <View style={styles.rejectedBadge}>
                            <Text style={styles.rejectedBadgeText}>Rejected</Text>
                          </View>
                        </View>
                        <Text style={styles.rejectionReason} numberOfLines={3}>
                          {item.rejectionReason || 'Image was not recognized as a valid crop.'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => router.push({
                          pathname: '/(farmer)/products/add',
                          params: { productId: item._id },
                        } as any)}
                      >
                        <Feather name="edit-2" size={13} color={Colors.agri.sabz} />
                        <Text style={styles.editBtnText}>Edit Listing</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDelete(item._id, item.title)}
                      >
                        <Feather name="trash-2" size={13} color="#EF4444" />
                        <Text style={styles.deleteBtnText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
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

  content: { padding: 24, paddingBottom: 48 },

  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginBottom: 6 },
  emptySub: { fontSize: 14, color: '#94A3B8', fontWeight: '500', textAlign: 'center' },

  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 },
  sectionDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.agri.sabz },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B' },

  pendingCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    marginBottom: 12, borderWidth: 1.5, borderColor: Colors.agri.sabz,
    overflow: 'hidden', position: 'relative',
    shadowColor: Colors.agri.sabz, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  pendingGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
  },

  rejectedCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    marginBottom: 12, borderWidth: 1.5, borderColor: '#FECACA',
    shadowColor: '#EF4444', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },

  cardRow: { flexDirection: 'row', gap: 14 },
  thumb: { width: 72, height: 72, borderRadius: 14 },
  thumbPlaceholder: {
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1, justifyContent: 'center', gap: 4 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  cardMeta: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  analyzeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  analyzeText: { fontSize: 12, color: Colors.agri.sabz, fontWeight: '700' },
  elapsedText: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },

  rejectedBadge: {
    backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  rejectedBadgeText: { fontSize: 10, fontWeight: '800', color: '#DC2626' },
  rejectionReason: { fontSize: 12, color: '#64748B', fontWeight: '500', marginTop: 4, lineHeight: 17 },

  cardActions: {
    flexDirection: 'row', gap: 10, marginTop: 14,
    paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F8FAFC',
  },
  editBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: Colors.agri.sabz,
  },
  editBtnText: { fontSize: 13, fontWeight: '700', color: Colors.agri.sabz },
  deleteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#FFF1F2', borderWidth: 1, borderColor: '#FECACA',
  },
  deleteBtnText: { fontSize: 13, fontWeight: '700', color: '#EF4444' },
});
