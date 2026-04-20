import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import type { Crop } from '@/constants/mockData';
import { AiBadge } from './AiBadge';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/components/shared/Toast';

interface Props {
  item: Crop;
}

export const ProductCard = React.memo(function ProductCard({ item }: Props) {
  const router = useRouter();
  const addItem = useCartStore(s => s.addItem);
  const { showToast } = useToast();

  const handleAddToCart = useCallback(() => {
    addItem({
      id: item.id,
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      unit: item.unit,
      farmerId: item.farmerId,
      farmerName: item.farmerName,
      maxStock: item.stockKg,
    });
    showToast({
      title: 'Added to Cart',
      message: `${item.name} has been added to your cart.`,
      variant: 'success',
    });
  }, [item, addItem, showToast]);

  const handlePress = useCallback(() => {
    router.push(`/(buyer)/products/detail/${item.id}` as any);
  }, [item.id, router]);

  const hasImage = item.images && item.images.length > 0;
  const isLowStock = item.stockKg < 100;

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.92}>
      {/* ─── IMAGE AREA ─────────────────────────── */}
      <View style={styles.imageArea}>
        {hasImage ? (
          <Image
            source={typeof item.images[0] === 'string' ? { uri: item.images[0] } : item.images[0]}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.emojiWrap}>
            <Text style={styles.emoji}>{item.emoji}</Text>
          </View>
        )}
        
        {/* AI Badge */}
        <View style={styles.badgeOverlay}>
          <AiBadge grade={item.quality} size="sm" />
        </View>

        {/* Low stock ribbon */}
        {isLowStock && (
          <View style={styles.stockRibbon}>
            <Feather name="alert-circle" size={9} color="#fff" />
            <Text style={styles.stockRibbonText}>{item.stockKg}kg left</Text>
          </View>
        )}
      </View>

      {/* ─── BODY ───────────────────────────────── */}
      <View style={styles.body}>
        {/* Product Name */}
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>

        {/* Farmer Info Pill */}
        <View style={styles.farmerPill}>
          <Feather name="map-pin" size={9} color={Colors.textSecondary} />
          <Text style={styles.farmerText} numberOfLines={1}>
            {item.farmerCity}
          </Text>
        </View>

        {/* Price + Add to Cart */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>₨{item.price}</Text>
            <Text style={styles.unit}>per {item.unit}</Text>
          </View>
          <TouchableOpacity
            onPress={handleAddToCart}
            style={styles.cartBtn}
            activeOpacity={0.8}
            hitSlop={4}
          >
            <Feather name="plus" size={16} color="#fff" />
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
    borderColor: '#F1F5F9',
  },

  // Image
  imageArea: {
    height: 148,
    backgroundColor: '#F0FDF4',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  emojiWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4FAF4',
  },
  emoji: { fontSize: 58 },

  // Overlays
  badgeOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  stockRibbon: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(220, 38, 38, 0.88)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 4,
  },
  stockRibbonText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.2 },

  // Body
  body: { padding: 12 },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 5,
    letterSpacing: -0.2,
  },
  farmerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  farmerText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  unit: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', marginTop: 1 },
  cartBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
});
