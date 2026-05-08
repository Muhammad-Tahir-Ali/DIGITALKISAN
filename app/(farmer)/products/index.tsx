import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Switch, ActivityIndicator, RefreshControl, Alert, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import productService, { Product } from '@/services/product.service';

const FILTER_TABS = ['All', 'Active', 'Low Stock', 'Out of Stock'];
const CATEGORIES = ['All', 'grains', 'vegetables', 'fruits', 'dairy', 'livestock', 'other'];

export default function MyProductsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await productService.getMyProducts();
      setProducts(data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    const doDelete = async () => {
      try {
        await productService.delete(id);
        setProducts(prev => prev.filter(p => p._id !== id));
      } catch {
        Alert.alert('Error', 'Could not delete product. Please try again.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure? This will hide the product.')) {
        doDelete();
      }
    } else {
      Alert.alert('Delete Product', 'Are you sure? This will hide the product.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete }
      ]);
    }
  };

  const getFilteredProducts = () => {
    let filtered = products;
    if (activeTab === 'Active') filtered = filtered.filter(p => p.status === 'active' && p.availableQuantity > 0);
    else if (activeTab === 'Low Stock') filtered = filtered.filter(p => p.availableQuantity > 0 && p.availableQuantity <= 50);
    else if (activeTab === 'Out of Stock') filtered = filtered.filter(p => p.availableQuantity === 0 || p.status === 'sold_out');
    if (activeCategory !== 'All') filtered = filtered.filter(p => p.category === activeCategory);
    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  const renderProductCard = ({ item }: { item: Product }) => {
    const isOut = item.availableQuantity === 0 || item.status === 'sold_out';
    const isLow = item.availableQuantity > 0 && item.availableQuantity <= 50;

    return (
      <View className={`bg-white rounded-2xl mb-4 shadow-sm border ${item.status === 'hidden' ? 'border-gray-200 bg-gray-50' : 'border-gray-100'} p-4`}>
        <View className="flex-row">
          <View className={`w-20 h-20 rounded-xl items-center justify-center mr-4 overflow-hidden ${item.status === 'hidden' ? 'bg-gray-200' : 'bg-green-50'}`}>
            {item.images && item.images.length > 0 ? (
              <Image source={{ uri: item.images[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <Text className="text-4xl">🌾</Text>
            )}
          </View>
          <View className="flex-1 justify-between py-0.5">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-2">
                <Text className={`font-bold text-base ${item.status === 'hidden' ? 'text-gray-400' : 'text-textPrimary'}`}>{item.title}</Text>
                <Text className="text-primary font-bold text-sm mt-0.5">₨{item.pricePerUnit}<Text className="text-[10px] text-textSecondary font-medium">/{item.unit}</Text></Text>
              </View>
              {item.status === 'pending_ai' && (
                <View className="bg-yellow-100 px-2 py-1 rounded">
                  <Text className="text-[10px] font-bold text-yellow-700">Pending AI ⏳</Text>
                </View>
              )}
              {item.status === 'rejected' && (
                <View className="bg-red-100 px-2 py-1 rounded">
                  <Text className="text-[10px] font-bold text-red-700">Rejected ❌</Text>
                </View>
              )}
            </View>
            <View className="flex-row items-center mt-2">
              <View className={`px-2 py-0.5 rounded mr-2 ${isOut ? 'bg-error-light' : isLow ? 'bg-warning-light' : 'bg-gray-100'}`}>
                <Text className={`text-[10px] font-bold ${isOut ? 'text-error-dark' : isLow ? 'text-warning-dark' : 'text-textSecondary'}`}>
                  Stock: {item.availableQuantity} {item.unit}
                </Text>
              </View>
              <View className="px-2 py-0.5 rounded bg-gray-100">
                <Text className="text-[10px] font-bold text-textSecondary capitalize">{item.category}</Text>
              </View>
            </View>
          </View>
        </View>
        <View className="flex-row justify-between items-center mt-4 pt-3 border-t border-gray-100">
          <View className="flex-row items-center">
            <Feather name="star" size={12} color="#F59E0B" />
            <Text className="text-[10px] text-textSecondary ml-1">{item.rating} ({item.ratingsQuantity} reviews)</Text>
          </View>
          <View className="flex-row space-x-1 border border-gray-100 rounded-lg overflow-hidden bg-gray-50">
            <TouchableOpacity className="p-2 border-r border-gray-100 bg-white" onPress={() => router.push({ pathname: '/(farmer)/products/add' as any, params: { productId: item._id } })}>
              <Feather name="edit-2" size={14} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity className="p-2 bg-white" onPress={() => handleDelete(item._id)}>
              <Feather name="trash-2" size={14} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text className="text-textSecondary mt-4 font-semibold">Loading your products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <Feather name="wifi-off" size={32} color={Colors.textSecondary} />
        <Text className="text-textSecondary font-bold mt-4 text-center">{error}</Text>
        <TouchableOpacity onPress={() => fetchProducts()} className="bg-primary px-6 py-3 rounded-xl mt-6">
          <Text className="text-white font-bold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background pt-14">
      <View className="px-6 mb-4 flex-row justify-between items-center">
        <Text className="text-3xl font-bold text-textPrimary">My Products</Text>
      </View>

      {/* Main Tabs */}
      <View className="flex-row px-6 mb-4 border-b border-gray-100">
        {FILTER_TABS.map(tab => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} className="mr-6 pb-2 relative">
            <Text className={`font-bold ${activeTab === tab ? 'text-primary' : 'text-textSecondary'}`}>{tab}</Text>
            {activeTab === tab && <View className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full" />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Chips */}
      <View className="mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat} onPress={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full mr-2 border ${activeCategory === cat ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}>
              <Text className={`text-xs font-semibold capitalize ${activeCategory === cat ? 'text-white' : 'text-textSecondary'}`}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={item => item._id}
        renderItem={renderProductCard}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchProducts(true)} colors={[Colors.primary]} />}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-6xl mb-4 opacity-50">🌱</Text>
            <Text className="text-textPrimary font-bold text-lg mb-2">No products found</Text>
            <Text className="text-textSecondary text-center mb-6">You haven't listed any items that match this criteria.</Text>
            <TouchableOpacity onPress={() => router.push('/(farmer)/products/add' as any)} className="bg-primary px-6 py-3 rounded-xl shadow-sm">
              <Text className="text-white font-bold">Add Your First Product</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* FAB Add Button */}
      <TouchableOpacity
        onPress={() => router.push('/(farmer)/products/add' as any)}
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-2xl items-center justify-center shadow-lg"
        style={{ elevation: 5, shadowColor: Colors.primary, shadowOffset: { height: 4, width: 0 }, shadowRadius: 8 }}
      >
        <Feather name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
