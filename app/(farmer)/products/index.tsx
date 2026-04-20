import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { MOCK_CROPS } from '@/constants/mockData';

const FILTER_TABS = ['All', 'Active', 'Low Stock', 'Out of Stock'];
const CATEGORIES = ['All', 'Grains', 'Vegetables', 'Fruits'];

export default function MyProductsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');

  // Augment mock crops with some extra status data for demonstration
  const [products, setProducts] = useState(
    MOCK_CROPS.map((crop, idx) => ({
      ...crop,
      isActive: true, // Defaulting to active
      stockCount: idx === 2 ? 0 : idx === 3 ? 15 : 250, // Making Tomatoes Out of stock, Mango low stock
      views: Math.floor(Math.random() * 500) + 10,
      orders: Math.floor(Math.random() * 50) + 1
    }))
  );

  const toggleProductStatus = (id: string) => {
    setProducts(products.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  };

  const getFilteredProducts = () => {
    let filtered = products;
    
    // Status Filter
    if (activeTab === 'Active') filtered = filtered.filter(p => p.isActive && p.stockCount > 0);
    else if (activeTab === 'Low Stock') filtered = filtered.filter(p => p.stockCount > 0 && p.stockCount <= 50);
    else if (activeTab === 'Out of Stock') filtered = filtered.filter(p => p.stockCount === 0);

    // Category Filter (Mock data doesn't have proper category string, matching by emoji/name heuristics for demo)
    if (activeCategory !== 'All') {
      filtered = filtered.filter(p => {
        if (activeCategory === 'Grains') return p.emoji === '🌾' || p.emoji === '🍚';
        if (activeCategory === 'Vegetables') return p.emoji === '🍅' || p.emoji === '🥦';
        if (activeCategory === 'Fruits') return p.emoji === '🥭' || p.emoji === '🍎';
        return true;
      });
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  const renderProductCard = ({ item }: { item: typeof products[0] }) => {
    const isOut = item.stockCount === 0;
    const isLow = item.stockCount > 0 && item.stockCount <= 50;

    return (
      <View className={`bg-white rounded-2xl mb-4 shadow-sm border ${!item.isActive ? 'border-gray-200 bg-gray-50' : 'border-gray-100'} p-4`}>
        <View className="flex-row">
          {/* Image Node */}
          <View className={`w-20 h-20 rounded-xl items-center justify-center mr-4 relative ${!item.isActive ? 'bg-gray-200' : 'bg-green-50'}`}>
             <Text className={`text-4xl ${!item.isActive ? 'opacity-50' : ''}`}>{item.emoji}</Text>
             <View className="absolute -top-2 -right-2 bg-white rounded-full shadow-sm">
               <View className={`px-2 py-0.5 rounded-full border flex-row items-center gap-x-1 ${item.quality === 'Grade A' ? 'bg-purple-100 border-purple-300' : item.quality === 'Grade B' ? 'bg-green-100 border-green-300' : 'bg-orange-100 border-orange-300'}`}>
                 <Feather name="cpu" size={8} color={item.quality === 'Grade A' ? '#9333ea' : item.quality === 'Grade B' ? '#16a34a' : '#ea580c'} />
                 <Text className={`text-[9px] font-bold ${item.quality === 'Grade A' ? 'text-purple-700' : item.quality === 'Grade B' ? 'text-green-700' : 'text-orange-700'}`}>
                   {item.quality === 'Grade A' ? 'AI Premium' : item.quality === 'Grade B' ? 'AI Standard' : 'AI Low'}
                 </Text>
               </View>
             </View>
          </View>
          
          <View className="flex-1 justify-between py-0.5">
             <View className="flex-row justify-between items-start">
                <View className="flex-1 pr-2">
                   <Text className={`font-bold text-base ${!item.isActive ? 'text-gray-400' : 'text-textPrimary'}`}>{item.name}</Text>
                   <Text className="text-primary font-bold text-sm mt-0.5" adjustsFontSizeToFit numberOfLines={1}>₨{item.price}<Text className="text-[10px] text-textSecondary font-medium">/{item.unit}</Text></Text>
                </View>
                {/* Status Switch */}
                <Switch 
                   value={item.isActive} 
                   onValueChange={() => toggleProductStatus(item.id)} 
                   trackColor={{ false: Colors.gray[200], true: Colors.successLight }}
                   thumbColor={item.isActive ? Colors.success : Colors.gray[400]}
                   style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
             </View>

             <View className="flex-row items-center mt-2">
                <View className={`px-2 py-0.5 rounded mr-2 ${isOut ? 'bg-error-light' : isLow ? 'bg-warning-light' : 'bg-gray-100'}`}>
                   <Text className={`text-[10px] font-bold ${isOut ? 'text-error-dark' : isLow ? 'text-warning-dark' : 'text-textSecondary'}`}>
                     Stock: {item.stockCount} {item.unit}
                   </Text>
                </View>
             </View>
          </View>
        </View>

        {/* Footer actions */}
        <View className="flex-row justify-between items-center mt-4 pt-3 border-t border-gray-100">
           <View className="flex-row items-center space-x-3">
              <View className="flex-row items-center mr-3">
                 <Feather name="eye" size={12} color={Colors.textSecondary} />
                 <Text className="text-[10px] text-textSecondary ml-1">{item.views} views</Text>
              </View>
              <View className="flex-row items-center">
                 <Feather name="shopping-bag" size={12} color={Colors.textSecondary} />
                 <Text className="text-[10px] text-textSecondary ml-1">{item.orders} orders</Text>
              </View>
           </View>
           <View className="flex-row space-x-1 border border-gray-100 rounded-lg overflow-hidden bg-gray-50">
              <TouchableOpacity className="p-2 border-r border-gray-100 bg-white" onPress={() => router.push('/(farmer)/products/add' as any)}>
                 <Feather name="edit-2" size={14} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity className="p-2 bg-white">
                 <Feather name="trash-2" size={14} color={Colors.error} />
              </TouchableOpacity>
           </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background pt-14">
      <View className="px-6 mb-4 flex-row justify-between items-center">
        <Text className="text-3xl font-bold text-textPrimary">My Products</Text>
      </View>

      {/* Main Tabs */}
      <View className="flex-row px-6 mb-4 border-b border-gray-100">
        {FILTER_TABS.map(tab => (
          <TouchableOpacity 
            key={tab} 
            onPress={() => setActiveTab(tab)}
            className="mr-6 pb-2 relative"
          >
            <Text className={`font-bold ${activeTab === tab ? 'text-primary' : 'text-textSecondary'}`}>{tab}</Text>
            {activeTab === tab && <View className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full" />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Chips */}
      <View className="mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
           {CATEGORIES.map(cat => (
             <TouchableOpacity 
               key={cat} 
               onPress={() => setActiveCategory(cat)}
               className={`px-4 py-1.5 rounded-full mr-2 border ${activeCategory === cat ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
             >
               <Text className={`text-xs font-semibold ${activeCategory === cat ? 'text-white' : 'text-textSecondary'}`}>{cat}</Text>
             </TouchableOpacity>
           ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id}
        renderItem={renderProductCard}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-6xl mb-4 opacity-50">🌱</Text>
            <Text className="text-textPrimary font-bold text-lg mb-2">No products found</Text>
            <Text className="text-textSecondary text-center mb-6">You haven't listed any items that match this criteria.</Text>
            <TouchableOpacity 
               onPress={() => router.push('/(farmer)/products/add' as any)}
               className="bg-primary px-6 py-3 rounded-xl shadow-sm"
            >
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
