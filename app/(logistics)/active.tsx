import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator, RefreshControl, Alert,
  Image, Modal, ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import orderService, { Order, OrderStatus } from '@/services/order.service';
import { socketService } from '@/services/socket.service';

// Statuses considered "active" for GPS broadcasting + active tab
const ACTIVE_STATUSES: OrderStatus[] = ['in_transit', 'picked_up', 'reached'];

// ── Step config ───────────────────────────────────────────────────────────────
const STEPS = [
  { key: 'picked_up', label: 'Pickup',    icon: 'package'   as const, requiresPhoto: true  },
  { key: 'reached',   label: 'Reached',   icon: 'map-pin'   as const, requiresPhoto: true  },
  { key: 'delivered', label: 'Delivered', icon: 'check-circle' as const, requiresPhoto: false },
];

function stepIndex(status: OrderStatus) {
  if (status === 'in_transit') return -1;
  return STEPS.findIndex(s => s.key === status);
}

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  in_transit: { label: 'In Transit',  bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  picked_up:  { label: 'Picked Up',   bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  reached:    { label: 'Reached',     bg: '#EDE9FE', text: '#5B21B6', dot: '#8B5CF6' },
  delivered:  { label: 'Delivered',   bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  cancelled:  { label: 'Cancelled',   bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
};

// ── Delivery Stepper ──────────────────────────────────────────────────────────
function DeliveryStepper({ status }: { status: OrderStatus }) {
  const current = stepIndex(status);

  return (
    <View style={styles.stepper}>
      {STEPS.map((step, i) => {
        const done   = i < current || status === step.key;
        const active = status === 'in_transit' ? i === 0 : stepIndex(status) === i - 1;
        const isDone = i <= current;

        return (
          <React.Fragment key={step.key}>
            <View style={styles.stepItem}>
              <View style={[
                styles.stepCircle,
                isDone ? styles.stepDone : active ? styles.stepActive : styles.stepPending,
              ]}>
                <Feather
                  name={isDone ? 'check' : step.icon}
                  size={13}
                  color={isDone ? '#fff' : active ? Colors.primary : '#94A3B8'}
                />
              </View>
              <Text style={[styles.stepLabel, isDone ? styles.stepLabelDone : undefined]}>
                {step.label}
              </Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[styles.stepConnector, isDone && i < current ? styles.stepConnectorDone : undefined]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ── Proof Modal ───────────────────────────────────────────────────────────────
function ProofModal({
  visible,
  targetStatus,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  targetStatus: OrderStatus | null;
  onSubmit: (imageUri: string) => void;
  onClose: () => void;
}) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (visible) setPhotoUri(null);
  }, [visible]);

  const openCamera = async () => {
    setCapturing(true);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission needed', 'Camera access is required to take a proof photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
        base64: true,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const uri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setPhotoUri(uri);
      }
    } finally {
      setCapturing(false);
    }
  };

  const openLibrary = async () => {
    setCapturing(true);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission needed', 'Photo library access is required.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
        base64: true,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const uri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setPhotoUri(uri);
      }
    } finally {
      setCapturing(false);
    }
  };

  const stepLabel = STEPS.find(s => s.key === targetStatus)?.label ?? '';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>📸 Photo Proof</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Feather name="x" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
          <Text style={styles.modalDesc}>
            Take a photo to confirm <Text style={{ fontWeight: '800' }}>{stepLabel}</Text>.
            This proof is stored with the order record.
          </Text>

          {/* Photo preview */}
          {photoUri ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: photoUri }} style={styles.photoImg} resizeMode="cover" />
              <TouchableOpacity style={styles.retakeBtn} onPress={() => setPhotoUri(null)}>
                <Feather name="refresh-cw" size={13} color="#2563EB" />
                <Text style={styles.retakeBtnText}>Retake</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Feather name="camera" size={40} color="#CBD5E1" />
              <Text style={styles.photoPlaceholderText}>No photo yet</Text>
            </View>
          )}

          {/* Capture buttons */}
          {!photoUri && (
            <View style={styles.captureRow}>
              <TouchableOpacity
                style={[styles.captureBtn, { flex: 1 }]}
                onPress={openCamera}
                disabled={capturing}
                activeOpacity={0.85}
              >
                {capturing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="camera" size={16} color="#fff" />
                    <Text style={styles.captureBtnText}>Camera</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.captureBtnOutline, { flex: 1 }]}
                onPress={openLibrary}
                disabled={capturing}
                activeOpacity={0.85}
              >
                <Feather name="image" size={16} color={Colors.primary} />
                <Text style={styles.captureBtnOutlineText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Submit */}
          {photoUri && (
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={() => onSubmit(photoUri)}
              activeOpacity={0.85}
            >
              <Feather name="check-circle" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Submit & Update Status</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Product Thumbnail ─────────────────────────────────────────────────────────
function ProductThumb({ uri }: { uri?: string }) {
  const [errored, setErrored] = useState(false);
  if (uri && !errored) {
    return (
      <Image
        source={{ uri }}
        style={styles.productImage}
        resizeMode="cover"
        onError={() => setErrored(true)}
      />
    );
  }
  return (
    <View style={styles.productEmoji}>
      <Text style={{ fontSize: 24 }}>🌾</Text>
    </View>
  );
}

// ── Active Job Card ───────────────────────────────────────────────────────────
function ActiveJobCard({
  order,
  onAction,
  onTrackMap,
}: {
  order: Order;
  onAction: (o: Order, target: OrderStatus) => void;
  onTrackMap: () => void;
}) {
  const cfg = STATUS_LABELS[order.status] ?? STATUS_LABELS.in_transit;
  const isActive = ACTIVE_STATUSES.includes(order.status);

  // Determine the next step button
  let nextStatus: OrderStatus | null = null;
  let btnLabel = '';
  let btnIcon: React.ComponentProps<typeof Feather>['name'] = 'arrow-right';
  let btnStyle = styles.actionBtnGreen;

  if (order.status === 'in_transit') {
    nextStatus = 'picked_up';
    btnLabel = '📦 Confirm Pickup';
    btnStyle = styles.actionBtnGreen;
  } else if (order.status === 'picked_up') {
    nextStatus = 'reached';
    btnLabel = '📍 Mark Reached';
    btnStyle = styles.actionBtnBlue;
  } else if (order.status === 'reached') {
    nextStatus = 'delivered';
    btnLabel = '✅ Mark Delivered';
    btnStyle = styles.actionBtnGreen;
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardTop}>
        <View style={styles.orderIdBox}>
          <Text style={styles.orderIdText}>#{order._id.slice(-6).toUpperCase()}</Text>
        </View>
        <View style={[styles.statusChip, { backgroundColor: cfg.bg }]}>
          <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
          <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Stepper (only for active orders) */}
      {isActive && <DeliveryStepper status={order.status} />}

      {/* Product */}
      <View style={styles.productRow}>
        <ProductThumb uri={order.product?.images?.[0]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.productName}>{order.product?.title ?? 'Agricultural Product'}</Text>
          <Text style={styles.productMeta}>{order.quantity} units · ₨{order.totalPrice?.toLocaleString()}</Text>
        </View>
      </View>

      {/* Route */}
      <View style={styles.routeBox}>
        <View style={styles.routeRow}>
          <View style={[styles.bullet, { backgroundColor: Colors.primary }]} />
          <Text style={styles.routeText} numberOfLines={1}>
            {order.farmer?.location?.address ?? `Farmer: ${order.farmer?.name ?? '—'}`}
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeRow}>
          <View style={[styles.bullet, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.routeText} numberOfLines={1}>
            {order.shippingAddress?.address ?? 'Delivery address'}
          </Text>
        </View>
      </View>

      {/* Buyer */}
      <View style={styles.infoRow}>
        <Feather name="user" size={12} color={Colors.textSecondary} />
        <Text style={styles.infoText}>Buyer: {order.buyer?.name ?? '—'} · {order.buyer?.phone ?? '—'}</Text>
      </View>

      {/* Actions */}
      {isActive && nextStatus && (
        <>
          <TouchableOpacity style={styles.mapBtn} onPress={onTrackMap} activeOpacity={0.85}>
            <Feather name="map-pin" size={14} color="#2563EB" />
            <Text style={styles.mapBtnText}>Track on Map</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, btnStyle]}
            onPress={() => onAction(order, nextStatus!)}
            activeOpacity={0.85}
          >
            <Text style={styles.actionBtnText}>{btnLabel}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ActiveDeliveries() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'done'>('active');
  const [updating, setUpdating] = useState(false);

  // ProofModal state
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const pendingActionRef = useRef<{ order: Order; target: OrderStatus } | null>(null);

  const locationWatcher = useRef<Location.LocationSubscription | null>(null);
  const lastFetchRef = useRef<number>(0);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    const now = Date.now();
    if (!isRefresh && lastFetchRef.current > 0 && now - lastFetchRef.current < 10_000) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const data = await orderService.getMyOrders();
      setOrders(data);
      lastFetchRef.current = Date.now();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load deliveries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchOrders(); }, [fetchOrders]));

  // GPS broadcasting for all active-status orders
  useEffect(() => {
    const activeOrders = orders.filter(o => ACTIVE_STATUSES.includes(o.status));
    if (activeOrders.length === 0) {
      locationWatcher.current?.remove();
      locationWatcher.current = null;
      return;
    }

    let mounted = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || !mounted) return;

      socketService.connect();
      activeOrders.forEach(o => socketService.joinOrder(o._id));

      locationWatcher.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        ({ coords }) => {
          activeOrders.forEach(o =>
            socketService.emitLocation(o._id, coords.latitude, coords.longitude)
          );
        }
      );
    })();

    return () => {
      mounted = false;
      try { locationWatcher.current?.remove(); } catch (_) {}
      locationWatcher.current = null;
      // Do NOT disconnect socket — other screens share the singleton connection.
    };
  }, [orders]);

  // Called when user taps an action button on a card
  const handleAction = (order: Order, target: OrderStatus) => {
    const step = STEPS.find(s => s.key === target);

    if (step?.requiresPhoto) {
      pendingActionRef.current = { order, target };
      setProofModalVisible(true);
    } else {
      // No photo required (delivered) — platform-aware confirm
      if (Platform.OS === 'web') {
        if ((window as any).confirm(
          `Mark order as Delivered?\n\nProduct: ${order.product?.title}\nBuyer: ${order.buyer?.name}\n\nEscrow will be released to the farmer.`
        )) {
          doStatusUpdate(order, target, undefined);
        }
      } else {
        Alert.alert(
          '✅ Confirm Delivery',
          `Mark this order as Delivered?\n\nProduct: ${order.product?.title}\nBuyer: ${order.buyer?.name}\n\nEscrow will be released to the farmer.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Mark Delivered', onPress: () => doStatusUpdate(order, target, undefined) },
          ]
        );
      }
    }
  };

  // Called after proof photo is captured and submitted
  const handleProofSubmit = async (imageUri: string) => {
    const pending = pendingActionRef.current;
    if (!pending) return;
    setProofModalVisible(false);
    pendingActionRef.current = null;
    await doStatusUpdate(pending.order, pending.target, imageUri);
  };

  const doStatusUpdate = async (order: Order, target: OrderStatus, proofImage: string | undefined) => {
    setUpdating(true);
    try {
      await orderService.updateStatus(order._id, target, proofImage);
      const messages: Record<string, string> = {
        picked_up: 'Pickup confirmed! Proof photo saved.',
        reached:   'Reached confirmed! Proof photo saved.',
        delivered: '🎉 Order delivered! Payment has been released.',
      };
      Alert.alert('Updated!', messages[target] ?? 'Status updated.');
      fetchOrders(true);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const activeOrders = orders.filter(o => ACTIVE_STATUSES.includes(o.status));
  const doneOrders   = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));
  const displayed    = activeTab === 'active' ? activeOrders : doneOrders;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>My Deliveries</Text>
          <Text style={styles.subheading}>Track your active jobs</Text>
        </View>
        <TouchableOpacity onPress={() => fetchOrders(true)} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={[styles.summaryCard, { backgroundColor: '#DBEAFE' }]}>
          <Text style={[styles.summaryVal, { color: '#1E40AF' }]}>{activeOrders.length}</Text>
          <Text style={[styles.summaryLabel, { color: '#1E40AF' }]}>Active</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#D1FAE5' }]}>
          <Text style={[styles.summaryVal, { color: '#065F46' }]}>{doneOrders.length}</Text>
          <Text style={[styles.summaryLabel, { color: '#065F46' }]}>Completed</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['active', 'done'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'active' ? 'In Transit' : 'Completed'}
            </Text>
            {(tab === 'active' ? activeOrders : doneOrders).length > 0 && (
              <View style={[styles.tabBadge, activeTab === tab && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === tab && styles.tabBadgeTextActive]}>
                  {(tab === 'active' ? activeOrders : doneOrders).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Loading overlay for status update */}
      {updating && (
        <View style={styles.updatingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.updatingText}>Updating status…</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Feather name="wifi-off" size={32} color={Colors.textSecondary} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchOrders()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <ActiveJobCard
              order={item}
              onAction={handleAction}
              onTrackMap={() => router.push('/(logistics)/map' as any)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders(true)} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>
                {activeTab === 'active' ? '🚚' : '✅'}
              </Text>
              <Text style={styles.emptyTitle}>
                {activeTab === 'active' ? 'No Active Deliveries' : 'No Completed Jobs Yet'}
              </Text>
              <Text style={styles.emptyMsg}>
                {activeTab === 'active'
                  ? 'Accept a bid from the Map or Jobs tab to see your active deliveries here.'
                  : 'Completed deliveries will appear here.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Proof Modal */}
      <ProofModal
        visible={proofModalVisible}
        targetStatus={pendingActionRef.current?.target ?? null}
        onSubmit={handleProofSubmit}
        onClose={() => {
          setProofModalVisible(false);
          pendingActionRef.current = null;
        }}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFB' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  heading: { fontSize: 24, fontWeight: '900', color: '#111827', letterSpacing: -0.5 },
  subheading: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, fontWeight: '500' },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },

  summaryBar: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  summaryCard: {
    flex: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  summaryVal: { fontSize: 22, fontWeight: '900' },
  summaryLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  tabBar: {
    flexDirection: 'row', backgroundColor: '#fff',
    paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },
  tabBadge: {
    minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  tabBadgeActive: { backgroundColor: Colors.primaryLight },
  tabBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.textSecondary },
  tabBadgeTextActive: { color: Colors.primary },

  list: { padding: 16, paddingBottom: 60 },

  // ── Stepper ──
  stepper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFB', borderRadius: 14, padding: 12,
    marginBottom: 14,
  },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDone:    { backgroundColor: '#059669' },
  stepActive:  { backgroundColor: Colors.primaryLight, borderWidth: 2, borderColor: Colors.primary },
  stepPending: { backgroundColor: '#E5E7EB' },
  stepLabel:   { fontSize: 9, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  stepLabelDone: { color: '#059669' },
  stepConnector: { flex: 1, height: 2, backgroundColor: '#E5E7EB', marginBottom: 14 },
  stepConnectorDone: { backgroundColor: '#059669' },

  // ── Card ──
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  orderIdBox: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  orderIdText: { fontSize: 10, fontWeight: '900', color: '#475569', letterSpacing: 0.5 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '800' },

  productRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  productEmoji: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  productImage: { width: 44, height: 44, borderRadius: 12 },
  productName: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 2 },
  productMeta: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },

  routeBox: { backgroundColor: '#F8FAFB', borderRadius: 14, padding: 12, marginBottom: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bullet: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#fff' },
  routeText: { fontSize: 12, fontWeight: '600', color: '#374151', flex: 1 },
  routeLine: { height: 14, width: 1.5, backgroundColor: '#E5E7EB', marginLeft: 4, marginVertical: 3 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  infoText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500', flex: 1 },

  mapBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#BFDBFE', backgroundColor: '#EFF6FF',
    borderRadius: 12, padding: 10, marginBottom: 8,
  },
  mapBtnText: { color: '#2563EB', fontSize: 13, fontWeight: '700' },

  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, paddingVertical: 13,
  },
  actionBtnGreen: { backgroundColor: '#059669' },
  actionBtnBlue:  { backgroundColor: '#2563EB' },
  actionBtnText:  { color: '#fff', fontSize: 14, fontWeight: '900' },

  // ── Updating overlay ──
  updatingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)', zIndex: 99,
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  updatingText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // ── States ──
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  errorText: { color: Colors.error, fontWeight: '700', textAlign: 'center', marginVertical: 12 },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '800' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8, textAlign: 'center' },
  emptyMsg: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 16 },

  // ── Proof Modal ──
  modalRoot: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 24, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  modalClose: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  modalBody: { padding: 20, gap: 16 },
  modalDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

  photoPreview: { borderRadius: 16, overflow: 'hidden', position: 'relative' },
  photoImg: { width: '100%', height: 220, borderRadius: 16 },
  retakeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    position: 'absolute', bottom: 10, right: 10,
    backgroundColor: '#fff', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  retakeBtnText: { fontSize: 12, fontWeight: '700', color: '#2563EB' },

  photoPlaceholder: {
    height: 180, borderRadius: 16, backgroundColor: '#F8FAFB',
    borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  photoPlaceholderText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },

  captureRow: { flexDirection: 'row', gap: 10 },
  captureBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 13,
  },
  captureBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  captureBtnOutline: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.primaryLight,
    borderRadius: 14, paddingVertical: 13,
    borderWidth: 1, borderColor: Colors.primary,
  },
  captureBtnOutlineText: { color: Colors.primary, fontSize: 14, fontWeight: '800' },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#111827', borderRadius: 14, paddingVertical: 14,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '900' },
});
