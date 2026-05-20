import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Linking,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import orderService, { Order, OrderStatus } from '@/services/order.service';
import { socketService } from '@/services/socket.service';

const ACTIVE_STATUSES: OrderStatus[] = ['in_transit', 'picked_up', 'reached'];

// ── Delivery steps shown to the buyer ─────────────────────────────────────────
const STEPS: { key: OrderStatus; label: string; icon: React.ComponentProps<typeof Feather>['name']; desc: string }[] = [
  { key: 'in_transit', label: 'Assigned',   icon: 'truck',        desc: 'Rider assigned, heading to pickup'       },
  { key: 'picked_up',  label: 'On the Way', icon: 'package',      desc: 'Product collected, heading to you'       },
  { key: 'reached',    label: 'Reached',    icon: 'map-pin',      desc: 'Rider is at your location'               },
  { key: 'delivered',  label: 'Delivered',  icon: 'check-circle', desc: 'Order successfully delivered'            },
];

function stepIndexOf(status: OrderStatus) {
  return STEPS.findIndex(s => s.key === status);
}

// ── Progress Stepper ──────────────────────────────────────────────────────────
function DeliveryStepper({ status }: { status: OrderStatus }) {
  const current = stepIndexOf(status);
  const isLastStep = current === STEPS.length - 1;

  return (
    <View style={styles.stepper}>
      {STEPS.map((step, i) => {
        const done   = i < current || (isLastStep && i === current);
        const active = i === current && !isLastStep;

        return (
          <React.Fragment key={step.key}>
            <View style={styles.stepCol}>
              <View style={[
                styles.stepCircle,
                done   ? styles.stepDone   :
                active ? styles.stepActive :
                         styles.stepPending,
              ]}>
                <Feather
                  name={done ? 'check' : step.icon}
                  size={13}
                  color={done ? '#fff' : active ? Colors.primary : '#CBD5E1'}
                />
              </View>
              <Text style={[
                styles.stepLabel,
                done   ? styles.stepLabelDone   :
                active ? styles.stepLabelActive :
                         styles.stepLabelPending,
              ]} numberOfLines={1}>
                {step.label}
              </Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[styles.stepLine, done ? styles.stepLineDone : undefined]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ── Deterministic Pakistan-region coords (fallback) ───────────────────────────
function pseudoCoords(seed: string, index = 0) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return {
    latitude:  30.3 + ((Math.abs(h + index * 7919) % 400) / 1000),
    longitude: 70.1 + ((Math.abs(h + index * 3541) % 300) / 1000),
  };
}

type DriverLocation = { latitude: number; longitude: number };

// ── Screen ────────────────────────────────────────────────────────────────────
export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const mapRef  = useRef<MapView>(null);

  const [order,           setOrder]           = useState<Order | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [driverLocation,  setDriverLocation]  = useState<DriverLocation | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastUpdate,      setLastUpdate]      = useState<Date | null>(null);

  // Fetch order
  useEffect(() => {
    if (!id) return;
    orderService.getById(id as string)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  // Socket: join room, listen to driver GPS + status changes
  // Depends only on order._id so listeners are stable — status changes handled inside callbacks
  useEffect(() => {
    if (!order?._id) return;

    const sock = socketService.connect();
    setSocketConnected(sock.connected);

    const onConnect    = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    sock.on('connect',    onConnect);
    sock.on('disconnect', onDisconnect);

    socketService.joinOrder(order._id);

    // Live GPS from logistics provider
    const offLocation = socketService.onDriverLocation((data) => {
      const loc = { latitude: data.latitude, longitude: data.longitude };
      setDriverLocation(loc);
      setLastUpdate(new Date());
      mapRef.current?.animateToRegion({ ...loc, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 800);
    });

    // Live status updates — update order state; no effect re-run needed
    const offStatus = socketService.onOrderStatusUpdated(order._id, ({ status }) => {
      setOrder(prev => prev ? { ...prev, status: status as OrderStatus } : prev);
    });

    return () => {
      offLocation();
      offStatus();
      sock.off('connect',    onConnect);
      sock.off('disconnect', onDisconnect);
    };
  }, [order?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading order…</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.root, styles.centered, { padding: 24 }]}>
        <Feather name="alert-circle" size={48} color={Colors.error} />
        <Text style={styles.errorTitle}>Order Not Found</Text>
        <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isActive    = ACTIVE_STATUSES.includes(order.status);
  const isDelivered = order.status === 'delivered';

  // Map coordinates
  const farmerCoords = (() => {
    const c = (order.farmer as any)?.location?.coordinates;
    return c ? { latitude: c[1], longitude: c[0] } : pseudoCoords(order._id, 1);
  })();
  const buyerCoords = (() => {
    const c = (order.buyer as any)?.location?.coordinates;
    return c ? { latitude: c[1], longitude: c[0] } : pseudoCoords(order._id, 2);
  })();
  const mapCenter = driverLocation ?? (isActive ? farmerCoords : buyerCoords);
  const initialRegion: Region = { ...mapCenter, latitudeDelta: 0.08, longitudeDelta: 0.08 };

  const provider   = order.logisticsProvider;
  const riderName  = provider?.name  ?? 'Rider';
  const riderPhone = provider?.phone ?? '';

  const currentStep = STEPS.find(s => s.key === order.status);
  const statusColors: Record<string, string> = {
    in_transit: '#1E40AF',
    picked_up:  '#92400E',
    reached:    '#5B21B6',
    delivered:  '#065F46',
  };
  const statusBg: Record<string, string> = {
    in_transit: '#DBEAFE',
    picked_up:  '#FEF3C7',
    reached:    '#EDE9FE',
    delivered:  '#D1FAE5',
  };

  return (
    <View style={styles.root}>

      {/* ── DELIVERED BANNER ── */}
      {isDelivered && (
        <View style={styles.deliveredBanner}>
          <Text style={styles.deliveredBannerText}>🎉 Order Delivered Successfully!</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.deliveredBannerBtn}>
            <Text style={styles.deliveredBannerBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── MAP ── */}
      <View style={styles.mapArea}>
        {isActive ? (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFillObject}
            initialRegion={initialRegion}
            showsUserLocation={false}
            showsCompass={false}
            toolbarEnabled={false}
          >
            {/* Farm pickup */}
            <Marker coordinate={farmerCoords} title="Farm Pickup" description={order.farmer?.name ?? ''}>
              <View style={styles.markerGreen}><Text style={{ fontSize: 16 }}>🌾</Text></View>
            </Marker>

            {/* Delivery destination */}
            <Marker coordinate={buyerCoords} title="Your Address" description={order.shippingAddress?.address ?? ''}>
              <View style={styles.markerRed}><Text style={{ fontSize: 16 }}>📦</Text></View>
            </Marker>

            {/* Live rider position */}
            {driverLocation && (
              <Marker coordinate={driverLocation} title={riderName}>
                <View style={styles.markerDriver}>
                  <Feather name="truck" size={16} color="#fff" />
                </View>
              </Marker>
            )}
          </MapView>
        ) : (
          <View style={styles.mapBg}>
            <Text style={{ fontSize: 56, marginBottom: 8 }}>{isDelivered ? '🎉' : '🗺️'}</Text>
            <Text style={styles.mapBgText}>{isDelivered ? 'Order Delivered!' : 'Awaiting Pickup'}</Text>
          </View>
        )}

        {/* LIVE chip */}
        {isActive && (
          <View style={[styles.liveChip, { top: insets.top + 10 }]}>
            <View style={[styles.liveDot, { backgroundColor: socketConnected ? '#22C55E' : '#F59E0B' }]} />
            <Text style={styles.liveText}>{socketConnected ? 'LIVE' : 'Connecting…'}</Text>
          </View>
        )}

        {/* Back button */}
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + 10 }]}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── RIDER CARD ── */}
        <View style={styles.riderCard}>
          <View style={styles.riderRow}>
            <View style={styles.riderAvatar}>
              <Feather name="truck" size={22} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.riderName}>{riderName}</Text>
              <Text style={styles.riderSub}>
                {provider ? (riderPhone || 'Logistics Provider') : 'No rider assigned yet'}
              </Text>
            </View>
            {riderPhone ? (
              <TouchableOpacity
                style={styles.phoneBtn}
                onPress={() => Linking.openURL(`tel:${riderPhone}`)}
              >
                <Feather name="phone-call" size={17} color="#fff" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Current status pill */}
          <View style={[styles.statusPill, { backgroundColor: statusBg[order.status] ?? '#F1F5F9' }]}>
            <Feather name={currentStep?.icon ?? 'clock'} size={14} color={statusColors[order.status] ?? '#475569'} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusPillLabel, { color: statusColors[order.status] ?? '#475569' }]}>
                {currentStep?.label ?? order.status.replace('_', ' ')}
              </Text>
              {currentStep?.desc && (
                <Text style={[styles.statusPillDesc, { color: statusColors[order.status] ?? '#475569' }]}>
                  {currentStep.desc}
                </Text>
              )}
            </View>
            {lastUpdate && (
              <Text style={[styles.lastUpdate, { color: statusColors[order.status] ?? '#475569' }]}>
                {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </View>
        </View>

        {/* ── DELIVERY STEPPER ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Progress</Text>
          <DeliveryStepper status={order.status} />
        </View>

        {/* ── ROUTE ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Route</Text>
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>Pickup</Text>
              <Text style={styles.routeAddr} numberOfLines={2}>
                {(order.farmer as any)?.location?.address ?? order.farmer?.name ?? '—'}
              </Text>
            </View>
          </View>
          <View style={styles.routeConnector} />
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: '#EF4444' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>Delivery</Text>
              <Text style={styles.routeAddr} numberOfLines={2}>
                {order.shippingAddress?.address ?? '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── ORDER SUMMARY ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Product</Text>
            <Text style={styles.summaryVal}>{order.product?.title ?? '—'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Quantity</Text>
            <Text style={styles.summaryVal}>{order.quantity}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Order ID</Text>
            <Text style={styles.summaryVal}>#DK-{order._id.slice(-8).toUpperCase()}</Text>
          </View>
          <View style={[styles.summaryRow, { marginBottom: 0 }]}>
            <Text style={styles.summaryKey}>Total</Text>
            <Text style={[styles.summaryVal, { color: Colors.primary, fontWeight: '800' }]}>
              ₨{order.totalPrice.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* ── ESCROW NOTE ── */}
        <View style={styles.escrowNote}>
          <Feather name="shield" size={14} color={Colors.info} />
          <Text style={styles.escrowText}>
            Your payment of <Text style={{ fontWeight: '800' }}>₨{order.totalPrice.toLocaleString()}</Text> is
            locked in escrow and will be released to the farmer only after delivery is confirmed.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFB' },
  centered: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: Colors.textSecondary, marginTop: 12, fontWeight: '600' },
  errorTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginTop: 16 },
  backPill: {
    marginTop: 24, backgroundColor: Colors.primary,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },

  // Map
  mapArea: { height: 280, backgroundColor: '#E5E7EB', position: 'relative', overflow: 'hidden' },
  mapBg: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mapBgText: { color: Colors.textSecondary, fontWeight: '700', fontSize: 16 },

  backBtn: {
    position: 'absolute', left: 20,
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 5, elevation: 4,
  },
  liveChip: {
    position: 'absolute', right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 5, elevation: 4,
  },
  liveDot:  { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 11, fontWeight: '900', color: Colors.textPrimary, letterSpacing: 0.5 },

  markerGreen: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#D1FAE5',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary,
  },
  markerRed: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEE2E2',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#EF4444',
  },
  markerDriver: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 6,
  },

  // Content
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 60 },

  // Rider card — floats up over the map
  riderCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    marginTop: -36, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10, elevation: 5,
  },
  riderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingBottom: 14, marginBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  riderAvatar: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  riderName: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 2 },
  riderSub:  { fontSize: 12, color: Colors.textSecondary },
  phoneBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },

  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, padding: 12,
  },
  statusPillLabel: { fontSize: 14, fontWeight: '800' },
  statusPillDesc:  { fontSize: 11, fontWeight: '500', marginTop: 1, opacity: 0.8 },
  lastUpdate: { fontSize: 10, fontWeight: '700' },

  // Cards
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 14 },

  // Stepper
  stepper: { flexDirection: 'row', alignItems: 'flex-start' },
  stepCol:  { alignItems: 'center', gap: 4, minWidth: 60 },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDone:    { backgroundColor: '#059669' },
  stepActive:  { backgroundColor: Colors.primaryLight, borderWidth: 2, borderColor: Colors.primary },
  stepPending: { backgroundColor: '#F1F5F9' },
  stepLabel:     { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3, textAlign: 'center' },
  stepLabelDone:    { color: '#059669' },
  stepLabelActive:  { color: Colors.primary },
  stepLabelPending: { color: '#CBD5E1' },
  stepLine:     { flex: 1, height: 2, backgroundColor: '#E5E7EB', marginTop: 15 },
  stepLineDone: { backgroundColor: '#059669' },

  // Route
  routeRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  routeDot:       { width: 12, height: 12, borderRadius: 6, marginTop: 3, borderWidth: 2, borderColor: '#fff' },
  routeConnector: { width: 2, height: 16, backgroundColor: '#E5E7EB', marginLeft: 5, marginBottom: 4 },
  routeLabel:     { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', marginBottom: 2 },
  routeAddr:      { fontSize: 13, fontWeight: '600', color: '#374151', lineHeight: 18 },

  // Summary
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryKey: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  summaryVal: { fontSize: 13, color: '#111827', fontWeight: '600' },

  // Delivered banner
  deliveredBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#059669', paddingHorizontal: 16, paddingVertical: 12,
  },
  deliveredBannerText: { color: '#fff', fontWeight: '800', fontSize: 14, flex: 1 },
  deliveredBannerBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 6, marginLeft: 12,
  },
  deliveredBannerBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  // Escrow
  escrowNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#EFF6FF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#BFDBFE', marginBottom: 16,
  },
  escrowText: { fontSize: 12, color: '#1E40AF', fontWeight: '500', flex: 1, lineHeight: 18 },
});
