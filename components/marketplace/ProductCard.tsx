import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import type { Crop } from '@/constants/mockData';
import { AiBadge } from './AiBadge';
import { useCartStore } from '@/store/cartStore';

interface Props {
  item: Crop;
}

export const ProductCard = React.memo(function ProductCard({ item }: Props) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

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
  }, [item, addItem]);

  const handlePress = useCallback(() => {
    router.push(`/(buyer)/products/detail/${item.id}` as any);
  }, [item.id, router]);

  const hasImage = item.images && item.images.length > 0;

  return (
    <View style={styles.card}>
      {/* Tappable image area */}
      <TouchableOpacity onPress={handlePress} activeOpacity={0.85} style={styles.imageArea}>
        {hasImage ? (
          <Image 
            source={typeof item.images[0] === 'string' ? { uri: item.images[0] } : item.images[0]} 
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.emoji}>{item.emoji}</Text>
        )}
        {/* AI Badge — top-right overlay */}
        <View style={styles.badgeOverlay}>
          <AiBadge grade={item.quality} size="sm" />
        </View>
        {/* Low stock warning */}
        {item.stockKg < 100 && (
          <View style={styles.stockWarning}>
            <Text style={styles.stockWarningText}>Only {item.stockKg}kg left</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.farmer} numberOfLines={1}>
          {item.farmerName} · {item.farmerCity}
        </Text>

        <View style={styles.row}>
          <View>
            <Text style={styles.price}>₨{item.price}</Text>
            <Text style={styles.unit}>per {item.unit}</Text>
          </View>
          <TouchableOpacity onPress={handleAddToCart} style={styles.cartBtn} activeOpacity={0.8}>
            <Feather name="shopping-cart" size={15} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 22,
    overflow: 'hidden',
    // Premium soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 8,
  },
  imageArea: {
    height: 140,
    backgroundColor: '#F7FBF7', // even softer green
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  emoji: { fontSize: 60, transform: [{ translateY: 5 }] },
  badgeOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  stockWarning: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(234,88,12,0.95)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  stockWarningText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  body: { padding: 14 },
  name: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 4 },
  farmer: { fontSize: 11, color: '#6B7280', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceContainer: { flex: 1 },
  price: { fontSize: 18, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5 },
  unit:  { fontSize: 10,  color: '#9CA3AF', fontWeight: '600', marginTop: 1 },
  cartBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
