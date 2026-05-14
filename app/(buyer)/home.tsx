import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, Platform, TextInput, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Bell, ShoppingCart, Search, X, Wheat, Carrot, Apple, Leaf, Star, ShieldCheck, Repeat } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { MOCK_CATEGORIES } from '@/constants/mockData';
import { useCartStore } from '@/store/cartStore';
import productService, { Product } from '@/services/product.service';
import { useAuthStore } from '@/store/authStore';
import { SkeletonLoader, LazyImage } from '@/components/ui';

// Map mock categories to Lucide icons
const getCategoryIcon = (name: string, color: string) => {
  switch (name) {
    case 'Grains': return <Wheat size={24} color={color} strokeWidth={1.5} />;
    case 'Vegetables': return <Carrot size={24} color={color} strokeWidth={1.5} />;
    case 'Fruits': return <Apple size={24} color={color} strokeWidth={1.5} />;
    case 'Pulses': return <Leaf size={24} color={color} strokeWidth={1.5} />;
    default: return <Leaf size={24} color={color} strokeWidth={1.5} />;
  }
};

// Memoized product card to avoid re-rendering every card on every list update.
const ProductCard = React.memo(function ProductCard({
  item, onPress,
}: { item: Product; onPress: (id: string) => void }) {
  return (
    <TouchableOpacity
      className="w-[48%] bg-surface rounded-2xl border border-border p-3 mb-4 shadow-sm"
      onPress={() => onPress(item._id)}
      activeOpacity={0.8}
    >
      <View className="aspect-square rounded-xl mb-3 overflow-hidden">
        <LazyImage
          uri={item.images?.[0]}
          style={{ width: '100%', height: '100%' }}
          fallback={<Wheat size={32} color={Colors.textTertiary} strokeWidth={1.5} />}
        />
      </View>
      <Text className="text-sm font-bold text-textPrimary mb-1" numberOfLines={1}>{item.title}</Text>
      <Text className="text-base font-black text-primary mb-2">
        ₨{item.pricePerUnit}
        <Text className="text-xs text-textSecondary font-medium">/{item.unit}</Text>
      </Text>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Star size={12} color={Colors.warning} fill={Colors.warning} />
          <Text className="text-xs font-bold text-textSecondary ml-1">{item.rating}</Text>
        </View>
        <View className="flex-row items-center bg-green-50 px-2 py-1 rounded">
          <ShieldCheck size={10} color={Colors.success} />
          <Text className="text-[9px] font-bold text-success ml-1">Verified</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function BuyerHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const totalItems = useCartStore(s => s.totalItems);
  const user = useAuthStore(s => s.user);
  const [searchQuery, setSearchQuery] = useState('');

  // React Query: caches the product list (5min staleTime in root config), avoids
  // refetching when navigating back to home, and shares cache with detail screen.
  const { data: products = [], isLoading: loading } = useQuery<Product[]>({
    queryKey: ['products', 'all'],
    queryFn: () => productService.getAll(),
  });

  const isSearching = searchQuery.trim().length > 0;

  const displayedProducts = useMemo(() => {
    if (!isSearching) return products;
    const q = searchQuery.toLowerCase().trim();
    return products.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.farmer?.name ?? '').toLowerCase().includes(q)
    );
  }, [products, searchQuery, isSearching]);

  const navigateToDetail = useCallback(
    (productId: string) => router.push(`/(buyer)/products/detail/${productId}` as any),
    [router]
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 40 : 0) }}>
      {/* ── HEADER ── */}
      <View className="px-5 py-4 flex-row justify-between items-center bg-surface border-b border-border">
        <View>
          <Text className="text-xs font-bold text-textSecondary uppercase tracking-wider">Salaam, {user?.name?.split(' ')[0] ?? 'Buyer'}</Text>
          <Text className="text-xl font-black text-textPrimary tracking-tight">DigitalKisan</Text>
        </View>
        <View className="flex-row gap-3">
          <TouchableOpacity 
            className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center border border-primary/20"
            onPress={() => {
              useAuthStore.getState().setRole('farmer');
              router.replace('/(farmer)/dashboard');
            }}
          >
            <Repeat size={18} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center border border-border">
            <Bell size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity 
            className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center border border-border relative"
            onPress={() => router.push('/(buyer)/cart')}
          >
            <ShoppingCart size={20} color={Colors.textPrimary} />
            {totalItems > 0 && (
              <View className="absolute -top-1 -right-1 bg-error min-w-[18px] h-[18px] rounded-full items-center justify-center border-2 border-surface">
                <Text className="text-[9px] font-black text-white">{totalItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* ── SEARCH ── */}
        <View className="px-5 pt-6 pb-4">
          <View
            className="flex-row items-center bg-surface h-12 rounded-2xl px-4 border"
            style={{ borderColor: isSearching ? Colors.primary : Colors.border }}
          >
            <Search size={20} color={isSearching ? Colors.primary : Colors.textTertiary} />
            <TextInput
              className="flex-1 ml-3 text-textPrimary font-medium text-sm"
              placeholder="Search produce, category, or farmer..."
              placeholderTextColor={Colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {isSearching && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                <X size={18} color={Colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── HERO + CATEGORIES (hidden while searching) ── */}
        {!isSearching && (
          <>
            {/* ── HERO BANNER ── */}
            <View className="px-5 mb-6">
              <View className="bg-primary rounded-3xl p-6 relative overflow-hidden flex-row items-center">
                <View className="flex-1 z-10">
                  <View className="bg-white/20 self-start px-2 py-1 rounded border border-white/30 mb-3">
                    <Text className="text-[10px] font-bold text-white tracking-widest uppercase">Direct from farm</Text>
                  </View>
                  <Text className="text-2xl font-black text-white leading-7 mb-2">Fresh Harvest{'\n'}Best Prices</Text>
                  <Text className="text-xs text-white/80 font-medium">No middlemen, 100% verified.</Text>
                </View>
                <View className="absolute right-[-20px] bottom-[-20px] opacity-10" pointerEvents="none">
                  <Wheat size={160} color="#FFF" strokeWidth={1} />
                </View>
              </View>
            </View>

            {/* ── CATEGORIES ── */}
            <View className="mb-8">
              <View className="px-5 flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-textPrimary">Categories</Text>
                <TouchableOpacity onPress={() => router.push('/(buyer)/categories' as any)}>
                  <Text className="text-sm font-bold text-primary">See All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}>
                {MOCK_CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat.id} className="items-center" onPress={() => router.push(`/(buyer)/products/${cat.name}` as any)}>
                    <View className="w-16 h-16 rounded-full bg-surface items-center justify-center border border-border shadow-sm mb-2">
                      {getCategoryIcon(cat.name, Colors.primary)}
                    </View>
                    <Text className="text-xs font-bold text-textSecondary">{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        )}

        {/* ── PRODUCT GRID ── */}
        <View className="px-5 pb-8">
          {/* Section header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-textPrimary">
              {isSearching ? `Results for "${searchQuery.trim()}"` : 'Freshly Listed'}
            </Text>
            {isSearching && !loading && (
              <Text className="text-xs font-bold text-textSecondary">
                {displayedProducts.length} found
              </Text>
            )}
          </View>

          {loading ? (
            <SkeletonLoader.ProductGrid count={4} />
          ) : displayedProducts.length === 0 ? (
            <View className="items-center py-12">
              <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
                <Search size={36} color={Colors.textTertiary} />
              </View>
              <Text className="text-base font-bold text-textPrimary mb-1">No products found</Text>
              <Text className="text-sm text-textSecondary text-center px-6 mb-5">
                No results for "{searchQuery.trim()}". Try a different name or category.
              </Text>
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                className="px-6 py-3 rounded-2xl"
                style={{ backgroundColor: Colors.primary }}
              >
                <Text className="text-white font-bold text-sm">Clear Search</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // FlatList virtualizes off-screen rows so 100+ products stay smooth.
            // scrollEnabled={false} because it's inside a parent ScrollView.
            <FlatList
              data={displayedProducts}
              keyExtractor={item => item._id}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
              renderItem={({ item }) => (
                <ProductCard item={item} onPress={navigateToDetail} />
              )}
              scrollEnabled={false}
              initialNumToRender={6}
              windowSize={5}
              removeClippedSubviews
              maxToRenderPerBatch={8}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
