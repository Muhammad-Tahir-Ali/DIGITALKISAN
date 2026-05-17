import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, MapPin, ShieldCheck, Wheat } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import type { Product } from '@/services/product.service';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/components/shared/Toast';
import { LazyImage } from '@/components/ui';

interface Props {
  item: Product;
}

export const ProductCard = React.memo(function ProductCard({ item }: Props) {
  const router = useRouter();
  const addItem = useCartStore(s => s.addItem);
  const { showToast } = useToast();

  const handleAddToCart = useCallback(() => {
    addItem({
      id: item._id,
      productId: item._id,
      name: item.title,
      price: item.pricePerUnit,
      quantity: 1,
      unit: item.unit,
      image: item.images?.[0],
      farmerId: item.farmer?._id ?? '',
      farmerName: item.farmer?.name ?? 'Unknown',
      maxStock: item.availableQuantity,
    });
    showToast({
      title: 'Added to Cart',
      message: `${item.title} has been added to your cart.`,
      variant: 'success',
    });
  }, [item, addItem, showToast]);

  const handlePress = useCallback(() => {
    router.push(`/(buyer)/products/detail/${item._id}` as any);
  }, [item._id, router]);

  const hasImage = item.images && item.images.length > 0;
  const isLowStock = item.availableQuantity < 50;
  const farmerCity = item.farmer?.location?.address ?? 'Pakistan';

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.9}>
      {/* ─── IMAGE AREA ─────────────────────────── */}
      <View style={styles.imageArea}>
        <LazyImage
          uri={hasImage ? item.images[0] : undefined}
          style={styles.image}
          bgColor={Colors.green[50]}
          fallback={<Wheat size={40} color={Colors.green[300]} strokeWidth={1.5} />}
        />

        {/* Verified Badge */}
        <View style={styles.verifiedBadge}>
          <ShieldCheck size={10} color={Colors.success} />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>

        {/* AI grade badge — top right */}
        {item.aiGrade && item.aiGrade !== 'N/A' && (
          <View style={[
            styles.aiBadge,
            item.aiGrade === 'Grade A' ? styles.aiBadgeA
              : item.aiGrade === 'Grade B' ? styles.aiBadgeB
              : styles.aiBadgeC,
          ]}>
            <Text style={[
              styles.aiBadgeText,
              item.aiGrade === 'Grade A' ? styles.aiBadgeTextA
                : item.aiGrade === 'Grade B' ? styles.aiBadgeTextB
                : styles.aiBadgeTextC,
            ]}>
              {item.aiGrade === 'Grade A' ? 'AI Premium' : item.aiGrade === 'Grade B' ? 'AI Standard' : 'AI Low'}
            </Text>
          </View>
        )}

        {/* Low stock ribbon */}
        {isLowStock && (
          <View style={styles.stockRibbon}>
            <Text style={styles.stockRibbonText}>{item.availableQuantity} {item.unit} left</Text>
          </View>
        )}
      </View>

      {/* ─── BODY ───────────────────────────────── */}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{item.title}</Text>

        <View style={styles.locationRow}>
          <MapPin size={10} color={Colors.textTertiary} />
          <Text style={styles.locationText} numberOfLines={1}>{farmerCity}</Text>
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>₨{item.pricePerUnit}</Text>
            <Text style={styles.unit}>per {item.unit}</Text>
          </View>
          <TouchableOpacity
            onPress={handleAddToCart}
            style={styles.cartBtn}
            activeOpacity={0.8}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Plus size={16} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  imageArea: {
    height: 140,
    backgroundColor: Colors.green[50],
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  placeholderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.green[50],
  },
  verifiedBadge: {
    position: 'absolute', top: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.green[50],
    borderWidth: 1, borderColor: Colors.green[200],
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  verifiedText: { fontSize: 9, fontWeight: '700', color: Colors.success },
  aiBadge: {
    position: 'absolute', top: 8, right: 8,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, borderWidth: 1,
  },
  aiBadgeA: { backgroundColor: '#F3E8FF', borderColor: '#D8B4FE' },
  aiBadgeB: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  aiBadgeC: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' },
  aiBadgeText: { fontSize: 8, fontWeight: '800' },
  aiBadgeTextA: { color: '#7E22CE' },
  aiBadgeTextB: { color: '#15803D' },
  aiBadgeTextC: { color: '#C2410C' },
  stockRibbon: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(220, 38, 38, 0.88)',
    alignItems: 'center', paddingVertical: 4,
  },
  stockRibbonText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  body: { padding: 12 },
  name: {
    fontSize: 13, fontWeight: '800',
    color: Colors.textPrimary, marginBottom: 4,
    letterSpacing: -0.2,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  locationText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', flex: 1 },
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  price: { fontSize: 16, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5 },
  unit: { fontSize: 10, color: Colors.textTertiary, fontWeight: '600', marginTop: 1 },
  cartBtn: {
    width: 34, height: 34, borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 6, elevation: 4,
  },
});
