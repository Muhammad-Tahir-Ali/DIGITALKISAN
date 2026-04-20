import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { MOCK_ORDERS, MOCK_CROPS } from '@/constants/mockData';

export default function FarmerDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setRole = useAuthStore((s) => s.setRole);

  const isVerified = user?.isVerified ?? false;

  const handleSwitchToBuyer = () => {
    setRole('buyer');
    router.replace('/(buyer)/home');
  };

  const pendingOrders = MOCK_ORDERS.filter((o) => o.status === 'Active');

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
      {/* 1. TOP BAR */}
      <View className="px-6 pt-16 pb-6 bg-white border-b border-gray-100">
        <View className="flex-row justify-between items-center mb-4">
          <View>
             <Text className="text-textSecondary text-sm font-medium">Welcome back,</Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={handleSwitchToBuyer} className="mr-4">
              <Text className="text-xs font-bold text-primary">Switch to Buyer 🔄</Text>
            </TouchableOpacity>
            <TouchableOpacity className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100 relative">
              <Feather name="bell" size={20} color={Colors.textPrimary} />
              <View className="absolute top-2 right-2.5 w-2 h-2 bg-error rounded-full" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row items-center flex-wrap gap-3">
          <Text className="text-textPrimary text-3xl font-bold">
            {user?.name ?? 'Farmer'} 👋
          </Text>
          {isVerified ? (
            <View className="bg-successLight px-3 py-1.5 rounded-full flex-row items-center border border-success/30">
               <Text className="text-successDark text-xs font-bold">Verified Farmer</Text>
            </View>
          ) : null}
        </View>

        {!isVerified && (
          <View className="mt-4 bg-warningLight border border-warning px-4 py-3 rounded-xl flex-row items-center">
            <Text className="text-warningDark text-lg mr-3">⚠️</Text>
            <Text className="text-warningDark font-medium flex-1 text-sm">Account pending verification. Some features may be limited.</Text>
          </View>
        )}
      </View>

      {/* 2. OVERVIEW CARDS */}
      <View className="px-6 py-6">
        <View className="flex-row flex-wrap justify-between gap-y-4">
          <OverviewCard icon="📦" label="Total Products" value="12" subtext="In inventory" />
          <OverviewCard icon="🔄" label="Active Orders" value="3" subtext="In Progress" />
          <OverviewCard icon="✅" label="Completed Orders" value="28" subtext="This month" />
          <OverviewCard icon="💰" label="Total Earnings" value="₨ 45k" subtext="All time" />
        </View>
      </View>

      {/* 3. QUICK ACTIONS */}
      <View className="px-6 mb-8">
        <Text className="text-lg font-bold text-textPrimary mb-4">Quick Actions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible">
          <QuickAction icon="📷" label="Add Product" onPress={() => router.push('/(farmer)/products/add' as any)} />
          <QuickAction icon="📋" label="My Products" onPress={() => router.push('/(farmer)/products' as any)} />
          <QuickAction icon="💳" label="Orders" onPress={() => router.push('/(farmer)/orders' as any)} />
          <QuickAction icon="⭐" label="Wallet" />
        </ScrollView>
      </View>

      {/* 4. PENDING ORDERS */}
      <View className="px-6 mb-8">
        <View className="flex-row items-center mb-4">
          <Text className="text-lg font-bold text-textPrimary mr-2">Pending Orders</Text>
          <View className="bg-amber-100 px-2 py-0.5 rounded-full">
            <Text className="text-amber-700 font-bold text-xs">{pendingOrders.length}</Text>
          </View>
        </View>

        {pendingOrders.length > 0 ? (
           pendingOrders.map((order) => (
             <View key={order.id} className="bg-white p-4 rounded-2xl mb-3 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-start mb-2">
                   <Text className="font-bold text-textPrimary">{order.id} • Customer</Text>
                   <Text className="text-xs text-textSecondary">{order.date}</Text>
                </View>
                <Text className="text-textSecondary text-xs mb-3">{order.items.length} items • ₨{order.total}</Text>
                <TouchableOpacity 
                   className="bg-primaryLight py-2 rounded-xl items-center border border-primary-200"
                   onPress={() => router.push(`/(farmer)/orders/${order.id}` as any)}
                >
                   <Text className="text-primaryDark font-bold text-sm">View Order</Text>
                </TouchableOpacity>
             </View>
           ))
        ) : (
          <View className="bg-gray-50 rounded-2xl p-6 items-center justify-center border border-dashed border-gray-200">
             <Text className="text-textSecondary text-sm font-medium">No pending orders yet 🌾</Text>
          </View>
        )}
      </View>

      {/* 5. MY ACTIVE LISTINGS */}
      <View className="mb-12">
        <View className="px-6 flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold text-textPrimary">My Active Listings</Text>
          <TouchableOpacity>
             <Text className="text-primary font-bold text-sm">See All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}>
           {MOCK_CROPS.map((crop) => (
             <View key={crop.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 w-40">
                <View className="h-24 bg-green-50 rounded-xl items-center justify-center mb-3">
                   <Text className="text-4xl">{crop.emoji}</Text>
                </View>
                <Text className="font-bold text-textPrimary text-sm mb-1" numberOfLines={1}>{crop.name}</Text>
                <Text className="text-primary font-bold mb-2">₨{crop.price}<Text className="text-xs text-textSecondary font-normal">/{crop.unit}</Text></Text>
                <View className="bg-successLight px-2 py-1 rounded-md self-start border border-success/20">
                   <Text className="text-successDark text-[10px] font-bold">Active</Text>
                </View>
             </View>
           ))}
        </ScrollView>
      </View>

    </ScrollView>
  );
}

function OverviewCard({ icon, label, value, subtext }: { icon: string; label: string; value: string; subtext: string }) {
  return (
    <View className="w-[48%] bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex-col">
       <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mb-3 border border-gray-100">
          <Text className="text-xl">{icon}</Text>
       </View>
       <Text className="text-2xl font-bold text-textPrimary mb-1">{value}</Text>
       <Text className="text-xs font-semibold text-textPrimary mb-1" numberOfLines={1}>{label}</Text>
       <Text className="text-[10px] text-textSecondary mb-3">{subtext}</Text>
       <TouchableOpacity className="flex-row items-center mt-auto">
          <Text className="text-amber-600 text-[10px] font-bold uppercase">View Details ›</Text>
       </TouchableOpacity>
    </View>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} className="mr-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 items-center justify-center w-[100px] h-[100px]">
       <Text className="text-4xl mb-2">{icon}</Text>
       <Text className="text-sm font-bold text-textPrimary text-center" numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}
