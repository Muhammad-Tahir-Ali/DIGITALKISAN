import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, Platform, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, ScrollView,
  Dimensions, Animated,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import orderService, { Order } from '@/services/order.service';
import bidService, { Bid } from '@/services/bid.service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// ─── Pakistan default region ──────────────────────────────────────────────────
const PAKISTAN_REGION = {
  latitude: 30.3753,
  longitude: 69.3451,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

// ─── Bid Bottom Sheet ─────────────────────────────────────────────────────────
function BidSheet({
  order,
  existingBid,
  onClose,
  onSuccess,
}: {
  order: Order;
  existingBid: Bid | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!existingBid;
  const [bidAmount, setBidAmount] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (existingBid) {
      setBidAmount(String(existingBid.bidAmount));
      setEstimatedHours(String(existingBid.estimatedDeliveryTime));
      setMessage(existingBid.message ?? '');
    } else {
      setBidAmount('');
      setEstimatedHours('');
      setMessage('');
    }
  }, [existingBid]);

  const handleSubmit = async () => {
    const amount = parseFloat(bidAmount);
    const hours = parseInt(estimatedHours);
    if (!amount || amount <= 0) return Alert.alert('Invalid Bid', 'Enter a valid bid amount in ₨');
    if (!hours || hours <= 0) return Alert.alert('Invalid Time', 'Enter estimated delivery hours');
    setSubmitting(true);
    try {
      if (isEdit && existingBid) {
        await bidService.update(existingBid._id, { bidAmount: amount, estimatedDeliveryTime: hours, message });
        Alert.alert('Bid Updated! ✅', `Your bid has been updated to ₨${amount}.`);
      } else {
        await bidService.place(order._id, { bidAmount: amount, estimatedDeliveryTime: hours, message });
        Alert.alert('Bid Placed! ✅', `Your bid of ₨${amount} has been submitted. The farmer will review all bids.`);
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      Alert.alert(isEdit ? 'Update Failed' : 'Bid Failed', e?.response?.data?.message ?? 'Could not submit bid. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const pickup = order.farmer?.location?.address ?? 'Farmer location';
  const dropoff = order.shippingAddress?.address ?? 'Delivery address';

  return (
    <View style={[sheet.container, { paddingBottom: insets.bottom + 12 }]}>
      <View style={sheet.handle} />

      <View style={sheet.topRow}>
        <View>
          <Text style={sheet.title}>{isEdit ? 'Update Your Bid ✏️' : 'Place Your Bid 💼'}</Text>
          <Text style={sheet.subtitle}>#{order._id.slice(-6).toUpperCase()} · {order.product?.title}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={sheet.closeBtn}>
          <Feather name="x" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Route Preview */}
      <View style={sheet.routeCard}>
        <View style={sheet.routeRow}>
          <View style={[sheet.routeDot, { backgroundColor: Colors.primary }]} />
          <View style={sheet.routeTextBox}>
            <Text style={sheet.routeLabel}>PICKUP</Text>
            <Text style={sheet.routeAddr} numberOfLines={1}>{pickup}</Text>
          </View>
        </View>
        <View style={sheet.routeLine} />
        <View style={sheet.routeRow}>
          <View style={[sheet.routeDot, { backgroundColor: '#EF4444' }]} />
          <View style={sheet.routeTextBox}>
            <Text style={sheet.routeLabel}>DROPOFF</Text>
            <Text style={sheet.routeAddr} numberOfLines={1}>{dropoff}</Text>
          </View>
        </View>
        <View style={sheet.cargoRow}>
          <Text style={sheet.cargoTag}>🌾 {order.quantity} units</Text>
          <Text style={sheet.cargoTag}>₨{order.totalPrice?.toLocaleString()} order value</Text>
        </View>
      </View>

      {/* Inputs */}
      <View style={sheet.inputRow}>
        <View style={[sheet.inputBox, { flex: 1 }]}>
          <Text style={sheet.inputLabel}>BID AMOUNT (₨)</Text>
          <TextInput
            style={sheet.input}
            placeholder="e.g. 500"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={bidAmount}
            onChangeText={setBidAmount}
          />
        </View>
        <View style={[sheet.inputBox, { flex: 1 }]}>
          <Text style={sheet.inputLabel}>DELIVERY (HOURS)</Text>
          <TextInput
            style={sheet.input}
            placeholder="e.g. 24"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={estimatedHours}
            onChangeText={setEstimatedHours}
          />
        </View>
      </View>

      <View style={sheet.inputBox}>
        <Text style={sheet.inputLabel}>MESSAGE (OPTIONAL)</Text>
        <TextInput
          style={[sheet.input, { height: 60, textAlignVertical: 'top' }]}
          placeholder="Tell the farmer why you're the best choice..."
          placeholderTextColor="#94A3B8"
          multiline
          value={message}
          onChangeText={setMessage}
        />
      </View>

      <TouchableOpacity
        style={[sheet.submitBtn, submitting && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={submitting}
        activeOpacity={0.85}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Feather name={isEdit ? 'edit-2' : 'send'} size={16} color="#fff" />
            <Text style={sheet.submitText}>{isEdit ? 'Update Bid' : 'Submit Bid'}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Job Info Card (floating card) ────────────────────────────────────────────
function JobInfoCard({
  order,
  onBid,
  onDismiss,
}: {
  order: Order;
  onBid: () => void;
  onDismiss: () => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: Platform.OS !== 'web', tension: 60 }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.jobCard,
        {
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [120, 0] }) }],
          opacity: anim,
        },
      ]}
    >
      <View style={styles.jobCardTop}>
        <View>
          <Text style={styles.jobCardId}>#{order._id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.jobCardTitle} numberOfLines={1}>{order.product?.title ?? 'Agricultural Product'}</Text>
        </View>
        <TouchableOpacity onPress={onDismiss}>
          <Feather name="x" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.jobCardRoute}>
        <View style={styles.routeItem}>
          <View style={[styles.routeBullet, { backgroundColor: Colors.primary }]} />
          <Text style={styles.routeText} numberOfLines={1}>
            {order.farmer?.location?.address ?? order.farmer?.name ?? 'Farmer'}
          </Text>
        </View>
        <View style={styles.routeDivider} />
        <View style={styles.routeItem}>
          <View style={[styles.routeBullet, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.routeText} numberOfLines={1}>
            {order.shippingAddress?.address ?? 'Delivery Address'}
          </Text>
        </View>
      </View>

      <View style={styles.jobCardMeta}>
        <View style={styles.metaItem}>
          <Feather name="package" size={13} color={Colors.primary} />
          <Text style={styles.metaText}>{order.quantity} units</Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="dollar-sign" size={13} color="#059669" />
          <Text style={styles.metaText}>₨{order.totalPrice?.toLocaleString()} order</Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="user" size={13} color="#7C3AED" />
          <Text style={styles.metaText}>{order.farmer?.name ?? '—'}</Text>
        </View>
      </View>

      <View style={styles.jobCardActions}>
        <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
          <Text style={styles.dismissText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bidBtn} onPress={onBid} activeOpacity={0.85}>
          <Feather name="trending-up" size={16} color="#fff" />
          <Text style={styles.bidBtnText}>Place Bid</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ─── Main Map Screen ──────────────────────────────────────────────────────────
export default function LogisticsMap() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [myBidMap, setMyBidMap] = useState<Record<string, Bid>>({});
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [bidSheetVisible, setBidSheetVisible] = useState(false);

  // Request location permission and get current position
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        mapRef.current?.animateToRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }, 1000);
      }
    })();
  }, []);

  const fetchJobs = useCallback(async (silent = false) => {
    try {
      const [available, myBids] = await Promise.all([
        orderService.getAvailableOrders(),
        bidService.getMyBids(),
      ]);
      setOrders(available);
      const map: Record<string, Bid> = {};
      myBids.forEach(b => {
        if (b.status === 'pending' && b.order) {
          const orderId = typeof b.order === 'string' ? b.order : (b.order as any)._id;
          map[orderId] = b as unknown as Bid;
        }
      });
      setMyBidMap(map);
    } catch (e: any) {
      if (!silent) console.warn('Map: Failed to fetch available orders', e?.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchJobs();
    const interval = setInterval(() => fetchJobs(true), 30000);
    return () => clearInterval(interval);
  }, [fetchJobs]));

  // Build a map marker coordinate for an order (farmer location or random fallback in Pakistan)
  const getPickupCoord = (order: Order) => {
    const coords = (order.farmer as any)?.location?.coordinates;
    if (coords && coords.length === 2) {
      return { latitude: coords[1], longitude: coords[0] };
    }
    // Deterministic fallback based on ID chars
    const seed = parseInt(order._id.slice(-4), 16) / 65536;
    return {
      latitude: 24 + seed * 12,  // ~24°N to 36°N (Pakistan range)
      longitude: 61 + seed * 14, // ~61°E to 75°E
    };
  };

  const getDropoffCoord = (order: Order) => {
    const coords = (order.shippingAddress as any)?.coordinates;
    if (coords && coords.length === 2) {
      return { latitude: coords[1], longitude: coords[0] };
    }
    const seed = parseInt(order._id.slice(-6, -4), 16) / 256;
    return {
      latitude: 24 + seed * 12,
      longitude: 62 + seed * 14,
    };
  };

  const handleMarkerPress = (order: Order) => {
    setSelectedOrder(order);
    const pickup = getPickupCoord(order);
    const dropoff = getDropoffCoord(order);
    // Fit map to show both pickup and dropoff
    mapRef.current?.fitToCoordinates([pickup, dropoff], {
      edgePadding: { top: 80, right: 50, bottom: 280, left: 50 },
      animated: true,
    });
  };

  const handleMapPress = () => {
    if (!bidSheetVisible) setSelectedOrder(null);
  };

  return (
    <View style={styles.container}>
      {/* MAP */}
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={StyleSheet.absoluteFillObject}
        initialRegion={PAKISTAN_REGION}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {orders.map((order) => {
          const pickup = getPickupCoord(order);
          const dropoff = getDropoffCoord(order);
          const isSelected = selectedOrder?._id === order._id;

          return (
            <React.Fragment key={order._id}>
              {/* Pickup Marker (Green – Farmer) */}
              <Marker
                coordinate={pickup}
                onPress={() => handleMarkerPress(order)}
                zIndex={isSelected ? 10 : 1}
              >
                <View style={[styles.markerContainer, isSelected && styles.markerContainerSelected]}>
                  <View style={[styles.markerBubble, { backgroundColor: Colors.primary }]}>
                    <Text style={styles.markerEmoji}>🌾</Text>
                  </View>
                  <View style={[styles.markerTail, { borderTopColor: Colors.primary }]} />
                </View>
              </Marker>

              {/* Dropoff Marker (Red – Buyer) */}
              <Marker
                coordinate={dropoff}
                onPress={() => handleMarkerPress(order)}
                zIndex={isSelected ? 10 : 1}
              >
                <View style={[styles.markerContainer, isSelected && styles.markerContainerSelected]}>
                  <View style={[styles.markerBubble, { backgroundColor: '#EF4444' }]}>
                    <Text style={styles.markerEmoji}>📦</Text>
                  </View>
                  <View style={[styles.markerTail, { borderTopColor: '#EF4444' }]} />
                </View>
              </Marker>

              {/* Route line between pickup and dropoff */}
              {isSelected && (
                <Polyline
                  coordinates={[pickup, dropoff]}
                  strokeColor={Colors.primary}
                  strokeWidth={3}
                  lineDashPattern={[8, 4]}
                />
              )}
            </React.Fragment>
          );
        })}
      </MapView>

      {/* TOP HEADER */}
      <View style={[styles.topHeader, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Available Jobs</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchJobs(true)}>
          <Feather name="refresh-cw" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Jobs Count Pill */}
      <View style={[styles.countPill, { top: insets.top + 60 }]}>
        <Feather name="package" size={13} color="#fff" />
        <Text style={styles.countText}>{orders.length} jobs nearby</Text>
      </View>

      {/* My Location button */}
      <TouchableOpacity
        style={[styles.myLocBtn, { bottom: selectedOrder ? 260 : 100 }]}
        onPress={() => {
          if (userLocation) {
            mapRef.current?.animateToRegion({ ...userLocation, latitudeDelta: 0.3, longitudeDelta: 0.3 }, 800);
          }
        }}
      >
        <Feather name="navigation" size={18} color={Colors.primary} />
      </TouchableOpacity>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Finding jobs near you...</Text>
        </View>
      )}

      {/* Selected Job Info Card */}
      {selectedOrder && !bidSheetVisible && (
        <JobInfoCard
          order={selectedOrder}
          onBid={() => setBidSheetVisible(true)}
          onDismiss={() => setSelectedOrder(null)}
        />
      )}

      {/* Bid Bottom Sheet Modal */}
      <Modal
        visible={bidSheetVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setBidSheetVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setBidSheetVisible(false)}
        />
        <ScrollView
          style={styles.modalSheet}
          contentContainerStyle={{ paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {selectedOrder && (
            <BidSheet
              order={selectedOrder}
              existingBid={myBidMap[selectedOrder._id] ?? null}
              onClose={() => setBidSheetVisible(false)}
              onSuccess={() => { fetchJobs(); setSelectedOrder(null); }}
            />
          )}
        </ScrollView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  topHeader: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FEF3C7', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B' },
  liveText: { fontSize: 9, fontWeight: '900', color: '#92400E', letterSpacing: 1 },
  refreshBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },

  countPill: {
    position: 'absolute', alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#111827', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
  },
  countText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  myLocBtn: {
    position: 'absolute', right: 16,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 8,
  },

  // Markers
  markerContainer: { alignItems: 'center' },
  markerContainerSelected: { transform: [{ scale: 1.2 }] },
  markerBubble: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 6,
  },
  markerEmoji: { fontSize: 20 },
  markerTail: {
    width: 0, height: 0,
    borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 10,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    marginTop: -1,
  },

  // Job info card
  jobCard: {
    position: 'absolute', bottom: 80, left: 12, right: 12,
    backgroundColor: '#fff', borderRadius: 24, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 20,
  },
  jobCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  jobCardId: { fontSize: 10, fontWeight: '900', color: Colors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 },
  jobCardTitle: { fontSize: 16, fontWeight: '900', color: '#111827', maxWidth: width - 100 },

  jobCardRoute: { backgroundColor: '#F8FAFB', borderRadius: 16, padding: 14, marginBottom: 12 },
  routeItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeBullet: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#fff' },
  routeText: { fontSize: 12, fontWeight: '600', color: '#374151', flex: 1 },
  routeDivider: { height: 18, width: 1, backgroundColor: '#E5E7EB', marginLeft: 4, marginVertical: 4 },

  jobCardMeta: { flexDirection: 'row', gap: 12, marginBottom: 14, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, fontWeight: '700', color: '#374151' },

  jobCardActions: { flexDirection: 'row', gap: 10 },
  dismissBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, paddingVertical: 13,
  },
  dismissText: { fontSize: 14, fontWeight: '800', color: Colors.textSecondary },
  bidBtn: {
    flex: 2.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#111827', borderRadius: 14, paddingVertical: 13,
  },
  bidBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: height * 0.85,
  },

  // Loading
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  loadingText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
});

const sheet = StyleSheet.create({
  container: { backgroundColor: '#fff', padding: 20 },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 20,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  title: { fontSize: 20, fontWeight: '900', color: '#111827' },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 3, fontWeight: '600' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },

  routeCard: {
    backgroundColor: '#F8FAFB', borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 18,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2.5, borderColor: '#fff' },
  routeTextBox: { flex: 1 },
  routeLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase' },
  routeAddr: { fontSize: 13, fontWeight: '700', color: '#111827' },
  routeLine: { height: 14, width: 1.5, backgroundColor: '#E2E8F0', marginLeft: 5, marginVertical: 4 },
  cargoRow: {
    flexDirection: 'row', gap: 8, marginTop: 12,
    borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10,
  },
  cargoTag: {
    backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, fontSize: 11, fontWeight: '700', color: Colors.primary,
  },

  inputRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  inputBox: { marginBottom: 12 },
  inputLabel: { fontSize: 10, fontWeight: '900', color: '#64748B', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  input: {
    backgroundColor: '#F8FAFB', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
    fontSize: 15, fontWeight: '600', color: '#1E293B',
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, marginTop: 4,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});


