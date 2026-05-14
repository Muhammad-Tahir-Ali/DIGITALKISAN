import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Alert,
  ActivityIndicator, StyleSheet, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import orderService, { Order } from '@/services/order.service';
import reviewService, { Review } from '@/services/review.service';
import { useAuthStore } from '@/store/authStore';

type Target = 'Product' | 'User';

function StarRow({
  value, onChange, size = 36,
}: { value: number; onChange: (n: number) => void; size?: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity
          key={n}
          onPress={() => onChange(n)}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <Feather
            name="star"
            size={size}
            color={n <= value ? '#F59E0B' : '#E2E8F0'}
            style={{ marginHorizontal: 4 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function RateOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [order, setOrder]       = useState<Order | null>(null);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [productRating, setProductRating]   = useState(0);
  const [productComment, setProductComment] = useState('');
  const [productDone, setProductDone] = useState(false); // already-reviewed flag

  const [riderRating, setRiderRating]   = useState(0);
  const [riderComment, setRiderComment] = useState('');
  const [riderDone, setRiderDone] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let cancelled = false;

    const load = async () => {
      try {
        const ord = await orderService.getById(id as string);
        if (cancelled) return;
        setOrder(ord);

        // Check if buyer has already reviewed product / rider
        const checks: Promise<Review[]>[] = [];
        checks.push(reviewService.getForTarget(ord.product._id, 'Product'));
        if (ord.logisticsProvider?._id) {
          checks.push(reviewService.getForTarget(ord.logisticsProvider._id, 'User'));
        }
        const results = await Promise.all(checks);
        if (cancelled) return;

        const myProductReview = results[0]?.find(r => r.reviewer?._id === currentUserId);
        if (myProductReview) {
          setProductRating(myProductReview.rating);
          setProductComment(myProductReview.comment);
          setProductDone(true);
        }
        if (results[1]) {
          const myRiderReview = results[1].find(r => r.reviewer?._id === currentUserId);
          if (myRiderReview) {
            setRiderRating(myRiderReview.rating);
            setRiderComment(myRiderReview.comment);
            setRiderDone(true);
          }
        }
      } catch {
        // ignore — UI will show "order not found"
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [id, currentUserId]);

  const showErr = (msg: string) => {
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Error', msg);
  };

  const handleSubmit = async () => {
    if (!order) return;
    if (!productDone && productRating === 0) {
      showErr('Please tap a star to rate the product.');
      return;
    }
    if (!productDone && productComment.trim().length < 3) {
      showErr('Please write a short comment about the product (3+ characters).');
      return;
    }
    if (order.logisticsProvider && !riderDone) {
      if (riderRating === 0) {
        showErr('Please rate the rider too — tap a star.');
        return;
      }
      if (riderComment.trim().length < 3) {
        showErr('Please write a short comment for the rider.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const tasks: Promise<any>[] = [];
      if (!productDone) {
        tasks.push(reviewService.create({
          targetModel: 'Product',
          targetId: order.product._id,
          rating: productRating,
          comment: productComment.trim(),
        }));
      }
      if (order.logisticsProvider && !riderDone) {
        tasks.push(reviewService.create({
          targetModel: 'User',
          targetId: order.logisticsProvider._id,
          rating: riderRating,
          comment: riderComment.trim(),
        }));
      }
      await Promise.all(tasks);

      const msg = 'Thanks! Your review helps other farmers and buyers.';
      if (Platform.OS === 'web') {
        window.alert(msg);
        router.back();
      } else {
        Alert.alert('Review Submitted', msg, [
          { text: 'Done', onPress: () => router.back() },
        ]);
      }
    } catch (e: any) {
      showErr(e?.response?.data?.message ?? 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.center}>
          <Feather name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorTitle}>Order not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButtonAlt}>
            <Text style={styles.backButtonAltText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (order.status !== 'delivered') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rate Order</Text>
        </View>
        <View style={styles.center}>
          <Feather name="clock" size={48} color={Colors.warning} />
          <Text style={styles.errorTitle}>Order not yet delivered</Text>
          <Text style={styles.errorSub}>
            You can rate this order once it's been marked as delivered.
          </Text>
        </View>
      </View>
    );
  }

  const allDone = productDone && (!order.logisticsProvider || riderDone);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Your Order</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {allDone && (
          <View style={styles.bannerDone}>
            <Feather name="check-circle" size={18} color={Colors.success} />
            <Text style={styles.bannerDoneText}>
              You've already reviewed this order. Showing your submitted ratings.
            </Text>
          </View>
        )}

        {/* ── Product Review ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconBox}>
              <Feather name="package" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>The Product</Text>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {order.product?.title ?? 'Product'}
              </Text>
              <Text style={styles.cardSub}>From {order.farmer?.name ?? 'Farmer'}</Text>
            </View>
          </View>

          <Text style={styles.label}>How was the quality?</Text>
          <StarRow value={productRating} onChange={productDone ? () => {} : setProductRating} />

          <Text style={[styles.label, { marginTop: 16 }]}>Your comment</Text>
          <TextInput
            value={productComment}
            onChangeText={setProductComment}
            editable={!productDone}
            placeholder="Was it fresh? Properly packed? On-spec?"
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            style={[styles.textArea, productDone && styles.disabled]}
          />
          {productDone && (
            <Text style={styles.alreadyText}>✓ You've already reviewed this product.</Text>
          )}
        </View>

        {/* ── Rider Review (only if logistics assigned) ── */}
        {order.logisticsProvider && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Feather name="truck" size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardLabel}>The Rider</Text>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {order.logisticsProvider.name}
                </Text>
                <Text style={styles.cardSub}>Delivery partner</Text>
              </View>
            </View>

            <Text style={styles.label}>How was the delivery?</Text>
            <StarRow value={riderRating} onChange={riderDone ? () => {} : setRiderRating} />

            <Text style={[styles.label, { marginTop: 16 }]}>Your comment</Text>
            <TextInput
              value={riderComment}
              onChangeText={setRiderComment}
              editable={!riderDone}
              placeholder="On time? Polite? Handled the goods carefully?"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              style={[styles.textArea, riderDone && styles.disabled]}
            />
            {riderDone && (
              <Text style={styles.alreadyText}>✓ You've already reviewed this rider.</Text>
            )}
          </View>
        )}
      </ScrollView>

      {!allDone && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="send" size={18} color="#fff" />
                <Text style={styles.submitText}>Submit Review</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  content: { padding: 20, paddingBottom: 120 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginTop: 12 },
  errorSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
  backButtonAlt: { marginTop: 18, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  backButtonAltText: { color: '#fff', fontWeight: '800' },

  bannerDone: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: '#ECFDF5', borderRadius: 14, padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: '#A7F3D0',
  },
  bannerDoneText: { flex: 1, fontSize: 12, color: '#065F46', fontWeight: '600', lineHeight: 18 },

  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  cardIconBox: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center',
  },
  cardLabel: { fontSize: 10, fontWeight: '800', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  cardTitle: { fontSize: 15, fontWeight: '900', color: Colors.textPrimary, marginTop: 2 },
  cardSub:   { fontSize: 11, color: Colors.textSecondary, marginTop: 2, fontWeight: '600' },

  label: { fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 },
  starRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  textArea: {
    marginTop: 8, backgroundColor: '#F8FAFB', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 12, minHeight: 80,
    borderWidth: 1, borderColor: '#E2E8F0',
    fontSize: 14, color: Colors.textPrimary, textAlignVertical: 'top',
  },
  disabled: { opacity: 0.7 },
  alreadyText: { marginTop: 8, fontSize: 11, fontWeight: '700', color: Colors.success },

  footer: {
    paddingHorizontal: 24, paddingTop: 16, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, height: 56, borderRadius: 16,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
