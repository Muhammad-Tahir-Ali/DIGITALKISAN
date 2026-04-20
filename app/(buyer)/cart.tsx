import React, { useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, Platform, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useCartStore, CartItem } from '@/store/cartStore';
import { Button } from '@/components/ui';

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyCart() {
  const router = useRouter();
  return (
    <View style={styles.emptyRoot}>
      <Text style={{ fontSize: 90, marginBottom: 16 }}>🛒</Text>
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptySub}>
        Add fresh produce from local farmers and enjoy farm-to-table quality.
      </Text>
      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={() => router.push('/(buyer)/home')}
      >
        <Feather name="arrow-left" size={16} color="#fff" />
        <Text style={styles.emptyBtnText}>Browse Products</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Cart item row ────────────────────────────────────────────────────────────
const CartRow = React.memo(function CartRow({ item }: { item: CartItem }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem     = useCartStore((s) => s.removeItem);

  const sub = item.price * item.quantity;

  return (
    <View style={styles.row}>
      {/* Product image area */}
      <View style={styles.rowThumb}>
        <Text style={styles.rowEmoji}>
          {/* emoji from name heuristic */}
          {item.name.includes('Wheat')   ? '🌾' :
           item.name.includes('Rice')    ? '🍚' :
           item.name.includes('Tomato')  ? '🍅' :
           item.name.includes('Mango')   ? '🥭' :
           item.name.includes('Chilli')  ? '🌶️' :
           item.name.includes('Moong')   ? '🫘' :
           item.name.includes('Apple')   ? '🍎' : '🥬'}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.rowInfo}>
        <View style={styles.rowTop}>
          <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
          <TouchableOpacity onPress={() => removeItem(item.productId)} hitSlop={8}>
            <Feather name="trash-2" size={16} color={Colors.error} />
          </TouchableOpacity>
        </View>
        <Text style={styles.rowFarmer}>by {item.farmerName}</Text>

        <View style={styles.rowBottom}>
          {/* Stepper */}
          <View style={styles.stepper}>
            <TouchableOpacity
              onPress={() => updateQuantity(item.productId, item.quantity - 1)}
              style={styles.stepBtn}
            >
              <Feather
                name={item.quantity === 1 ? 'trash-2' : 'minus'}
                size={14}
                color={Colors.textPrimary}
              />
            </TouchableOpacity>
            <Text style={styles.stepQty}>{item.quantity}</Text>
            <TouchableOpacity
              onPress={() => updateQuantity(item.productId, item.quantity + 1)}
              style={styles.stepBtn}
            >
              <Feather name="plus" size={14} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Price */}
          <View style={styles.priceCol}>
            <Text style={styles.subTotal}>₨{sub.toLocaleString()}</Text>
            <Text style={styles.unitPrice}>₨{item.price}/{item.unit}</Text>
          </View>
        </View>
      </View>
    </View>
  );
});

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function CartScreen() {
  const router     = useRouter();
  const items      = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const clearCart  = useCartStore((s) => s.clearCart);

  const delivery = totalPrice > 0 ? 80 : 0;
  const tax      = +(totalPrice * 0.05).toFixed(2);
  const grand    = totalPrice + delivery + tax;

  const keyExtractor = useCallback((item: CartItem) => item.productId, []);
  const renderItem   = useCallback(
    ({ item }: { item: CartItem }) => <CartRow item={item} />,
    [],
  );

  if (items.length === 0) return <EmptyCart />;

  return (
    <View style={styles.root}>
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* ── ITEMS LIST ─────────────────────────────────────────────── */}
      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        // ── Order Summary pinned at bottom of list
        ListFooterComponent={
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>

            <SummaryRow label="Subtotal"       value={`₨${totalPrice.toLocaleString()}`} />
            <SummaryRow label="Delivery Fee"   value={`₨${delivery}`} />
            <SummaryRow label="GST (5%)"       value={`₨${tax}`} />

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₨{grand.toLocaleString()}</Text>
            </View>

            {/* Promo hint */}
            <View style={styles.promoHint}>
              <Feather name="tag" size={13} color={Colors.success} />
              <Text style={styles.promoHintText}>
                You saved ₨{Math.floor(totalPrice * 0.08)} vs market price 🎉
              </Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => router.push('/(buyer)/checkout')}
              activeOpacity={0.85}
            >
              <Text style={styles.checkoutText}>Proceed to Checkout</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

// ─── Summary row helper ───────────────────────────────────────────────────────
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.sumRow}>
      <Text style={styles.sumLabel}>{label}</Text>
      <Text style={styles.sumValue}>{value}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingHorizontal: 20, paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  clearText:   { fontSize: 13, fontWeight: '700', color: Colors.error },

  // List
  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },

  // Cart row
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: 12, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  rowThumb: {
    width: 68, height: 68,
    borderRadius: 14, backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  rowEmoji: { fontSize: 34 },
  rowInfo:  { flex: 1 },
  rowTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  rowName:  { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, flex: 1, marginRight: 6 },
  rowFarmer:{ fontSize: 11, color: Colors.textSecondary, marginBottom: 10 },
  rowBottom:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  // Quantity stepper
  stepper:  {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, overflow: 'hidden',
  },
  stepBtn:  { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  stepQty:  { width: 30, textAlign: 'center', fontWeight: '800', color: Colors.textPrimary, fontSize: 14 },

  // Item prices
  priceCol: { alignItems: 'flex-end' },
  subTotal: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  unitPrice:{ fontSize: 10, color: Colors.textSecondary, marginTop: 2 },

  // Summary card
  summaryCard: {
    backgroundColor: '#fff', borderRadius: 22,
    padding: 20, marginTop: 8,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  summaryTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary, marginBottom: 16 },
  sumRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  sumLabel:{ fontSize: 14, color: Colors.textSecondary },
  sumValue:{ fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 14 },
  totalRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  totalLabel:{ fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  totalValue:{ fontSize: 24, fontWeight: '900', color: Colors.primary },

  promoHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.successLight,
    borderRadius: 10, padding: 10, marginBottom: 16,
  },
  promoHintText: { fontSize: 12, color: Colors.success, fontWeight: '600', flex: 1 },

  checkoutBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16, height: 54,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Empty
  emptyRoot:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: Colors.background },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
  emptySub:   { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  emptyBtn:   {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 16,
  },
  emptyBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
