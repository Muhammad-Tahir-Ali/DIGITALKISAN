import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import orderService, { Order } from '@/services/order.service';
import { Button } from '@/components/ui';
import { EscrowBadge } from '@/components/checkout/EscrowBadge';
import { StatusTimeline, TimelineStep } from '@/components/checkout/StatusTimeline';

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [otpVisible, setOtpVisible] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  useEffect(() => {
    if (!id) return;
    orderService.getById(id as string)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  // Map order status to timeline step
  let activeStep = 1;
  if (order?.status === 'paid') activeStep = 2;
  if (order?.status === 'bidding') activeStep = 3;
  if (order?.status === 'in_transit') activeStep = 4;
  if (order?.status === 'delivered') activeStep = 5;

  const ORDER_TRACKER: TimelineStep[] = [
    { key: 't1', label: 'Order Confirmed', timestamp: '10:30 AM', icon: 'check-circle' },
    { key: 't2', label: 'Quality Checked & Packed', timestamp: '11:15 AM', subtitle: 'AI graded premium quality', icon: 'package' },
    { key: 't3', label: 'Handed over to Rider', timestamp: '1:00 PM', subtitle: 'Rider: Kamran (+92-300-9876543)', icon: 'truck' },
    { key: 't4', label: 'Out for Delivery', subtitle: 'Expected by 4:00 PM today', icon: 'map-pin' },
    { key: 't5', label: 'Delivered', subtitle: 'Confirm delivery to release funds', icon: 'home' },
  ];

  const handleConfirmDelivery = () => {
     if (otpCode.length === 4) {
         setOtpVisible(false);
         // Simulate successful completion: return to confirmed page or orders
         router.replace('/(buyer)/orders' as any);
     }
  };

  if (loading) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ color: Colors.textSecondary, marginTop: 12 }}>Loading order...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <Feather name="alert-circle" size={48} color={Colors.error} />
        <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginTop: 16 }}>Order Not Found</Text>
        <Text style={{ color: Colors.textSecondary, textAlign: 'center', marginTop: 8 }}>This order could not be found or you may not have permission to view it.</Text>
        <TouchableOpacity style={{ marginTop: 24, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }} onPress={() => router.back()}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* ── MAP HEADER ── */}
      <View style={styles.mapArea}>
         <View style={styles.mapBg}>
             <Feather name="map" size={100} color={Colors.gray[200]} style={{ opacity: 0.5 }} />
             <Text style={styles.mapText}>Live GPS Tracking View</Text>
         </View>
         <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
         </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
         
         {/* ── DRIVER INFO CARD ── */}
         <View style={styles.driverCard}>
             <View style={styles.driverRow}>
                 <View style={styles.driverAvatar}>
                     <Feather name="user" size={24} color={Colors.textSecondary} />
                 </View>
                 <View style={{ flex: 1 }}>
                     <Text style={styles.driverName}>Kamran Ali</Text>
                     <Text style={styles.driverVehicle}>Honda CD70 • LEB-1234</Text>
                 </View>
                 <TouchableOpacity style={styles.phoneBtn}>
                     <Feather name="phone-call" size={18} color="#fff" />
                 </TouchableOpacity>
             </View>
             <View style={styles.driverEtaRow}>
                 <View>
                     <Text style={styles.etaLabel}>Estimated Arrival</Text>
                     <Text style={styles.etaTime}>15 - 20 mins</Text>
                 </View>
                 <View style={{ alignItems: 'flex-end' }}>
                     <Text style={styles.etaLabel}>Distance</Text>
                     <Text style={styles.etaVal}>4.2 km</Text>
                 </View>
             </View>
         </View>

         {/* ── TRUST & ESCROW ── */}
         <View style={styles.mb}>
            <EscrowBadge variant="holding" size="sm" />
         </View>

         {/* ── TIMELINE ── */}
         <View style={styles.timelineCard}>
             <StatusTimeline steps={ORDER_TRACKER} current={activeStep} />
         </View>
         
      </ScrollView>

      {/* ── BOTTOM ACTION ── */}
      <View style={styles.footer}>
          <Text style={styles.footerHint}>Share OTP with rider when you receive the produce.</Text>
          <Button 
            variant="primary" 
            label="Provide Delivery OTP" 
            onPress={() => setOtpVisible(true)}
            size="lg"
            leftIcon={<Feather name="key" size={18} color="#fff" />}
            fullWidth
            style={{ backgroundColor: Colors.agri.shab }} // Deep rich color
          />
      </View>

      {/* ── OTP MODAL ── */}
      <Modal visible={otpVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  
                  <View style={styles.modalHeader}>
                      <View style={styles.shieldIcon}>
                          <Feather name="shield" size={24} color={Colors.green[600]} />
                      </View>
                  </View>
                  
                  <Text style={styles.modalTitle}>Confirm Delivery</Text>
                  <Text style={styles.modalBody}>
                      By confirming this OTP, you authorize DigitalKisan to release the
                      <Text style={{ fontWeight: 'bold' }}> ₨{order.totalPrice.toLocaleString()} </Text>
                      currently held in Escrow to the farmer.
                  </Text>

                  <Text style={{ fontWeight: '700', marginBottom: 12, marginTop: 10 }}>Enter 4-Digit Delivery Code</Text>
                  <TextInput 
                     value={otpCode}
                     onChangeText={setOtpCode}
                     keyboardType="number-pad"
                     maxLength={4}
                     style={styles.otpInput}
                     placeholder="━  ━  ━  ━"
                     placeholderTextColor={Colors.gray[400]}
                  />

                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                      <Button variant="outline" label="Cancel" onPress={() => setOtpVisible(false)} style={{ flex: 1 }} />
                      <Button 
                         variant="primary" 
                         label="Release Funds" 
                         onPress={handleConfirmDelivery} 
                         disabled={otpCode.length !== 4}
                         style={{ flex: 1, backgroundColor: Colors.agri.peela }}
                      />
                  </View>
              </View>
          </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  mapArea: {
     height: 250, backgroundColor: Colors.gray[100],
     position: 'relative', overflow: 'hidden'
  },
  mapBg: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mapText: { color: Colors.gray[400], fontWeight: 'bold', marginTop: 10 },
  backBtn: {
     position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, left: 20,
     width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff',
     alignItems: 'center', justifyContent: 'center',
     shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 4
  },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 },
  
  driverCard: {
     backgroundColor: '#fff', borderRadius: 20, padding: 18,
     marginTop: -40, marginBottom: 20,
     shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 },
     shadowRadius: 10, elevation: 5
  },
  driverRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.gray[100], paddingBottom: 16, marginBottom: 16 },
  driverAvatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: Colors.gray[100], alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  driverName: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 4 },
  driverVehicle: { fontSize: 12, color: Colors.textSecondary },
  phoneBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center' },
  
  driverEtaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  etaLabel: { fontSize: 11, color: Colors.textSecondary, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 4 },
  etaTime: { fontSize: 18, fontWeight: '900', color: Colors.primary },
  etaVal: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },

  mb: { marginBottom: 20 },
  timelineCard: {
     backgroundColor: '#fff', borderRadius: 20, padding: 20,
     borderWidth: 1, borderColor: Colors.gray[200],
  },
  
  footer: {
     padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20,
     backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: Colors.gray[100],
     shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.05, elevation: 10
  },
  footerHint: { textAlign: 'center', fontSize: 12, color: Colors.textSecondary, marginBottom: 12, fontWeight: '600' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHeader: { alignItems: 'center', marginBottom: 20 },
  shieldIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.green[50], alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.green[100] },
  modalTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  modalBody: { textAlign: 'center', color: Colors.textSecondary, lineHeight: 22, fontSize: 14, marginBottom: 20 },
  
  otpInput: {
      backgroundColor: Colors.gray[100], borderRadius: 16, paddingVertical: 18,
      textAlign: 'center', fontSize: 28, fontWeight: '900', letterSpacing: 8, color: Colors.textPrimary
  }
});
