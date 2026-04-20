import { View, Text, ScrollView } from 'react-native';
import { Colors } from '@/constants/colors';

export default function AdminDashboard() {
  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
      <View className="px-6 pt-16 pb-8 rounded-b-3xl" style={{ backgroundColor: '#37474F' }}>
        <Text className="text-white text-2xl font-bold">Admin Dashboard</Text>
        <Text className="text-gray-300 text-sm mt-1">
          Platform overview & management
        </Text>
      </View>

      <View className="px-6 pt-6 pb-10">
        <View className="flex-row flex-wrap gap-4">
          {[
            { label: 'Total Users', value: '0', icon: '👥', bg: '#E8F5E9' },
            { label: 'Active Farmers', value: '0', icon: '🌾', bg: '#FFF9C4' },
            { label: 'Active Buyers', value: '0', icon: '🛒', bg: '#E3F2FD' },
            { label: 'Open Disputes', value: '0', icon: '⚠️', bg: '#FCE4EC' },
          ].map((card) => (
            <View
              key={card.label}
              className="flex-1 min-w-[44%] rounded-2xl p-4"
              style={{ backgroundColor: card.bg }}
            >
              <Text className="text-2xl">{card.icon}</Text>
              <Text className="text-textPrimary font-bold text-2xl mt-2">{card.value}</Text>
              <Text className="text-textSecondary text-xs">{card.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
