import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { SUPPORT } from '@/constants/support';

interface FAQ { q: string; a: string }

const FAQS: FAQ[] = [
  {
    q: 'How does the Escrow system work?',
    a: 'When you place an order, the payment is held safely by DigitalKisan. The farmer only receives the funds once you confirm delivery. If anything goes wrong, you can raise a dispute and the funds are refunded.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Most orders are delivered within 1–3 working days, depending on your distance from the farmer. You can track your rider live once the order is in transit.',
  },
  {
    q: 'Can I cancel an order?',
    a: 'Yes — orders can be cancelled at the "Pending" or "Paid" stage. Once a rider has picked up the goods, cancellation is no longer possible. Open your order to see the cancel button when available.',
  },
  {
    q: 'How do I add money to my wallet?',
    a: 'Open the Wallet tab → Add Money → choose a method (Card, JazzCash, Easypaisa, or Bank Transfer). The minimum top-up is ₨ 100.',
  },
  {
    q: 'How are farmers verified?',
    a: 'Every farmer goes through our verification process before they can list products. We check identity documents and farm details. You\'ll see a green check next to verified farmers.',
  },
  {
    q: 'What if I receive damaged or wrong goods?',
    a: 'Do not confirm delivery. Open the order and contact support — we\'ll arbitrate the dispute and refund the escrowed amount if the complaint is valid.',
  },
  {
    q: 'Are prices negotiable?',
    a: 'Listed prices are set by farmers. For bulk orders, you can contact the farmer directly using the "Contact" button on the order details page.',
  },
];

function FAQItem({ item }: { item: FAQ }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      style={styles.faqCard}
      onPress={() => setOpen(o => !o)}
      activeOpacity={0.85}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQ}>{item.q}</Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
      </View>
      {open && <Text style={styles.faqA}>{item.a}</Text>}
    </TouchableOpacity>
  );
}

export default function HelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const openWhatsApp = () => {
    const url = `https://wa.me/${SUPPORT.whatsapp.replace(/[^\d]/g, '')}?text=Hi%2C%20I%20need%20help%20with%20DigitalKisan`;
    Linking.openURL(url).catch(() => {});
  };
  const openEmail = () => Linking.openURL(`mailto:${SUPPORT.email}`).catch(() => {});
  const openCall  = () => Linking.openURL(`tel:${SUPPORT.phone}`).catch(() => {});

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Get in touch</Text>
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactCard} onPress={openWhatsApp}>
            <View style={[styles.contactIcon, { backgroundColor: '#DCFCE7' }]}>
              <Feather name="message-circle" size={20} color="#16A34A" />
            </View>
            <Text style={styles.contactLabel}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactCard} onPress={openCall}>
            <View style={[styles.contactIcon, { backgroundColor: '#DBEAFE' }]}>
              <Feather name="phone" size={20} color="#2563EB" />
            </View>
            <Text style={styles.contactLabel}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactCard} onPress={openEmail}>
            <View style={[styles.contactIcon, { backgroundColor: '#FEE2E2' }]}>
              <Feather name="mail" size={20} color="#DC2626" />
            </View>
            <Text style={styles.contactLabel}>Email</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Frequently asked</Text>
        {FAQS.map((f, i) => <FAQItem key={i} item={f} />)}

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  content: { padding: 20 },

  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: '#94A3B8',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
  },
  contactRow: { flexDirection: 'row', gap: 10 },
  contactCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 18,
    alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9',
  },
  contactIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  contactLabel: { fontSize: 12, fontWeight: '800', color: Colors.textPrimary },

  faqCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  faqA: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500', lineHeight: 20, marginTop: 10 },
});
