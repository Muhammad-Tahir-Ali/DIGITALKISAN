import React, { useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useCartStore, CartItem } from '@/store/cartStore';

// ── Emoji lookup ──────────────────────────────────────────────────────────────
function getEmoji(name: string) {
  if (name.includes('Wheat'))  return '🌾';
  if (name.includes('Rice'))   return '🍚';
  if (name.includes('Tomato')) return '🍅';
  if (name.includes('Mango'))  return '🥭';
  if (name.includes('Chilli')) return '🌶️';
  if (name.includes('Apple'))  return '🍎';
  return '🥬';
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyCart() {
  const router = useRouter();
  return (
    <View style={styles.emptyRoot}>
      <View style={styles.emptyIconWrap}>
        <Text style={{ fontSize: 52 }}>🛒</Text>
      </View>
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptySub}>
        Browse fresh produce from local farmers and enjoy farm-to-table quality.
      </Text>
      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={() => router.push('/(buyer)/home')}
        activeOpacity={0.85}
      >
        <Feather name="arrow-left" size={15} color="#fff" />
        <Text style={styles.emptyBtnText}>Browse Products</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Cart Item Row ─────────────────────────────────────────────────────────────
const CartRow = React.memo(function CartRow({ item }: { item: CartItem }) {
  const updateQuantity = useCartStore(s => s.updateQuantity);
  const removeItem = useCartStore(s => s.removeItem);
  const subtotal = item.price * item.quantity;

  return (
    <View style={styles.row}>
      {/* Thumbnail */}
      <View style={styles.rowThumb}>
        <Text style={styles.rowEmoji}>{getEmoji(item.name)}</Text>
      </View>

      {/* Info */}
      <View style={styles.rowInfo}>
        <View style={styles.rowTop}>
          <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
          <TouchableOpacity
            onPress={() => removeItem(item.productId)}
            hitSlop={10}
            style={styles.deleteBtn}
          >
            <Feather name="x" size={14} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.rowFarmer}>by {item.farmerName}</Text>

        <View style={styles.rowBottom}>
          {/* Stepper */}
          <View style={styles.stepper}>
            <TouchableOpacity
              onPress={() => updateQuantity(item.productId, item.quantity - 1)}
              style={[styles.stepBtn, item.quantity === 1 && styles.stepBtnDanger]}
            >
              <Feather
                name={item.quantity === 1 ? 'trash-2' : 'minus'}
                size={13}
                color={item.quantity === 1 ? Colors.error : Colors.textPrimary}
              />
            </TouchableOpacity>
            <Text style={styles.stepQty}>{item.quantity}</Text>
            <TouchableOpacity
              onPress={() => updateQuantity(item.productId, item.quantity + 1)}
              style={styles.stepBtn}
            >
              <Feather name="plus" size={13} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          {/* Price */}
          <View style={styles.priceCol}>
            <Text style={styles.subTotal}>₨{subtotal.toLocaleString()}</Text>
            <Text style={styles.unitPrice}>₨{item.price} / {item.unit}</Text>
          </View>
        </View>
      </View>
    </View>
  );
});

// ── Summary Row ───────────────────────────────────────────────────────────────
function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.sumRow}>
      <Text style={[styles.sumLabel, bold && { color: '#111827', fontWeight: '700' }]}>{label}</Text>
      <Text style={[styles.sumValue, bold && { color: Colors.primary, fontSize: 22, fontWeight: '900' }]}>{value}</Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function CartScreen() {
  const router = useRouter();
  const items = useCartStore(s => s.items);
  const totalPrice = useCartStore(s => s.totalPrice);
  const clearCart = useCartStore(s => s.clearCart);

  const deliveryFee = totalPrice > 0 ? 80 : 0;
  const gst = +(totalPrice * 0.05).toFixed(2);
  const grandTotal = totalPrice + deliveryFee + gst;
  const savings = Math.floor(totalPrice * 0.08);

  const keyExtractor = useCallback((item: CartItem) => item.productId, []);
  const renderItem = useCallback(({ item }: { item: CartItem }) => <CartRow item={item} />, []);

  if (items.length === 0) return <EmptyCart />;

  return (
    <View style={styles.root}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <Text style={styles.headerSub}>{items.length} {items.length === 1 ? 'item' : 'items'}</Text>
        </View>
        <TouchableOpacity onPress={clearCart} style={styles.clearBtn}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Items List */}
      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={8}
        ListFooterComponent={
          <View style={styles.summaryCard}>
            {/* Savings Banner */}
            <View style={styles.savingsBanner}>
              <View style={styles.savingsIcon}>
                <Feather name="tag" size={13} color="#059669" />
              </View>
              <Text style={styles.savingsText}>
                You're saving <Text style={{ fontWeight: '800' }}>₨{savings}</Text> vs market price! 🎉
              </Text>
            </View>

            <Text style={styles.summaryTitle}>Order Summary</Text>

            <SummaryRow label="Subtotal" value={`₨ ${totalPrice.toLocaleString()}`} />
            <SummaryRow label="Delivery Fee" value={`₨ ${deliveryFee}`} />
            <SummaryRow label="GST (5%)" value={`₨ ${gst}`} />

            <View style={styles.divider} />

            <SummaryRow label="Total Amount" value={`₨ ${grandTotal.toLocaleString()}`} bold />

            {/* Escrow Trust Note */}
            <View style={styles.escrowNote}>
              <Feather name="shield" size={13} color={Colors.info} />
              <Text style={styles.escrowText}>
                Protected by escrow — funds released only after confirmed delivery.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => router.push('/(buyer)/checkout')}
              activeOpacity={0.85}
            >
              <Text style={styles.checkoutText}>Proceed to Checkout</Text>
              <View style={styles.checkoutArrow}>
                <Feather name="arrow-right" size={16} color={Colors.primary} />
              </View>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFB' },

  // Custom Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 58 : 44,
    paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#F8FAFB',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827', lineHeight: 22 },
  headerSub: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  clearBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
  },
  clearText: { fontSize: 12, fontWeight: '700', color: Colors.error },

  // List
  listContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40 },

  // Cart Row
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1, borderColor: '#F1F5F9',
    marginBottom: 10, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  rowThumb: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  rowEmoji: { fontSize: 30 },
  rowInfo: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 },
  rowName: { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
  deleteBtn: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: '#F8FAFB',
    alignItems: 'center', justifyContent: 'center',
  },
  rowFarmer: { fontSize: 11, color: Colors.textSecondary, marginBottom: 10 },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  // Stepper
  stepper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, overflow: 'hidden', backgroundColor: '#FAFAFA',
  },
  stepBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  stepBtnDanger: { backgroundColor: '#FEF2F2' },
  stepQty: { width: 32, textAlign: 'center', fontWeight: '800', color: '#111827', fontSize: 14 },

  // Prices
  priceCol: { alignItems: 'flex-end' },
  subTotal: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  unitPrice: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },

  // Summary Card
  summaryCard: {
    backgroundColor: '#fff', borderRadius: 24,
    padding: 20, marginTop: 4,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  savingsBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 14, padding: 12, marginBottom: 20,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  savingsIcon: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center', justifyContent: 'center',
  },
  savingsText: { fontSize: 13, color: '#065F46', fontWeight: '600', flex: 1, lineHeight: 18 },
  summaryTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 14 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  sumLabel: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  sumValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },

  escrowNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 12, padding: 12, marginTop: 4, marginBottom: 16,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  escrowText: { fontSize: 12, color: '#1E40AF', fontWeight: '500', flex: 1, lineHeight: 18 },

  checkoutBtn: {
    backgroundColor: '#111827',
    borderRadius: 16, height: 56,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, justifyContent: 'space-between',
  },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  checkoutArrow: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },

  // Empty
  emptyRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#F8FAFB' },
  emptyIconWrap: {
    width: 100, height: 100, borderRadius: 30,
    backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1, borderColor: '#DCFCE7',
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  emptyBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
