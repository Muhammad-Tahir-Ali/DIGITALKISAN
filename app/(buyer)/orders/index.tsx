import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { MOCK_ORDERS } from '@/constants/mockData';
import { Button } from '@/components/ui';

type OrderStatus = 'Active' | 'Delivered' | 'Cancelled';

export default function BuyerOrdersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OrderStatus>('Active');

  const filteredOrders = MOCK_ORDERS.filter(order => order.status === activeTab);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return { text: 'text-green-700', bg: 'bg-green-100', dot: 'bg-green-500' };
      case 'Active': return { text: 'text-amber-700', bg: 'bg-amber-100', dot: 'bg-amber-500' };
      case 'Cancelled': return { text: 'text-red-700', bg: 'bg-red-100', dot: 'bg-red-500' };
      default: return { text: 'text-gray-700', bg: 'bg-gray-100', dot: 'bg-gray-500' };
    }
  };

  const renderOrderCard = ({ item }: { item: typeof MOCK_ORDERS[0] }) => {
    const statusStyle = getStatusColor(item.status);
    const hasMoreItems = item.items.length > 2;

    return (
      <TouchableOpacity 
        onPress={() => router.push(`/(buyer)/orders/${item.id}` as any)}
        className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100"
      >
        <View className="flex-row justify-between items-start mb-3">
          <View>
            <Text className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">{item.id}</Text>
            <Text className="text-textPrimary font-bold text-sm mt-0.5">{item.date}</Text>
          </View>
          <View className={`${statusStyle.bg} px-3 py-1 rounded-full flex-row items-center`}>
            <View className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} mr-1.5`} />
            <Text className={`${statusStyle.text} text-xs font-bold`}>{item.status}</Text>
          </View>
        </View>

        {/* Items Summary */}
        <View className="mb-4">
          <View className="flex-row flex-wrap items-center">
            {item.items.slice(0, 2).map((prod, idx) => (
              <View key={prod.id} className="flex-row items-center mr-3 mb-1">
                <Text className="text-sm mr-1">{prod.emoji}</Text>
                <Text className="text-textSecondary text-xs font-medium">{prod.name} (x{prod.qty})</Text>
              </View>
            ))}
            {hasMoreItems && (
              <Text className="text-primary font-bold text-[10px] bg-primary-50 px-2 py-0.5 rounded-md">
                +{item.items.length - 2} more
              </Text>
            )}
          </View>
          <Text className="text-textSecondary text-[10px] mt-1">
            Sold by <Text className="text-textPrimary font-semibold">{item.farmerName}</Text> • {item.farmName}
          </Text>
        </View>

        {/* Action Row */}
        <View className="flex-row justify-between items-center pt-3 border-t border-gray-50">
          <View className="flex-row gap-x-2">
            <TouchableOpacity className="px-4 py-2 rounded-lg border border-gray-200">
               <Text className="text-gray-600 font-bold text-xs">Reorder</Text>
            </TouchableOpacity>
            {item.status === 'Delivered' && (
              <TouchableOpacity className="px-4 py-2 rounded-lg bg-warning-light border border-warning">
                <Text className="text-warning-dark font-bold text-xs">Rate ★</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text className="text-primary font-bold text-lg">₨{item.total}</Text>
        </View>

        {/* Delivery Progress Bar for Active Orders */}
        {item.status === 'Active' && (
          <View className="mt-4 pt-3 border-t border-gray-50">
            <View className="flex-row justify-between items-center mb-1.5">
              <Text className="text-[10px] font-bold text-textSecondary uppercase">Delivery Progress</Text>
              <Text className="text-[10px] font-bold text-primary">{item.deliveryProgress}%</Text>
            </View>
            <View className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
               <View className="h-full bg-primary" style={{ width: `${item.deliveryProgress}%` }} />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-background pt-14">
      {/* Header */}
      <View className="px-6 mb-6 flex-row justify-between items-center">
        <View>
          <Text className="text-3xl font-bold text-textPrimary">My Orders</Text>
          <Text className="text-textSecondary text-sm">View your purchase history</Text>
        </View>
        <TouchableOpacity className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100">
          <Feather name="sliders" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View className="flex-row px-6 mb-6 border-b border-gray-100">
        {(['Active', 'Delivered', 'Cancelled'] as OrderStatus[]).map((tab) => (
          <TouchableOpacity 
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`mr-8 pb-3 relative`}
          >
            <Text className={`font-bold ${activeTab === tab ? 'text-primary' : 'text-textSecondary'}`}>
              {tab}
            </Text>
            {activeTab === tab && (
              <View className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={item => item.id}
        renderItem={renderOrderCard}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-5xl opacity-20 mb-4">📭</Text>
            <Text className="text-textSecondary font-medium">No {activeTab.toLowerCase()} orders found</Text>
          </View>
        }
      />
    </View>
  );
}
